import { hasPermission, Permission, ROLE_LEVEL, RoleType } from "@sadoj/shared";
import { AppError } from "../../shared/errors/AppError";
import {
  AcademyContentType,
  ExamAssignmentStatus,
  Prisma,
  type PrismaClient,
  type RoleType as PrismaRoleType
} from "../../shared/prisma";
import { isUniqueConstraintError } from "../../shared/prisma-errors";
import type { AuthenticatedUser } from "../../types/fastify";
import type {
  AcademyContentQueryInput,
  CreateAcademyClassInput,
  CreateAcademyContentInput,
  MarkAttendanceInput,
  UpdateAcademyClassInput,
  UpdateAcademyContentInput
} from "./academy.schema";

const ACADEMY_CLASS_COUNT = 5;
const PERSON_SELECT = { id: true, displayName: true, username: true, role: true, avatar: true } as const;
const FILE_SELECT = { id: true, originalName: true, mimeType: true, size: true, uploadedById: true, createdAt: true } as const;
const CONTENT_INCLUDE = {
  publishedBy: { select: PERSON_SELECT },
  class: { select: { id: true, number: true, title: true } },
  file: { select: FILE_SELECT }
} satisfies Prisma.AcademyContentInclude;
const CLASS_INCLUDE = {
  instructor: { select: PERSON_SELECT },
  contents: { orderBy: { createdAt: "desc" as const }, include: CONTENT_INCLUDE }
} satisfies Prisma.AcademyClassInclude;

interface ContentVariant {
  type: AcademyContentType;
  body: string | null;
  videoUrl: string | null;
  fileId: string | null;
}

export class AcademyService {
  public constructor(private readonly prisma: PrismaClient) {}

  public async listContent(query: AcademyContentQueryInput): Promise<unknown[]> {
    const where: Prisma.AcademyContentWhereInput = {};
    if (query.type !== undefined) where.type = query.type;
    if (query.classId !== undefined) where.classId = query.classId;
    return this.prisma.academyContent.findMany({ where, orderBy: { createdAt: "desc" }, include: CONTENT_INCLUDE });
  }

  public async findContent(id: string): Promise<unknown> {
    return this.findContentOrThrow(id);
  }

  public async createContent(data: CreateAcademyContentInput, actor: AuthenticatedUser): Promise<unknown> {
    if (data.classId !== undefined && data.classId !== null) await this.findClassOrThrow(data.classId);
    if (data.fileId !== undefined && data.fileId !== null) await this.ensureFileCanBeAttached(data.fileId, actor, null);
    const variant = this.normalizeContentVariant(data.type, data.body, data.videoUrl, data.fileId);
    this.validateContentVariant(variant);

    return this.prisma.$transaction(async (transaction) => {
      const content = await transaction.academyContent.create({
        data: {
          type: data.type,
          title: data.title,
          body: variant.body,
          videoUrl: variant.videoUrl,
          fileId: variant.fileId,
          classId: data.classId ?? null,
          publishedById: actor.id
        },
        include: CONTENT_INCLUDE
      });
      await transaction.auditLog.create({
        data: { userId: actor.id, action: "PUBLISH_ACADEMY_CONTENT", entity: "AcademyContent", entityId: content.id, meta: { type: content.type, classId: content.classId } }
      });
      return content;
    });
  }

  public async updateContent(id: string, data: UpdateAcademyContentInput, actor: AuthenticatedUser): Promise<unknown> {
    const existing = await this.findContentOrThrow(id);
    this.ensureCanModifyContent(existing.publishedById, actor);
    if (data.classId !== undefined && data.classId !== null) await this.findClassOrThrow(data.classId);
    if (data.fileId !== undefined && data.fileId !== null) await this.ensureFileCanBeAttached(data.fileId, actor, id);

    const variant = this.mergeContentVariant(existing, data);
    this.validateContentVariant(variant);
    const updateData = this.buildContentUpdateData(data, variant);

    return this.prisma.$transaction(async (transaction) => {
      const content = await transaction.academyContent.update({ where: { id }, data: updateData, include: CONTENT_INCLUDE });
      await transaction.auditLog.create({
        data: { userId: actor.id, action: "UPDATE_ACADEMY_CONTENT", entity: "AcademyContent", entityId: id, meta: { type: content.type, classId: content.classId } }
      });
      return content;
    });
  }

