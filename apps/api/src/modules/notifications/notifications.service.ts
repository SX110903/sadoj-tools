import { AppError } from "../../shared/errors/AppError";
import { NotificationType, Prisma, type Notification, type PrismaClient } from "../../shared/prisma";
import { buildPaginationMeta, getPagination, type PaginationMeta } from "../../shared/utils/pagination";
import { emitNotificationToUser, type NotificationSocketPayload } from "../chat/chat.gateway";
import type { NotificationsQueryInput } from "./notifications.schema";

const NOTIFICATION_INCLUDE = {
  actor: { select: { id: true, displayName: true, role: true, avatar: true } }
} satisfies Prisma.NotificationInclude;

type NotificationWithActor = Prisma.NotificationGetPayload<{ include: typeof NOTIFICATION_INCLUDE }>;

export interface PaginatedNotifications {
  data: NotificationWithActor[];
  meta: PaginationMeta;
}

export interface NotifyParams {
  recipientId: string;
  actorId?: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | undefined;
  meta?: Record<string, unknown>;
}

export class NotificationsService {
  public constructor(private readonly prisma: PrismaClient) {}

  public async notify(params: NotifyParams): Promise<void> {
    if (params.actorId !== undefined && params.recipientId === params.actorId) {
      return;
    }

    const notification = await this.prisma.notification.create({
      data: {
        recipientId: params.recipientId,
        actorId: params.actorId ?? null,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link ?? null,
        meta: params.meta === undefined ? Prisma.JsonNull : this.toPrismaJsonObject(params.meta)
      }
    });
    const unreadCount = await this.countUnread(params.recipientId);

    emitNotificationToUser(params.recipientId, this.toSocketPayload(notification), unreadCount);
  }

  public async notifyMany(recipientIds: readonly string[], params: Omit<NotifyParams, "recipientId">): Promise<void> {
    const uniqueRecipientIds = Array.from(new Set(recipientIds));
    await Promise.all(uniqueRecipientIds.map((recipientId) => this.notify({ ...params, recipientId })));
  }

  public async findAll(recipientId: string, query: NotificationsQueryInput): Promise<PaginatedNotifications> {
    const pagination = getPagination(query);
    const where: Prisma.NotificationWhereInput = { recipientId };

    if (query.read !== undefined) where.read = query.read;
    if (query.type !== undefined) where.type = query.type;

    const [total, notifications] = await this.prisma.$transaction([
      this.prisma.notification.count({ where }),
      this.prisma.notification.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: "desc" },
        include: NOTIFICATION_INCLUDE
      })
    ]);

    return {
      data: notifications,
      meta: buildPaginationMeta(total, pagination.page, pagination.limit)
    };
  }

  public async unreadCount(recipientId: string): Promise<number> {
    return this.countUnread(recipientId);
  }

  public async markRead(id: string, recipientId: string): Promise<NotificationWithActor> {
    await this.ensureOwnNotification(id, recipientId);
    const notification = await this.prisma.notification.update({
      where: { id },
      data: { read: true },
      include: NOTIFICATION_INCLUDE
    });
    const unreadCount = await this.countUnread(recipientId);
    emitNotificationToUser(recipientId, this.toSocketPayload(notification), unreadCount);
    return notification;
  }

  public async markAllRead(recipientId: string): Promise<{ updated: number }> {
    const result = await this.prisma.notification.updateMany({
      where: { recipientId, read: false },
      data: { read: true }
    });
    emitNotificationToUser(recipientId, undefined, 0);
    return { updated: result.count };
  }

  public async delete(id: string, recipientId: string): Promise<void> {
    await this.ensureOwnNotification(id, recipientId);
    await this.prisma.notification.delete({ where: { id } });
    const unreadCount = await this.countUnread(recipientId);
    emitNotificationToUser(recipientId, undefined, unreadCount);
  }

  private async ensureOwnNotification(id: string, recipientId: string): Promise<void> {
    const notification = await this.prisma.notification.findFirst({
      where: { id, recipientId },
      select: { id: true }
    });

    if (notification === null) {
      throw new AppError(404, "NOTIFICATION_NOT_FOUND", "No se encontró la notificación solicitada.");
    }
  }

  private async countUnread(recipientId: string): Promise<number> {
    return this.prisma.notification.count({ where: { recipientId, read: false } });
  }

  private toPrismaJsonObject(value: Record<string, unknown>): Prisma.InputJsonObject {
    return value as Prisma.InputJsonObject;
  }

  private toSocketPayload(notification: Notification): NotificationSocketPayload {
    return {
      id: notification.id,
      recipientId: notification.recipientId,
      actorId: notification.actorId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      link: notification.link,
      read: notification.read,
      meta: notification.meta,
      createdAt: notification.createdAt.toISOString()
    };
  }
}
