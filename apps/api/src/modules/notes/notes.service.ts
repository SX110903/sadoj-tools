import { hasPermission, Permission, ROLE_LEVEL, RoleType } from "@sadoj/shared";
import { AppError } from "../../shared/errors/AppError";
import { NotificationType, Prisma, type PrismaClient } from "../../shared/prisma";
import { canSeeConfidentialNotes } from "../../shared/utils/role";
import type { AuthenticatedUser } from "../../types/fastify";
import { NotificationsService } from "../notifications/notifications.service";
import type { CreateNoteInput, PinNoteInput, UpdateNoteInput } from "./notes.schema";

type NoteTarget =
  | { type: "investigation"; id: string }
  | { type: "subject"; id: string }
  | { type: "user"; id: string };

export class NotesService {
  public constructor(private readonly prisma: PrismaClient) {}

  public async listForTarget(target: NoteTarget, requester: AuthenticatedUser): Promise<unknown[]> {
    await this.ensureTargetAccess(target, requester);

    const where: Prisma.NoteWhereInput = this.buildTargetWhere(target);

    if (!canSeeConfidentialNotes(requester.role)) {
      where.isConfidential = false;
    }

    return this.prisma.note.findMany({
      where,
      include: {
        author: { select: { id: true, displayName: true, role: true, avatar: true } },
        files: true
      },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }]
    });
  }

  public async createForTarget(target: NoteTarget, data: CreateNoteInput, requester: AuthenticatedUser): Promise<unknown> {
    await this.ensureTargetAccess(target, requester);
    this.ensureConfidentialAllowed(data.isConfidential, requester);

    const createData: Prisma.NoteUncheckedCreateInput = {
      content: data.content,
      isConfidential: data.isConfidential,
      authorId: requester.id
    };

    if (target.type === "investigation") createData.investigationId = target.id;
    if (target.type === "subject") createData.subjectId = target.id;
    if (target.type === "user") createData.targetUserId = target.id;

    const note = await this.prisma.note.create({
      data: createData,
      include: {
        author: { select: { id: true, displayName: true, role: true, avatar: true } },
        files: true
      }
    });

    const notificationService = new NotificationsService(this.prisma);
    const link = this.targetLink(target);

    if (target.type === "investigation") {
      const participants = await this.prisma.investigation.findUnique({
        where: { id: target.id },
        select: {
          caseNumber: true,
          title: true,
          leadFiscalId: true,
          participants: { select: { userId: true } }
        }
      });

      if (participants !== null) {
        await notificationService.notifyMany([participants.leadFiscalId, ...participants.participants.map((participant) => participant.userId)], {
          actorId: requester.id,
          type: NotificationType.NOTE_ADDED,
          title: "Nota nueva",
          message: `${note.author.displayName} añadió una nota en ${participants.caseNumber}.`,
          link,
          meta: { noteId: note.id, investigationId: target.id }
        });
      }
    }

    const mentionIds = await this.resolveMentionIds(data.content, data.mentions);
    await notificationService.notifyMany(mentionIds, {
      actorId: requester.id,
      type: NotificationType.MENTION,
      title: "Te mencionaron",
      message: `${note.author.displayName} te mencionó en una nota.`,
      link,
      meta: { noteId: note.id, targetType: target.type, targetId: target.id }
    });

    return note;
  }

  public async findById(id: string, requester: AuthenticatedUser): Promise<unknown> {
    const note = await this.prisma.note.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, displayName: true, role: true, avatar: true } },
        files: true
      }
    });

    if (note === null) {
      throw new AppError(404, "NOTE_NOT_FOUND", "No se encontró la nota solicitada.");
    }

    await this.ensureNoteVisible(note, requester);
    return note;
  }

  public async update(id: string, data: UpdateNoteInput, requester: AuthenticatedUser): Promise<unknown> {
    const note = await this.prisma.note.findUnique({ where: { id } });

    if (note === null) {
      throw new AppError(404, "NOTE_NOT_FOUND", "No se encontró la nota solicitada.");
    }

    await this.ensureCanMutate(note.authorId, requester);

    if (data.isConfidential !== undefined) {
      this.ensureConfidentialAllowed(data.isConfidential, requester);
    }

    const updateData: Prisma.NoteUpdateInput = {};

    if (data.content !== undefined) updateData.content = data.content;
    if (data.isConfidential !== undefined) updateData.isConfidential = data.isConfidential;

    return this.prisma.note.update({
      where: { id },
      data: updateData,
      include: {
        author: { select: { id: true, displayName: true, role: true, avatar: true } },
        files: true
      }
    });
  }

  public async pin(id: string, data: PinNoteInput, requester: AuthenticatedUser): Promise<unknown> {
    const note = await this.prisma.note.findUnique({ where: { id } });

    if (note === null) {
      throw new AppError(404, "NOTE_NOT_FOUND", "No se encontró la nota solicitada.");
    }

    await this.ensureCanMutate(note.authorId, requester);

    return this.prisma.note.update({
      where: { id },
      data: { isPinned: data.isPinned },
      include: {
        author: { select: { id: true, displayName: true, role: true, avatar: true } },
        files: true
      }
    });
  }

  public async delete(id: string, requester: AuthenticatedUser): Promise<void> {
    const note = await this.prisma.note.findUnique({ where: { id } });

    if (note === null) {
      throw new AppError(404, "NOTE_NOT_FOUND", "No se encontró la nota solicitada.");
    }

    await this.ensureCanMutate(note.authorId, requester);
    await this.prisma.note.delete({ where: { id } });
  }

  private buildTargetWhere(target: NoteTarget): Prisma.NoteWhereInput {
    if (target.type === "investigation") return { investigationId: target.id };
    if (target.type === "subject") return { subjectId: target.id };
    return { targetUserId: target.id };
  }

  private targetLink(target: NoteTarget): string {
    if (target.type === "investigation") return `/investigaciones/${target.id}`;
    if (target.type === "subject") return `/sujetos/${target.id}`;
    return `/fiscales/${target.id}`;
  }

  private async resolveMentionIds(content: string, explicitMentions: readonly string[]): Promise<string[]> {
    const ids = new Set(explicitMentions);
    const mentionPattern = /@\[([^\]]+)\]\(([^)]+)\)/g;
    let match = mentionPattern.exec(content);

    while (match !== null) {
      const userId = match[2];
      if (userId !== undefined) ids.add(userId);
      match = mentionPattern.exec(content);
    }

    const mentionedUsers = await this.prisma.user.findMany({
      where: { id: { in: Array.from(ids) }, active: true },
      select: { id: true }
    });

    return mentionedUsers.map((user) => user.id);
  }

  private ensureConfidentialAllowed(isConfidential: boolean, requester: AuthenticatedUser): void {
    if (isConfidential && !canSeeConfidentialNotes(requester.role)) {
      throw new AppError(403, "FORBIDDEN", "No tienes permisos para crear notas confidenciales.");
    }
  }

  private async ensureCanMutate(authorId: string, requester: AuthenticatedUser): Promise<void> {
    if (authorId === requester.id) {
      return;
    }

    if (ROLE_LEVEL[requester.role] < ROLE_LEVEL[RoleType.FISCAL_DIVISION]) {
      throw new AppError(403, "FORBIDDEN", "Solo el autor o una autoridad de división puede modificar esta nota.");
    }
  }

  private async ensureNoteVisible(note: { isConfidential: boolean; investigationId: string | null; subjectId: string | null; targetUserId: string | null }, requester: AuthenticatedUser): Promise<void> {
    if (note.isConfidential && !canSeeConfidentialNotes(requester.role)) {
      throw new AppError(403, "FORBIDDEN", "No tienes permisos para ver esta nota confidencial.");
    }

    if (note.investigationId !== null) {
      await this.ensureInvestigationAccess(note.investigationId, requester);
      return;
    }

    if (note.subjectId !== null) {
      await this.ensureSubjectAccess(note.subjectId, requester);
      return;
    }

    if (note.targetUserId !== null && note.targetUserId !== requester.id && !hasPermission(requester.role, Permission.MANAGE_USERS)) {
      throw new AppError(403, "FORBIDDEN", "No tienes permisos para ver esta nota.");
    }
  }

  private async ensureTargetAccess(target: NoteTarget, requester: AuthenticatedUser): Promise<void> {
    if (target.type === "investigation") {
      await this.ensureInvestigationAccess(target.id, requester);
      return;
    }

    if (target.type === "subject") {
      await this.ensureSubjectAccess(target.id, requester);
      return;
    }

    const user = await this.prisma.user.findUnique({ where: { id: target.id } });

    if (user === null) {
      throw new AppError(404, "USER_NOT_FOUND", "No se encontró el fiscal solicitado.");
    }

    if (target.id !== requester.id && !hasPermission(requester.role, Permission.MANAGE_USERS)) {
      throw new AppError(403, "FORBIDDEN", "No tienes permisos para gestionar notas de este fiscal.");
    }
  }

  private async ensureInvestigationAccess(investigationId: string, requester: AuthenticatedUser): Promise<void> {
    const investigation = await this.prisma.investigation.findUnique({
      where: { id: investigationId },
      include: { participants: { where: { userId: requester.id } } }
    });

    if (investigation === null) {
      throw new AppError(404, "INVESTIGATION_NOT_FOUND", "No se encontró la investigación solicitada.");
    }

    const hasGlobalAccess = hasPermission(requester.role, Permission.VIEW_ALL_INVESTIGATIONS);
    const isLead = investigation.leadFiscalId === requester.id;
    const isParticipant = investigation.participants.length > 0;

    if (!hasGlobalAccess && !isLead && !isParticipant) {
      throw new AppError(403, "INVESTIGATION_ACCESS_DENIED", "No tienes acceso a esta investigación.");
    }
  }

  private async ensureSubjectAccess(subjectId: string, requester: AuthenticatedUser): Promise<void> {
    const subject = await this.prisma.subject.findUnique({ where: { id: subjectId } });

    if (subject === null) {
      throw new AppError(404, "SUBJECT_NOT_FOUND", "No se encontró el sujeto solicitado.");
    }

    if (!hasPermission(requester.role, Permission.VIEW_SUBJECTS)) {
      throw new AppError(403, "FORBIDDEN", "No tienes permisos para ver este sujeto.");
    }
  }
}
