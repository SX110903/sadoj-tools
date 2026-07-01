import { hasPermission, Permission } from "@sadoj/shared";
import { AppError } from "../../shared/errors/AppError";
import { ExamAssignmentStatus, Prisma, type PrismaClient } from "../../shared/prisma";
import { isUniqueConstraintError } from "../../shared/prisma-errors";
import type { AuthenticatedUser } from "../../types/fastify";
import type { AssignExamInput, CreateExamInput, SubmitExamInput, UpdateAssignmentInput, UpdateExamInput } from "./exams.schema";

interface ExamQuestion {
  q: string;
  o: string[];
  a: number;
}

interface ServedQuestion {
  q: string;
  o: string[];
}

interface ReviewEntry {
  q: string;
  options: string[];
  correct: string;
  selected: string | null;
  isCorrect: boolean;
}

const ASSIGNMENT_INCLUDE = {
  user: { select: { id: true, displayName: true, role: true, avatar: true, badgeNumber: true } },
  openedBy: { select: { id: true, displayName: true, role: true, avatar: true } },
  attempt: { select: { id: true, score: true, passed: true, correctCount: true, totalQuestions: true, submittedAt: true } }
} satisfies Prisma.ExamAssignmentInclude;

export class ExamsService {
  public constructor(private readonly prisma: PrismaClient) {}

  // ───────────────── Admin: exam templates ─────────────────

