import type Redis from "ioredis";
import { AppError } from "../../shared/errors/AppError";
import { NotificationType, type PrismaClient } from "../../shared/prisma";
import type { AuthenticatedUser } from "../../types/fastify";
import { NotificationsService } from "../notifications/notifications.service";
import type { ChatMessagesQueryInput, SendMessageInput } from "./chat.schema";

export class ChatService {
  public constructor(
    private readonly prisma: PrismaClient,
    private readonly redis: Redis
  ) {}

  public async getMessages(roomId: string, query: ChatMessagesQueryInput, requester: AuthenticatedUser): Promise<unknown[]> {
    await this.ensureParticipant(roomId, requester.id);
    const beforeMessage =
      query.before === undefined ? null : await this.prisma.message.findUnique({ where: { id: query.before }, select: { createdAt: true, roomId: true } });

    if (query.before !== undefined && beforeMessage === null) {
      throw new AppError(404, "MESSAGE_NOT_FOUND", "No se encontró el mensaje de referencia.");
    }

    if (beforeMessage !== null && beforeMessage.roomId !== roomId) {
      throw new AppError(400, "INVALID_CURSOR", "El cursor no pertenece a esta sala.");
    }

    const messages = await this.prisma.message.findMany({
      where: beforeMessage === null ? { roomId } : { roomId, createdAt: { lt: beforeMessage.createdAt } },
      take: query.limit,
      orderBy: { createdAt: "desc" },
      include: { author: { select: { id: true, displayName: true, role: true, avatar: true } } }
    });

    return messages.reverse();
  }

  public async sendMessage(roomId: string, data: SendMessageInput, requester: AuthenticatedUser): Promise<unknown> {
    await this.ensureParticipant(roomId, requester.id);
    await this.ensureRateLimit(requester.id);

    const message = await this.prisma.message.create({
      data: {
        roomId,
        authorId: requester.id,
        content: data.content,
        fileUrl: data.fileUrl ?? null,
        fileId: data.fileId ?? null,
        fileName: data.fileName ?? null
      },
      include: { author: { select: { id: true, displayName: true, role: true, avatar: true } } }
    });

    const mentionIds = await this.resolveMentionIds(data.content, data.mentions);
    if (mentionIds.length > 0) {
      const room = await this.prisma.chatRoom.findUnique({
        where: { id: roomId },
        select: { investigationId: true, investigation: { select: { caseNumber: true } } }
      });

      const link = room === null ? undefined : `/investigaciones/${room.investigationId}`;
      await new NotificationsService(this.prisma).notifyMany(mentionIds, {
        actorId: requester.id,
        type: NotificationType.MENTION,
        title: "Te mencionaron",
        message: `${message.author.displayName} te mencionó en el chat de ${room?.investigation.caseNumber ?? "una investigación"}.`,
        link,
        meta: { messageId: message.id, roomId }
      });
    }

    return message;
  }

  public async ensureParticipant(roomId: string, userId: string): Promise<void> {
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: {
        investigation: {
          include: {
            participants: { where: { userId } }
          }
        }
      }
    });

    if (room === null) {
      throw new AppError(404, "CHAT_ROOM_NOT_FOUND", "No se encontró la sala de chat.");
    }

    const isLead = room.investigation.leadFiscalId === userId;
    const isParticipant = room.investigation.participants.length > 0;

    if (!isLead && !isParticipant) {
      throw new AppError(403, "CHAT_ACCESS_DENIED", "No formas parte de esta sala de chat.");
    }
  }

  private async ensureRateLimit(userId: string): Promise<void> {
    const key = `chat:rate:${userId}`;
    const result = await this.redis.set(key, "1", "EX", 1, "NX");

    if (result !== "OK") {
      throw new AppError(429, "CHAT_RATE_LIMITED", "Espera un segundo antes de enviar otro mensaje.");
    }
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
}