  public async deleteContent(id: string, actor: AuthenticatedUser): Promise<void> {
    const existing = await this.findContentOrThrow(id);
    this.ensureCanModifyContent(existing.publishedById, actor);

    await this.prisma.$transaction(async (transaction) => {
      await transaction.academyContent.delete({ where: { id } });
      await transaction.auditLog.create({
        data: { userId: actor.id, action: "DELETE_ACADEMY_CONTENT", entity: "AcademyContent", entityId: id, meta: { title: existing.title, type: existing.type } }
      });
    });
  }

  public async listClasses(): Promise<unknown[]> {
    return this.prisma.academyClass.findMany({ orderBy: { number: "asc" }, include: CLASS_INCLUDE });
  }

  public async createClass(data: CreateAcademyClassInput, actor: AuthenticatedUser): Promise<unknown> {
    if (data.instructorId !== undefined && data.instructorId !== null) await this.ensureInstructorExists(data.instructorId);
    try {
      return await this.prisma.$transaction(async (transaction) => {
        const academyClass = await transaction.academyClass.create({
          data: this.buildClassCreateData(data),
          include: CLASS_INCLUDE
        });
        await transaction.auditLog.create({
          data: { userId: actor.id, action: "CREATE_ACADEMY_CLASS", entity: "AcademyClass", entityId: academyClass.id, meta: { number: academyClass.number, title: academyClass.title } }
        });
        return academyClass;
      });
    } catch (error) {
      if (isUniqueConstraintError(error, ["number"])) {
        throw new AppError(409, "ACADEMY_CLASS_EXISTS", "Ya existe una clase con ese número.");
      }
      throw error;
    }
  }

  public async updateClass(id: string, data: UpdateAcademyClassInput, actor: AuthenticatedUser): Promise<unknown> {
    await this.findClassOrThrow(id);
    if (data.instructorId !== undefined && data.instructorId !== null) await this.ensureInstructorExists(data.instructorId);

    try {
      return await this.prisma.$transaction(async (transaction) => {
        const academyClass = await transaction.academyClass.update({
          where: { id },
          data: this.buildClassUpdateData(data),
          include: CLASS_INCLUDE
        });
        await transaction.auditLog.create({
          data: { userId: actor.id, action: "UPDATE_ACADEMY_CLASS", entity: "AcademyClass", entityId: id, meta: { number: academyClass.number, title: academyClass.title } }
        });
        return academyClass;
      });
    } catch (error) {
      if (isUniqueConstraintError(error, ["number"])) {
        throw new AppError(409, "ACADEMY_CLASS_EXISTS", "Ya existe una clase con ese número.");
      }
      throw error;
    }
  }

  public async getClassAttendance(classId: string): Promise<unknown> {
    const academyClass = await this.findClassOrThrow(classId);
    const students = await this.prisma.user.findMany({
      where: { active: true, role: RoleType.INVESTIGADOR_JUNIOR as PrismaRoleType },
      orderBy: { displayName: "asc" },
      select: {
        ...PERSON_SELECT,
        badgeNumber: true,
        classAttendance: { where: { classId }, select: { id: true, present: true, markedAt: true, markedBy: { select: PERSON_SELECT } } }
      }
    });

    return {
      class: { id: academyClass.id, number: academyClass.number, title: academyClass.title },
      students: students.map((student) => ({
        id: student.id,
        displayName: student.displayName,
        username: student.username,
        role: student.role,
        avatar: student.avatar,
        badgeNumber: student.badgeNumber,
        attendance: student.classAttendance[0] ?? null
      }))
    };
  }

  public async markAttendance(classId: string, entries: MarkAttendanceInput, actor: AuthenticatedUser): Promise<unknown> {
    await this.findClassOrThrow(classId);
    const uniqueEntries = [...new Map(entries.map((entry) => [entry.userId, entry])).values()];
    await this.ensureStudentsExist(uniqueEntries.map((entry) => entry.userId));
    const markedAt = new Date();

    await this.prisma.$transaction(async (transaction) => {
      for (const entry of uniqueEntries) {
        await transaction.classAttendance.upsert({
          where: { classId_userId: { classId, userId: entry.userId } },
          create: { classId, userId: entry.userId, present: entry.present, markedById: actor.id, markedAt },
          update: { present: entry.present, markedById: actor.id, markedAt }
        });
      }
      await transaction.auditLog.create({
        data: {
          userId: actor.id,
          action: "MARK_ACADEMY_ATTENDANCE",
          entity: "AcademyClass",
          entityId: classId,
          meta: { students: uniqueEntries.length, present: uniqueEntries.filter((entry) => entry.present).length }
        }
      });
    });

    return this.getClassAttendance(classId);
  }

