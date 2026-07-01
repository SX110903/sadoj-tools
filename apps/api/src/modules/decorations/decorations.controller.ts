import type { FastifyReply, FastifyRequest } from "fastify";
import { getAuthenticatedUser } from "../../shared/utils/authenticated-user";
import {
  AwardDecorationSchema,
  CreateDecorationSchema,
  DecorationParamsSchema,
  UpdateDecorationSchema,
  UserDecorationAwardParamsSchema,
  UserDecorationsParamsSchema
} from "./decorations.schema";
import { DecorationsService } from "./decorations.service";

export async function listDecorationsController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const service = new DecorationsService(request.server.prisma);
  const decorations = await service.listCatalog();

  reply.send({ error: false, data: decorations });
}

export async function createDecorationController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const body = CreateDecorationSchema.parse(request.body);
  const actor = getAuthenticatedUser(request);
  const service = new DecorationsService(request.server.prisma);
  const decoration = await service.createDecoration(body, actor);

  reply.status(201).send({ error: false, data: decoration, message: "Condecoración creada correctamente." });
}

export async function updateDecorationController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = DecorationParamsSchema.parse(request.params);
  const body = UpdateDecorationSchema.parse(request.body);
  const actor = getAuthenticatedUser(request);
  const service = new DecorationsService(request.server.prisma);
  const decoration = await service.updateDecoration(params.id, body, actor);

  reply.send({ error: false, data: decoration, message: "Condecoración actualizada correctamente." });
}

export async function deleteDecorationController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = DecorationParamsSchema.parse(request.params);
  const actor = getAuthenticatedUser(request);
  const service = new DecorationsService(request.server.prisma);
  await service.deleteDecoration(params.id, actor);

  reply.send({ error: false, data: { deleted: true }, message: "Condecoración eliminada correctamente." });
}

export async function listUserDecorationsController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = UserDecorationsParamsSchema.parse(request.params);
  const service = new DecorationsService(request.server.prisma);
  const awards = await service.listUserAwards(params.id);

  reply.send({ error: false, data: awards });
}

export async function awardUserDecorationController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = UserDecorationsParamsSchema.parse(request.params);
  const body = AwardDecorationSchema.parse(request.body);
  const actor = getAuthenticatedUser(request);
  const service = new DecorationsService(request.server.prisma);
  const award = await service.award(params.id, body, actor);

  reply.status(201).send({ error: false, data: award, message: "Condecoración otorgada correctamente." });
}

export async function revokeUserDecorationController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = UserDecorationAwardParamsSchema.parse(request.params);
  const actor = getAuthenticatedUser(request);
  const service = new DecorationsService(request.server.prisma);
  await service.revoke(params.id, params.awardId, actor);

  reply.send({ error: false, data: { revoked: true }, message: "Condecoración revocada correctamente." });
}
