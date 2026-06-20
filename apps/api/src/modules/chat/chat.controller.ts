import type { FastifyReply, FastifyRequest } from "fastify";
import { getAuthenticatedUser } from "../../shared/utils/authenticated-user";
import { ChatMessagesQuerySchema, ChatRoomParamsSchema, SendMessageSchema } from "./chat.schema";
import { ChatService } from "./chat.service";

export async function listChatMessagesController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = ChatRoomParamsSchema.parse(request.params);
  const query = ChatMessagesQuerySchema.parse(request.query);
  const requester = getAuthenticatedUser(request);
  const service = new ChatService(request.server.prisma, request.server.redis);
  const messages = await service.getMessages(params.roomId, query, requester);

  reply.send({ error: false, data: messages });
}

export async function sendChatMessageController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = ChatRoomParamsSchema.parse(request.params);
  const body = SendMessageSchema.parse(request.body);
  const requester = getAuthenticatedUser(request);
  const service = new ChatService(request.server.prisma, request.server.redis);
  const message = await service.sendMessage(params.roomId, body, requester);

  reply.status(201).send({ error: false, data: message, message: "Mensaje enviado correctamente." });
}