  public async getMyAttendance(userId: string): Promise<unknown[]> {
    const classes = await this.prisma.academyClass.findMany({
      orderBy: { number: "asc" },
      include: { attendance: { where: { userId }, select: { id: true, present: true, markedAt: true } } }
    });
    return classes.map((academyClass) => ({
      classId: academyClass.id,
      number: academyClass.number,
      title: academyClass.title,
      attendance: academyClass.attendance[0] ?? null
    }));
  }

  public async getMyRecord(userId: string): Promise<unknown> {
    return this.buildAcademicRecord(userId);
  }

  public async getUserRecord(userId: string, requester: AuthenticatedUser): Promise<unknown> {
    if (requester.id !== userId && !hasPermission(requester.role, Permission.MANAGE_ACADEMY)) {
      throw new AppError(403, "FORBIDDEN", "No tienes permisos para consultar este registro académico.");
    }
    return this.buildAcademicRecord(userId);
  }

  private async buildAcademicRecord(userId: string): Promise<unknown> {
    await this.ensureUserExists(userId);
    const [attendance, contentCount, assignments] = await Promise.all([
      this.prisma.classAttendance.findMany({
        where: { userId },
        orderBy: { class: { number: "asc" } },
        include: { class: { select: { id: true, number: true, title: true } } }
      }),
      this.prisma.academyContent.count(),
      this.prisma.examAssignment.findMany({
        where: { userId },
        orderBy: { openedAt: "desc" },
        include: { exam: { select: { id: true, title: true, passScore: true } }, attempt: { select: { score: true, passed: true, submittedAt: true } } }
      })
    ]);
    const attendedClasses = attendance.filter((entry) => entry.present).length;
    return {
      attendedClasses,
      totalClasses: ACADEMY_CLASS_COUNT,
      progressPercent: Math.round((attendedClasses / ACADEMY_CLASS_COUNT) * 100),
      contentCount,
      attendance,
      exam: this.buildExamStatus(assignments)
    };
  }

  private buildExamStatus(assignments: Array<{
    id: string;
    status: ExamAssignmentStatus;
    exam: { id: string; title: string; passScore: number };
    attempt: { score: number; passed: boolean; submittedAt: Date } | null;
  }>): unknown {
    const completed = assignments.find((assignment) => assignment.attempt !== null);
    if (completed?.attempt !== null && completed?.attempt !== undefined) {
      return { status: completed.attempt.passed ? "PASSED" : "FAILED", assignmentId: completed.id, exam: completed.exam, score: completed.attempt.score, submittedAt: completed.attempt.submittedAt };
    }
    const available = assignments.find((assignment) => assignment.status === ExamAssignmentStatus.OPEN);
    if (available !== undefined) return { status: "AVAILABLE", assignmentId: available.id, exam: available.exam, score: null, submittedAt: null };
    return { status: "PENDING", assignmentId: null, exam: null, score: null, submittedAt: null };
  }

  private async findContentOrThrow(id: string) {
    const content = await this.prisma.academyContent.findUnique({ where: { id }, include: CONTENT_INCLUDE });
    if (content === null) throw new AppError(404, "ACADEMY_CONTENT_NOT_FOUND", "No se encontró el contenido solicitado.");
    return content;
  }

  private async findClassOrThrow(id: string) {
    const academyClass = await this.prisma.academyClass.findUnique({ where: { id }, include: CLASS_INCLUDE });
    if (academyClass === null) throw new AppError(404, "ACADEMY_CLASS_NOT_FOUND", "No se encontró la clase solicitada.");
    return academyClass;
  }

  private ensureCanModifyContent(authorId: string, actor: AuthenticatedUser): void {
    const hasElevatedRole = ROLE_LEVEL[actor.role] >= ROLE_LEVEL[RoleType.FISCAL_DIVISION];
    if (authorId !== actor.id && !hasElevatedRole) {
      throw new AppError(403, "FORBIDDEN", "Solo el autor o un rango superior puede modificar este contenido.");
    }
  }

