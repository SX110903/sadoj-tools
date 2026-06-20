import type { FastifyReply, FastifyRequest } from "fastify";
import { getAuthenticatedUser } from "../../shared/utils/authenticated-user";
import {
  CreateOrganizationSchema,
  OrganizationParamsSchema,
  OrganizationsQuerySchema,
  UpdateOrganizationSchema
} from "./organizations.schema";
import { OrganizationsService } from "./organizations.service";

export async function listOrganizationsController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const query = OrganizationsQuerySchema.parse(request.query);
  const service = new OrganizationsService(request.server.prisma);
  const organizations = await service.findAll(query);

  reply.send({ error: false, data: organizations });
}

export async function createOrganizationController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const body = CreateOrganizationSchema.parse(request.body);
  const requester = getAuthenticatedUser(request);
  const service = new OrganizationsService(request.server.prisma);
  const organization = await service.create(body, requester);

  reply.status(201).send({ error: false, data: organization, message: "Organización criminal registrada correctamente." });
}

export async function getOrganizationController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = OrganizationParamsSchema.parse(request.params);
  const service = new OrganizationsService(request.server.prisma);
  const organization = await service.findById(params.id);

  reply.send({ error: false, data: organization });
}

export async function updateOrganizationController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = OrganizationParamsSchema.parse(request.params);
  const body = UpdateOrganizationSchema.parse(request.body);
  const service = new OrganizationsService(request.server.prisma);
  const organization = await service.update(params.id, body);

  reply.send({ error: false, data: organization, message: "Organización criminal actualizada correctamente." });
}

export async function deleteOrganizationController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = OrganizationParamsSchema.parse(request.params);
  const service = new OrganizationsService(request.server.prisma);
  await service.delete(params.id);

  reply.send({ error: false, data: { deleted: true }, message: "Organización criminal desactivada correctamente." });
}
