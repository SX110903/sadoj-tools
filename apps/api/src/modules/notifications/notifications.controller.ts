import type { FastifyReply, FastifyRequest } from "fastify";
import { getAuthenticatedUser } from "../../shared/utils/authenticated-user";
import { NotificationParamsSchema, NotificationsQuerySchema } from "./notifications.schema";
import { NotificationsService } from "./notifications.service";

export async function listNotificationsController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const query = NotificationsQuerySchema.parse(request.query);
  const requester = getAuthenticatedUser(request);
  const service = new NotificationsService(request.server.prisma);
  const result = await service.findAll(requester.id, query);

  reply.send({ error: false, data: result.data, meta: result.meta });
}

export async function unreadCountController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const requester = getAuthenticatedUser(request);
  const service = new NotificationsService(request.server.prisma);
  const count = await service.unreadCount(requester.id);

  reply.send({ error: false, data: { count } });
}

export async function markNotificationReadController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = NotificationParamsSchema.parse(request.params);
  const requester = getAuthenticatedUser(request);
  const service = new NotificationsService(request.server.prisma);
  const notification = await service.markRead(params.id, requester.id);

  reply.send({ error: false, data: notification, message: "Notificación marcada como leída." });
}

export async function markAllNotificationsReadController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const requester = getAuthenticatedUser(request);
  const service = new NotificationsService(request.server.prisma);
  const result = await service.markAllRead(requester.id);

  reply.send({ error: false, data: result, message: "Notificaciones marcadas como leídas." });
}

export async function deleteNotificationController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = NotificationParamsSchema.parse(request.params);
  const requester = getAuthenticatedUser(request);
  const service = new NotificationsService(request.server.prisma);
  await service.delete(params.id, requester.id);

  reply.send({ error: false, data: { deleted: true }, message: "Notificación eliminada." });
}
