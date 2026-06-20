import type { FastifyReply, FastifyRequest } from "fastify";
import { getAuthenticatedUser } from "../../shared/utils/authenticated-user";
import { CreateSanctionSchema, ResolveSanctionSchema, SanctionParamsSchema, SanctionsQuerySchema, UserSanctionsParamsSchema } from "./sanctions.schema";
import { SanctionsService } from "./sanctions.service";

export async function listEligibleSanctionUsersController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const issuer = getAuthenticatedUser(request);
  const service = new SanctionsService(request.server.prisma);
  const users = await service.findEligibleUsers(issuer);

  reply.send({ error: false, data: users });
}

export async function listSanctionsController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const query = SanctionsQuerySchema.parse(request.query);
  const service = new SanctionsService(request.server.prisma);
  const result = await service.findAll(query);

  reply.send({ error: false, data: result.data, meta: result.meta });
}

export async function createSanctionController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const body = CreateSanctionSchema.parse(request.body);
  const issuer = getAuthenticatedUser(request);
  const service = new SanctionsService(request.server.prisma);
  const sanction = await service.create(body, issuer);

  reply.status(201).send({ error: false, data: sanction, message: "Sanción emitida correctamente." });
}

export async function getSanctionController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = SanctionParamsSchema.parse(request.params);
  const service = new SanctionsService(request.server.prisma);
  const sanction = await service.findById(params.id);

  reply.send({ error: false, data: sanction });
}

export async function listUserSanctionsController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = UserSanctionsParamsSchema.parse(request.params);
  const requester = getAuthenticatedUser(request);
  const service = new SanctionsService(request.server.prisma);
  const sanctions = await service.findByUser(params.userId, requester);

  reply.send({ error: false, data: sanctions });
}

export async function resolveSanctionController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = SanctionParamsSchema.parse(request.params);
  const body = ResolveSanctionSchema.parse(request.body);
  const resolver = getAuthenticatedUser(request);
  const service = new SanctionsService(request.server.prisma);
  const sanction = await service.resolve(params.id, body, resolver);

  reply.send({ error: false, data: sanction, message: "Sanción resuelta correctamente." });
}
