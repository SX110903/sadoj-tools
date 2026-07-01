import bcrypt from "bcryptjs";
import { RoleType } from "@sadoj/shared";
import { AppError } from "../../shared/errors/AppError";
import {
  CandidateStatus,
  InterviewResult,
  Prisma,
  type PrismaClient,
  type RoleType as PrismaRoleType
} from "../../shared/prisma";
import { isUniqueConstraintError } from "../../shared/prisma-errors";
import { buildPaginationMeta, getPagination, type PaginationMeta } from "../../shared/utils/pagination";
import type { AuthenticatedUser } from "../../types/fastify";
import type {
  ApproveCandidateInput,
  CandidatesQueryInput,
  CreateCandidateInput,
  CreateInterviewInput,
  RejectCandidateInput,
  UpdateCandidateInput,
  UpdateInterviewInput
} from "./hr.schema";

const BCRYPT_ROUNDS = 12;
const PERSON_SELECT = { id: true, displayName: true, username: true, role: true, avatar: true } as const;
const CANDIDATE_INCLUDE = {
  createdBy: { select: PERSON_SELECT },
  approvedUser: { select: { ...PERSON_SELECT, active: true, badgeNumber: true } },
  interview: { include: { interviewer: { select: PERSON_SELECT } } }
} satisfies Prisma.CandidateInclude;

export interface PaginatedCandidates {
  data: unknown[];
  meta: PaginationMeta;
}

export class HrService {
  public constructor(private readonly prisma: PrismaClient) {}