  public async listExams(): Promise<unknown[]> {
    const exams = await this.prisma.exam.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { id: true, displayName: true, role: true, avatar: true } },
        _count: { select: { assignments: true } }
      }
    });

    return exams.map((exam) => ({
      id: exam.id,
      title: exam.title,
      description: exam.description,
      durationMin: exam.durationMin,
      passScore: exam.passScore,
      isActive: exam.isActive,
      createdBy: exam.createdBy,
      createdAt: exam.createdAt,
      questionCount: this.readQuestions(exam.questions).length,
      assignmentCount: exam._count.assignments
    }));
  }

  public async createExam(data: CreateExamInput, actor: AuthenticatedUser): Promise<unknown> {
    const createData: Prisma.ExamUncheckedCreateInput = {
      title: data.title,
      questions: this.toQuestionsJson(data.questions),
      createdById: actor.id
    };
    if (data.description !== undefined) createData.description = data.description;
    if (data.durationMin !== undefined) createData.durationMin = data.durationMin;
    if (data.passScore !== undefined) createData.passScore = data.passScore;
    if (data.isActive !== undefined) createData.isActive = data.isActive;

    return this.prisma.$transaction(async (transaction) => {
      const exam = await transaction.exam.create({ data: createData });
      await transaction.auditLog.create({
        data: { userId: actor.id, action: "CREATE_EXAM", entity: "Exam", entityId: exam.id, meta: { title: exam.title } }
      });
      return this.toExamSummary(exam);
    });
  }

  public async updateExam(id: string, data: UpdateExamInput, actor: AuthenticatedUser): Promise<unknown> {
    await this.findExamOrThrow(id);

    const updateData: Prisma.ExamUncheckedUpdateInput = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.durationMin !== undefined) updateData.durationMin = data.durationMin;
    if (data.passScore !== undefined) updateData.passScore = data.passScore;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.questions !== undefined) updateData.questions = this.toQuestionsJson(data.questions);

    return this.prisma.$transaction(async (transaction) => {
      const exam = await transaction.exam.update({ where: { id }, data: updateData });
      await transaction.auditLog.create({
        data: { userId: actor.id, action: "UPDATE_EXAM", entity: "Exam", entityId: id, meta: { title: exam.title } }
      });
      return this.toExamSummary(exam);
    });
  }

  public async deleteExam(id: string, actor: AuthenticatedUser): Promise<void> {
    const exam = await this.findExamOrThrow(id);

    await this.prisma.$transaction(async (transaction) => {
      await transaction.exam.delete({ where: { id } });
      await transaction.auditLog.create({
        data: { userId: actor.id, action: "DELETE_EXAM", entity: "Exam", entityId: id, meta: { title: exam.title } }
      });
    });
  }

  // ───────────────── Admin: assignments ─────────────────

  public async listAssignments(examId: string): Promise<unknown[]> {
    await this.findExamOrThrow(examId);
    return this.prisma.examAssignment.findMany({
      where: { examId },
      orderBy: { openedAt: "desc" },
      include: ASSIGNMENT_INCLUDE
    });
  }

  public async openAssignment(examId: string, data: AssignExamInput, actor: AuthenticatedUser): Promise<unknown> {
    await this.findExamOrThrow(examId);
    await this.findUserOrThrow(data.userId);

    const existing = await this.prisma.examAssignment.findUnique({
      where: { examId_userId: { examId, userId: data.userId } }
    });

    if (existing !== null) {
      if (existing.status === ExamAssignmentStatus.COMPLETED) {
        throw new AppError(409, "EXAM_ALREADY_COMPLETED", "El fiscal ya realizó este examen. Elimina la asignación para permitir un nuevo intento.");
      }

      if (existing.status === ExamAssignmentStatus.OPEN) {
        return this.prisma.examAssignment.findUniqueOrThrow({ where: { id: existing.id }, include: ASSIGNMENT_INCLUDE });
      }

      return this.prisma.examAssignment.update({
        where: { id: existing.id },
        data: { status: ExamAssignmentStatus.OPEN, closedAt: null, openedById: actor.id, openedAt: new Date() },
        include: ASSIGNMENT_INCLUDE
      });
    }

    return this.prisma.$transaction(async (transaction) => {
      const assignment = await transaction.examAssignment.create({
        data: { examId, userId: data.userId, openedById: actor.id, status: ExamAssignmentStatus.OPEN },
        include: ASSIGNMENT_INCLUDE
      });
      await transaction.auditLog.create({
        data: { userId: actor.id, action: "OPEN_EXAM_ASSIGNMENT", entity: "ExamAssignment", entityId: assignment.id, meta: { examId, targetUserId: data.userId } }
      });
      return assignment;
    });
  }

  public async updateAssignment(assignmentId: string, data: UpdateAssignmentInput, actor: AuthenticatedUser): Promise<unknown> {
    const assignment = await this.prisma.examAssignment.findUnique({ where: { id: assignmentId }, select: { id: true, status: true } });

    if (assignment === null) {
      throw new AppError(404, "EXAM_ASSIGNMENT_NOT_FOUND", "No se encontró la asignación solicitada.");
    }

    if (assignment.status === ExamAssignmentStatus.COMPLETED) {
      throw new AppError(409, "EXAM_ALREADY_COMPLETED", "No se puede modificar una asignación ya completada.");
    }

    const nextStatus = data.status === "CLOSED" ? ExamAssignmentStatus.CLOSED : ExamAssignmentStatus.OPEN;

    return this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.examAssignment.update({
        where: { id: assignmentId },
        data: { status: nextStatus, closedAt: nextStatus === ExamAssignmentStatus.CLOSED ? new Date() : null },
        include: ASSIGNMENT_INCLUDE
      });
      await transaction.auditLog.create({
        data: { userId: actor.id, action: nextStatus === ExamAssignmentStatus.CLOSED ? "CLOSE_EXAM_ASSIGNMENT" : "OPEN_EXAM_ASSIGNMENT", entity: "ExamAssignment", entityId: assignmentId }
      });
      return updated;
    });
  }

  public async deleteAssignment(assignmentId: string, actor: AuthenticatedUser): Promise<void> {
    const assignment = await this.prisma.examAssignment.findUnique({ where: { id: assignmentId }, select: { id: true } });

    if (assignment === null) {
      throw new AppError(404, "EXAM_ASSIGNMENT_NOT_FOUND", "No se encontró la asignación solicitada.");
    }

    await this.prisma.$transaction(async (transaction) => {
      await transaction.examAssignment.delete({ where: { id: assignmentId } });
      await transaction.auditLog.create({
        data: { userId: actor.id, action: "DELETE_EXAM_ASSIGNMENT", entity: "ExamAssignment", entityId: assignmentId }
      });
    });
  }

  // ───────────────── Examinee side ─────────────────

  public async listAvailable(userId: string): Promise<unknown[]> {
    const assignments = await this.prisma.examAssignment.findMany({
      where: { userId, status: ExamAssignmentStatus.OPEN },
      orderBy: { openedAt: "desc" },
      include: { exam: { select: { id: true, title: true, description: true, durationMin: true, passScore: true, questions: true } } }
    });

    return assignments.map((assignment) => ({
      assignmentId: assignment.id,
      openedAt: assignment.openedAt,
      exam: {
        id: assignment.exam.id,
        title: assignment.exam.title,
        description: assignment.exam.description,
        durationMin: assignment.exam.durationMin,
        passScore: assignment.exam.passScore,
        questionCount: this.readQuestions(assignment.exam.questions).length
      }
    }));
  }

  public async getExamForTaking(assignmentId: string, requester: AuthenticatedUser): Promise<unknown> {
    const assignment = await this.loadOwnedOpenAssignment(assignmentId, requester);
    const bank = this.readQuestions(assignment.exam.questions);
    const served: ServedQuestion[] = this.shuffle(bank).map((question) => {
      const options = this.shuffle(question.o);
      return { q: question.q, o: options };
    });

    return {
      assignmentId: assignment.id,
      exam: {
        id: assignment.exam.id,
        title: assignment.exam.title,
        description: assignment.exam.description,
        durationMin: assignment.exam.durationMin,
        passScore: assignment.exam.passScore
      },
      questions: served
    };
  }

  public async submit(assignmentId: string, data: SubmitExamInput, requester: AuthenticatedUser): Promise<unknown> {
    const assignment = await this.loadOwnedOpenAssignment(assignmentId, requester);
    const bank = this.readQuestions(assignment.exam.questions);
    const selectionByQuestion = new Map(data.answers.map((answer) => [answer.q, answer.selected]));

    const review: ReviewEntry[] = bank.map((question) => {
      const correct = question.o[question.a] ?? "";
      const selected = selectionByQuestion.get(question.q) ?? null;
      return { q: question.q, options: question.o, correct, selected, isCorrect: selected !== null && selected === correct };
    });

    const totalQuestions = bank.length;
    const correctCount = review.filter((entry) => entry.isCorrect).length;
    const score = totalQuestions === 0 ? 0 : Math.round((correctCount / totalQuestions) * 100);
    const passed = score >= assignment.exam.passScore;
    const startedAt = data.startedAt !== undefined ? new Date(data.startedAt) : new Date();

    try {
      await this.prisma.$transaction(async (transaction) => {
        await transaction.examAttempt.create({
          data: {
            assignmentId,
            userId: requester.id,
            answers: review as unknown as Prisma.InputJsonValue,
            score,
            correctCount,
            totalQuestions,
            passed,
            startedAt
          }
        });
        await transaction.examAssignment.update({
          where: { id: assignmentId },
          data: { status: ExamAssignmentStatus.COMPLETED, closedAt: new Date() }
        });
        await transaction.auditLog.create({
          data: { userId: requester.id, action: "SUBMIT_EXAM", entity: "ExamAttempt", entityId: assignmentId, meta: { examId: assignment.examId, score, passed } }
        });
      });
    } catch (error) {
      if (isUniqueConstraintError(error, ["assignmentId"])) {
        throw new AppError(409, "EXAM_ALREADY_SUBMITTED", "Este examen ya fue enviado.");
      }
      throw error;
    }

    return { score, correctCount, totalQuestions, passed, review };
  }

  public async listMyResults(userId: string): Promise<unknown[]> {
    return this.findResultsForUser(userId);
  }

  public async listUserResults(userId: string, requester: AuthenticatedUser): Promise<unknown[]> {
    if (requester.id !== userId && !hasPermission(requester.role, Permission.MANAGE_USERS)) {
      throw new AppError(403, "FORBIDDEN", "No tienes permisos para ver estos resultados.");
    }

    return this.findResultsForUser(userId);
  }

  // ───────────────── Helpers ─────────────────

  private async findResultsForUser(userId: string): Promise<unknown[]> {
    const attempts = await this.prisma.examAttempt.findMany({
      where: { userId },
      orderBy: { submittedAt: "desc" },
      include: { assignment: { select: { exam: { select: { id: true, title: true, passScore: true } } } } }
    });

    return attempts.map((attempt) => ({
      id: attempt.id,
      exam: attempt.assignment.exam,
      score: attempt.score,
      correctCount: attempt.correctCount,
      totalQuestions: attempt.totalQuestions,
      passed: attempt.passed,
      submittedAt: attempt.submittedAt,
      review: attempt.answers
    }));
  }

  private async loadOwnedOpenAssignment(assignmentId: string, requester: AuthenticatedUser) {
    const assignment = await this.prisma.examAssignment.findUnique({
      where: { id: assignmentId },
      include: { exam: { select: { id: true, title: true, description: true, durationMin: true, passScore: true, questions: true } } }
    });

    if (assignment === null || assignment.userId !== requester.id) {
      throw new AppError(403, "EXAM_FORBIDDEN", "No tienes acceso a este examen.");
    }

    if (assignment.status !== ExamAssignmentStatus.OPEN) {
      throw new AppError(403, "EXAM_NOT_OPEN", "Este examen no está disponible para realizarse.");
    }

    return assignment;
  }

  private async findExamOrThrow(id: string): Promise<{ id: string; title: string }> {
    const exam = await this.prisma.exam.findUnique({ where: { id }, select: { id: true, title: true } });
    if (exam === null) {
      throw new AppError(404, "EXAM_NOT_FOUND", "No se encontró el examen solicitado.");
    }
    return exam;
  }

  private async findUserOrThrow(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (user === null) {
      throw new AppError(404, "USER_NOT_FOUND", "No se encontró el fiscal solicitado.");
    }
  }

  private toExamSummary(exam: { id: string; title: string; description: string | null; durationMin: number; passScore: number; isActive: boolean; createdAt: Date; questions: Prisma.JsonValue }): unknown {
    return {
      id: exam.id,
      title: exam.title,
      description: exam.description,
      durationMin: exam.durationMin,
      passScore: exam.passScore,
      isActive: exam.isActive,
      createdAt: exam.createdAt,
      questionCount: this.readQuestions(exam.questions).length
    };
  }

  private readQuestions(value: Prisma.JsonValue): ExamQuestion[] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value as unknown as ExamQuestion[];
  }

  private toQuestionsJson(questions: readonly ExamQuestion[]): Prisma.InputJsonValue {
    return questions as unknown as Prisma.InputJsonValue;
  }

  private shuffle<T>(items: readonly T[]): T[] {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = copy[i] as T;
      copy[i] = copy[j] as T;
      copy[j] = temp;
    }
    return copy;
  }
}