  private async ensureFileCanBeAttached(fileId: string, actor: AuthenticatedUser, contentId: string | null): Promise<void> {
    const file = await this.prisma.file.findUnique({ where: { id: fileId }, select: { id: true, uploadedById: true, academyContent: { select: { id: true } } } });
    if (file === null) throw new AppError(404, "FILE_NOT_FOUND", "No se encontró el archivo solicitado.");
    if (file.uploadedById !== actor.id && !hasPermission(actor.role, Permission.MANAGE_USERS)) {
      throw new AppError(403, "FORBIDDEN", "No puedes publicar un archivo subido por otro usuario.");
    }
    if (file.academyContent !== null && file.academyContent.id !== contentId) {
      throw new AppError(409, "FILE_ALREADY_ATTACHED", "El archivo ya está asociado a otro contenido.");
    }
  }

  private async ensureInstructorExists(id: string): Promise<void> {
    const user = await this.prisma.user.findFirst({ where: { id, active: true }, select: { id: true } });
    if (user === null) throw new AppError(404, "INSTRUCTOR_NOT_FOUND", "No se encontró el instructor activo.");
  }

  private async ensureStudentsExist(userIds: string[]): Promise<void> {
    const users = await this.prisma.user.count({
      where: { id: { in: userIds }, active: true, role: RoleType.INVESTIGADOR_JUNIOR as PrismaRoleType }
    });
    if (users !== userIds.length) {
      throw new AppError(400, "INVALID_ACADEMY_STUDENT", "La asistencia solo puede registrarse para Legal Staff activo.");
    }
  }

  private async ensureUserExists(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (user === null) throw new AppError(404, "USER_NOT_FOUND", "No se encontró el usuario solicitado.");
  }

  private normalizeContentVariant(type: AcademyContentType, body?: string | null, videoUrl?: string | null, fileId?: string | null): ContentVariant {
    return {
      type,
      body: type === AcademyContentType.NOTE || type === AcademyContentType.REGULATION ? body ?? null : null,
      videoUrl: type === AcademyContentType.VIDEO ? videoUrl ?? null : null,
      fileId: type === AcademyContentType.DOCUMENT ? fileId ?? null : null
    };
  }

  private mergeContentVariant(existing: ContentVariant, data: UpdateAcademyContentInput): ContentVariant {
    const type = data.type ?? existing.type;
    return this.normalizeContentVariant(
      type,
      data.body === undefined ? existing.body : data.body,
      data.videoUrl === undefined ? existing.videoUrl : data.videoUrl,
      data.fileId === undefined ? existing.fileId : data.fileId
    );
  }

  private validateContentVariant(content: ContentVariant): void {
    const isText = content.type === AcademyContentType.NOTE || content.type === AcademyContentType.REGULATION;
    if (isText && (content.body === null || content.body.trim() === "")) {
      throw new AppError(400, "ACADEMY_BODY_REQUIRED", "Las notas y normativas requieren contenido de texto.");
    }
    if (content.type === AcademyContentType.VIDEO && content.videoUrl === null) {
      throw new AppError(400, "ACADEMY_VIDEO_REQUIRED", "El vídeo requiere un enlace válido.");
    }
  }

  private buildContentUpdateData(data: UpdateAcademyContentInput, variant: ContentVariant): Prisma.AcademyContentUncheckedUpdateInput {
    const updateData: Prisma.AcademyContentUncheckedUpdateInput = {
      type: variant.type,
      body: variant.body,
      videoUrl: variant.videoUrl,
      fileId: variant.fileId
    };
    if (data.title !== undefined) updateData.title = data.title;
    if (data.classId !== undefined) updateData.classId = data.classId;
    return updateData;
  }

  private buildClassCreateData(data: CreateAcademyClassInput): Prisma.AcademyClassUncheckedCreateInput {
    return {
      number: data.number,
      title: data.title,
      description: data.description ?? null,
      scheduledAt: data.scheduledAt === undefined || data.scheduledAt === null ? null : new Date(data.scheduledAt),
      instructorId: data.instructorId ?? null
    };
  }

  private buildClassUpdateData(data: UpdateAcademyClassInput): Prisma.AcademyClassUncheckedUpdateInput {
    const updateData: Prisma.AcademyClassUncheckedUpdateInput = {};
    if (data.number !== undefined) updateData.number = data.number;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.scheduledAt !== undefined) updateData.scheduledAt = data.scheduledAt === null ? null : new Date(data.scheduledAt);
    if (data.instructorId !== undefined) updateData.instructorId = data.instructorId;
    return updateData;
  }
}