  public async findAll(query: CandidatesQueryInput): Promise<PaginatedCandidates> {
    const pagination = getPagination(query);
    const where: Prisma.CandidateWhereInput = {};

    if (query.status !== undefined) where.status = query.status;
    if (query.search !== undefined) {
      where.OR = [
        { fullName: { contains: query.search, mode: "insensitive" } },
        { contact: { contains: query.search, mode: "insensitive" } }
      ];
    }

    const [total, candidates] = await this.prisma.$transaction([
      this.prisma.candidate.count({ where }),
      this.prisma.candidate.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: "desc" },
        include: CANDIDATE_INCLUDE
      })
    ]);

    return { data: candidates, meta: buildPaginationMeta(total, pagination.page, pagination.limit) };
  }

  public async findById(id: string): Promise<unknown> {
    return this.findCandidateOrThrow(id);
  }

  public async create(data: CreateCandidateInput, actor: AuthenticatedUser): Promise<unknown> {
    return this.prisma.candidate.create({
      data: {
        fullName: data.fullName,
        contact: this.toNullableText(data.contact),
        notes: this.toNullableText(data.notes),
        createdById: actor.id
      },
      include: CANDIDATE_INCLUDE
    });
  }

  public async update(id: string, data: UpdateCandidateInput): Promise<unknown> {
    await this.findCandidateOrThrow(id);

    if (data.status === CandidateStatus.APPROVED || data.status === CandidateStatus.REJECTED) {
      throw new AppError(400, "CANDIDATE_WORKFLOW_REQUIRED", "Usa las acciones de aprobar o rechazar para cambiar a ese estado.");
    }

    const updateData: Prisma.CandidateUpdateInput = {};
    if (data.fullName !== undefined) updateData.fullName = data.fullName;
    if (data.contact !== undefined) updateData.contact = this.toNullableText(data.contact);
    if (data.notes !== undefined) updateData.notes = this.toNullableText(data.notes);
    if (data.status !== undefined) updateData.status = data.status;

    return this.prisma.candidate.update({ where: { id }, data: updateData, include: CANDIDATE_INCLUDE });
  }

  public async delete(id: string): Promise<void> {
    const candidate = await this.findCandidateOrThrow(id);

    if (candidate.approvedUserId !== null) {
      throw new AppError(409, "APPROVED_CANDIDATE", "No se puede eliminar un candidato que ya tiene una cuenta vinculada.");
    }

    await this.prisma.candidate.delete({ where: { id } });
  }

  public async createInterview(candidateId: string, data: CreateInterviewInput, actor: AuthenticatedUser): Promise<unknown> {
    const candidate = await this.findCandidateOrThrow(candidateId);
    this.ensureCandidateIsOpen(candidate.status);
    await this.ensureInterviewerExists(data.interviewerId ?? actor.id);

    const interviewData = this.buildInterviewCreateData(candidateId, data, actor.id);
    this.validateInterviewOutcome(interviewData.result ?? InterviewResult.PENDING, interviewData.score ?? null, interviewData.conductedAt ?? null);

    try {
      return await this.prisma.$transaction(async (transaction) => {
        const interview = await transaction.interview.create({
          data: interviewData,
          include: { interviewer: { select: PERSON_SELECT } }
        });
        if (this.wasInterviewConducted(interview)) {
          await transaction.candidate.update({ where: { id: candidateId }, data: { status: CandidateStatus.INTERVIEWED } });
        }
        return interview;
      });
    } catch (error) {
      if (isUniqueConstraintError(error, ["candidateId"])) {
        throw new AppError(409, "INTERVIEW_ALREADY_EXISTS", "El candidato ya tiene una entrevista registrada.");
      }
      throw error;
    }
  }

  public async updateInterview(candidateId: string, data: UpdateInterviewInput): Promise<unknown> {
    const candidate = await this.findCandidateOrThrow(candidateId);
    this.ensureCandidateIsOpen(candidate.status);

    if (candidate.interview === null) {
      throw new AppError(404, "INTERVIEW_NOT_FOUND", "No se encontró la entrevista del candidato.");
    }

    if (data.interviewerId !== undefined) await this.ensureInterviewerExists(data.interviewerId);
    const updateData = this.buildInterviewUpdateData(data);
    const result = data.result ?? candidate.interview.result;
    const score = data.score === undefined ? candidate.interview.score : data.score;
    const conductedAt = this.resolveConductedAt(data, candidate.interview.conductedAt, result);
    updateData.conductedAt = conductedAt;
    this.validateInterviewOutcome(result, score, conductedAt);

    return this.prisma.$transaction(async (transaction) => {
      const interview = await transaction.interview.update({
        where: { candidateId },
        data: updateData,
        include: { interviewer: { select: PERSON_SELECT } }
      });
      if (this.wasInterviewConducted(interview)) {
        await transaction.candidate.update({ where: { id: candidateId }, data: { status: CandidateStatus.INTERVIEWED } });
      }
      return interview;
    });
  }

  public async approve(id: string, data: ApproveCandidateInput, actor: AuthenticatedUser): Promise<unknown> {
    const password = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

    try {
      return await this.prisma.$transaction(async (transaction) => {
        const candidate = await transaction.candidate.findUnique({ where: { id }, include: { interview: true } });
        if (candidate === null) throw new AppError(404, "CANDIDATE_NOT_FOUND", "No se encontró el candidato solicitado.");
        this.ensureCandidateCanBeApproved(candidate);

        const user = await transaction.user.create({
          data: {
            username: data.username,
            displayName: candidate.fullName,
            password,
            email: this.toNullableText(data.email),
            badgeNumber: this.toNullableText(data.badgeNumber),
            role: RoleType.INVESTIGADOR_JUNIOR as PrismaRoleType
          },
          select: { id: true, username: true, displayName: true, email: true, badgeNumber: true, role: true, active: true, createdAt: true }
        });
        const claimed = await transaction.candidate.updateMany({
          where: { id, approvedUserId: null, status: { in: [CandidateStatus.PENDING, CandidateStatus.INTERVIEWED] } },
          data: { status: CandidateStatus.APPROVED, approvedUserId: user.id }
        });
        if (claimed.count !== 1) {
          throw new AppError(409, "CANDIDATE_ALREADY_RESOLVED", "La candidatura ya fue resuelta por otro usuario.");
        }
        const approved = await transaction.candidate.findUniqueOrThrow({ where: { id }, include: CANDIDATE_INCLUDE });
        await transaction.auditLog.create({
          data: {
            userId: actor.id,
            action: "APPROVE_CANDIDATE",
            entity: "Candidate",
            entityId: id,
            meta: { approvedUserId: user.id, username: user.username, role: RoleType.INVESTIGADOR_JUNIOR }
          }
        });
        return approved;
      });
    } catch (error) {
      if (isUniqueConstraintError(error, ["username"])) {
        throw new AppError(409, "USERNAME_EXISTS", "El nombre de usuario ya está en uso.");
      }
      if (isUniqueConstraintError(error, ["email"])) {
        throw new AppError(409, "EMAIL_EXISTS", "El correo electrónico ya está en uso.");
      }
      if (isUniqueConstraintError(error, ["badgeNumber"])) {
        throw new AppError(409, "BADGE_EXISTS", "El número de placa ya está en uso.");
      }
      throw error;
    }
  }

  public async reject(id: string, data: RejectCandidateInput, actor: AuthenticatedUser): Promise<unknown> {
    return this.prisma.$transaction(async (transaction) => {
      const candidate = await transaction.candidate.findUnique({ where: { id } });
      if (candidate === null) throw new AppError(404, "CANDIDATE_NOT_FOUND", "No se encontró el candidato solicitado.");
      if (candidate.status === CandidateStatus.APPROVED) {
        throw new AppError(409, "CANDIDATE_ALREADY_APPROVED", "No se puede rechazar un candidato ya aprobado.");
      }
      if (candidate.status === CandidateStatus.REJECTED) {
        throw new AppError(409, "CANDIDATE_ALREADY_REJECTED", "El candidato ya está rechazado.");
      }

      const claimed = await transaction.candidate.updateMany({
        where: { id, approvedUserId: null, status: { in: [CandidateStatus.PENDING, CandidateStatus.INTERVIEWED] } },
        data: { status: CandidateStatus.REJECTED }
      });
      if (claimed.count !== 1) {
        throw new AppError(409, "CANDIDATE_ALREADY_RESOLVED", "La candidatura ya fue resuelta por otro usuario.");
      }
      const rejected = await transaction.candidate.findUniqueOrThrow({ where: { id }, include: CANDIDATE_INCLUDE });
      const auditData: Prisma.AuditLogUncheckedCreateInput = {
        userId: actor.id,
        action: "REJECT_CANDIDATE",
        entity: "Candidate",
        entityId: id
      };
      if (data.reason !== undefined) auditData.meta = { reason: data.reason };
      await transaction.auditLog.create({ data: auditData });
      return rejected;
    });
  }

  private async findCandidateOrThrow(id: string) {
    const candidate = await this.prisma.candidate.findUnique({ where: { id }, include: CANDIDATE_INCLUDE });
    if (candidate === null) throw new AppError(404, "CANDIDATE_NOT_FOUND", "No se encontró el candidato solicitado.");
    return candidate;
  }

  private async ensureInterviewerExists(id: string): Promise<void> {
    const interviewer = await this.prisma.user.findFirst({ where: { id, active: true }, select: { id: true } });
    if (interviewer === null) throw new AppError(404, "INTERVIEWER_NOT_FOUND", "No se encontró el entrevistador activo.");
  }

  private ensureCandidateIsOpen(status: CandidateStatus): void {
    if (status === CandidateStatus.APPROVED || status === CandidateStatus.REJECTED) {
      throw new AppError(409, "CANDIDATE_CLOSED", "El proceso de este candidato ya está cerrado.");
    }
  }

  private ensureCandidateCanBeApproved(candidate: { status: CandidateStatus; approvedUserId: string | null; interview: { result: InterviewResult } | null }): void {
    if (candidate.status === CandidateStatus.APPROVED || candidate.approvedUserId !== null) {
      throw new AppError(409, "CANDIDATE_ALREADY_APPROVED", "El candidato ya está aprobado.");
    }
    if (candidate.status === CandidateStatus.REJECTED) {
      throw new AppError(409, "CANDIDATE_REJECTED", "No se puede aprobar un candidato rechazado.");
    }
    if (candidate.interview?.result !== InterviewResult.PASSED) {
      throw new AppError(409, "INTERVIEW_NOT_PASSED", "La entrevista debe estar aprobada antes de crear la cuenta.");
    }
  }

  private buildInterviewCreateData(candidateId: string, data: CreateInterviewInput, actorId: string): Prisma.InterviewUncheckedCreateInput {
    const createData: Prisma.InterviewUncheckedCreateInput = { candidateId, interviewerId: data.interviewerId ?? actorId };
    if (data.scheduledAt !== undefined) createData.scheduledAt = this.toDate(data.scheduledAt);
    if (data.conductedAt !== undefined) createData.conductedAt = this.toDate(data.conductedAt);
    if (data.score !== undefined) createData.score = data.score;
    if (data.result !== undefined) createData.result = data.result;
    if (data.feedback !== undefined) createData.feedback = this.toNullableText(data.feedback);
    return createData;
  }

  private buildInterviewUpdateData(data: UpdateInterviewInput): Prisma.InterviewUncheckedUpdateInput {
    const updateData: Prisma.InterviewUncheckedUpdateInput = {};
    if (data.interviewerId !== undefined) updateData.interviewerId = data.interviewerId;
    if (data.scheduledAt !== undefined) updateData.scheduledAt = this.toDate(data.scheduledAt);
    if (data.score !== undefined) updateData.score = data.score;
    if (data.result !== undefined) updateData.result = data.result;
    if (data.feedback !== undefined) updateData.feedback = this.toNullableText(data.feedback);
    return updateData;
  }

  private resolveConductedAt(data: UpdateInterviewInput, current: Date | null, result: InterviewResult): Date | null {
    if (data.conductedAt !== undefined) return this.toDate(data.conductedAt);
    if (current !== null) return current;
    return result === InterviewResult.PENDING ? null : new Date();
  }

  private validateInterviewOutcome(result: InterviewResult, score: number | null, conductedAt: Date | string | null): void {
    if (result !== InterviewResult.PENDING && (score === null || conductedAt === null)) {
      throw new AppError(400, "INCOMPLETE_INTERVIEW", "Una entrevista finalizada debe incluir nota y fecha de realización.");
    }
  }

  private wasInterviewConducted(interview: { result: InterviewResult; score: number | null; conductedAt: Date | null }): boolean {
    return interview.result !== InterviewResult.PENDING || interview.score !== null || interview.conductedAt !== null;
  }

  private toNullableText(value: string | null | undefined): string | null {
    return value === undefined || value === null || value === "" ? null : value;
  }

  private toDate(value: string | null): Date | null {
    return value === null ? null : new Date(value);
  }
}
