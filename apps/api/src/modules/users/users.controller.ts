import type { FastifyReply, FastifyRequest } from "fastify";
import { hasPermission, Permission } from "@sadoj/shared";
import { AppError } from "../../shared/errors/AppError";
import { getAuthenticatedUser } from "../../shared/utils/authenticated-user";
import { AssignRoleSchema, CreateUserSchema, MentionUsersQuerySchema, UpdateAvatarSchema, UpdateUserSchema, UserParamsSchema, UsersQuerySchema } from "./users.schema";
import { UsersService } from "./users.service";

export async function listUsersController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const query = UsersQuerySchema.parse(request.query);
  const service = new UsersService(request.server.prisma);
  const result = await service.findAll(query);

  reply.send({ error: false, data: result.data, meta: result.meta });
}

export async function mentionUsersController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const query = MentionUsersQuerySchema.parse(request.query);
  const service = new UsersService(request.server.prisma);
  const users = await service.findMentionCandidates(query);

  reply.send({ error: false, data: users });
}

export async function createUserController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const body = CreateUserSchema.parse(request.body);
  const service = new UsersService(request.server.prisma);
  const user = await service.create(body);

  reply.status(201).send({ error: false, data: user, message: "Fiscal creado correctamente." });
}

export async function getUserController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = UserParamsSchema.parse(request.params);
  const service = new UsersService(request.server.prisma);
  const user = await service.findById(params.id);

  reply.send({ error: false, data: user });
}

export async function updateUserController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = UserParamsSchema.parse(request.params);
  const body = UpdateUserSchema.parse(request.body);
  const requester = getAuthenticatedUser(request);
  const service = new UsersService(request.server.prisma);
  const user = await service.update(params.id, body, requester);

  reply.send({ error: false, data: user, message: "Fiscal actualizado correctamente." });
}

export async function deactivateUserController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = UserParamsSchema.parse(request.params);
  const service = new UsersService(request.server.prisma);
  const user = await service.deactivate(params.id);

  reply.send({ error: false, data: user, message: "Fiscal desactivado correctamente." });
}

export async function changeUserRoleController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = UserParamsSchema.parse(request.params);
  const body = AssignRoleSchema.parse(request.body);
  const requester = getAuthenticatedUser(request);
  const service = new UsersService(request.server.prisma);
  const user = await service.changeRole(params.id, body.role, requester);

  reply.send({ error: false, data: user, message: "Rol actualizado correctamente." });
}

export async function updateUserAvatarController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = UserParamsSchema.parse(request.params);
  const body = UpdateAvatarSchema.parse(request.body);
  const requester = getAuthenticatedUser(request);

  if (requester.id !== params.id && !hasPermission(requester.role, Permission.MANAGE_USERS)) {
    throw new AppError(403, "FORBIDDEN", "No tienes permisos para actualizar este avatar.");
  }

  const service = new UsersService(request.server.prisma);
  const user = await service.updateAvatar(params.id, body.avatarUrl);

  reply.send({ error: false, data: user, message: "Avatar actualizado correctamente." });
}
