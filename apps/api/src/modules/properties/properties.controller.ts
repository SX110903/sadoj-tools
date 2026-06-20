import type { FastifyReply, FastifyRequest } from "fastify";
import { getAuthenticatedUser } from "../../shared/utils/authenticated-user";
import {
  CreatePropertyIncidentSchema,
  CreatePropertySchema,
  PropertiesQuerySchema,
  PropertyIncidentParamsSchema,
  PropertyMemberParamsSchema,
  PropertyParamsSchema,
  UpdatePropertyIncidentSchema,
  UpdatePropertyMemberSchema,
  UpdatePropertySchema,
  UpsertPropertyMemberSchema
} from "./properties.schema";
import { PropertiesService } from "./properties.service";

export async function listPropertiesController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const query = PropertiesQuerySchema.parse(request.query);
  const service = new PropertiesService(request.server.prisma);
  const result = await service.findAll(query);
  reply.send({ error: false, data: result.data, meta: result.meta });
}

export async function createPropertyController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const body = CreatePropertySchema.parse(request.body);
  const requester = getAuthenticatedUser(request);
  const service = new PropertiesService(request.server.prisma);
  const property = await service.create(body, requester);
  reply.status(201).send({ error: false, data: property, message: "Propiedad registrada correctamente." });
}

export async function getPropertyController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = PropertyParamsSchema.parse(request.params);
  const service = new PropertiesService(request.server.prisma);
  const property = await service.findById(params.id);
  reply.send({ error: false, data: property });
}

export async function updatePropertyController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = PropertyParamsSchema.parse(request.params);
  const body = UpdatePropertySchema.parse(request.body);
  const service = new PropertiesService(request.server.prisma);
  const property = await service.update(params.id, body);
  reply.send({ error: false, data: property, message: "Propiedad actualizada correctamente." });
}

export async function deletePropertyController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = PropertyParamsSchema.parse(request.params);
  const service = new PropertiesService(request.server.prisma);
  await service.delete(params.id);
  reply.send({ error: false, data: { deleted: true }, message: "Propiedad eliminada correctamente." });
}

export async function getPropertyHistoryController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = PropertyParamsSchema.parse(request.params);
  const service = new PropertiesService(request.server.prisma);
  const history = await service.history(params.id);
  reply.send({ error: false, data: history });
}

export async function getPropertyDossierController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = PropertyParamsSchema.parse(request.params);
  const requester = getAuthenticatedUser(request);
  const service = new PropertiesService(request.server.prisma);
  const dossier = await service.dossier(params.id, requester);
  reply.send({ error: false, data: dossier });
}

export async function getPropertyTimelineController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = PropertyParamsSchema.parse(request.params);
  const service = new PropertiesService(request.server.prisma);
  const timeline = await service.timeline(params.id);
  reply.send({ error: false, data: timeline });
}

export async function createPropertyIncidentController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = PropertyParamsSchema.parse(request.params);
  const body = CreatePropertyIncidentSchema.parse(request.body);
  const requester = getAuthenticatedUser(request);
  const service = new PropertiesService(request.server.prisma);
  const incident = await service.createIncident(params.id, body, requester);
  reply.status(201).send({ error: false, data: incident, message: "Incidente registrado correctamente." });
}

export async function updatePropertyIncidentController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = PropertyIncidentParamsSchema.parse(request.params);
  const body = UpdatePropertyIncidentSchema.parse(request.body);
  const requester = getAuthenticatedUser(request);
  const service = new PropertiesService(request.server.prisma);
  const incident = await service.updateIncident(params.id, params.incidentId, body, requester);
  reply.send({ error: false, data: incident, message: "Incidente actualizado correctamente." });
}

export async function deletePropertyIncidentController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = PropertyIncidentParamsSchema.parse(request.params);
  const requester = getAuthenticatedUser(request);
  const service = new PropertiesService(request.server.prisma);
  await service.deleteIncident(params.id, params.incidentId, requester);
  reply.send({ error: false, data: { deleted: true }, message: "Incidente eliminado correctamente." });
}

export async function listPropertyMembersController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = PropertyParamsSchema.parse(request.params);
  const requester = getAuthenticatedUser(request);
  const service = new PropertiesService(request.server.prisma);
  const members = await service.listMembers(params.id, requester);
  reply.send({ error: false, data: members });
}

export async function upsertPropertyMemberController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = PropertyParamsSchema.parse(request.params);
  const body = UpsertPropertyMemberSchema.parse(request.body);
  const requester = getAuthenticatedUser(request);
  const service = new PropertiesService(request.server.prisma);
  const member = await service.upsertMember(params.id, body, requester);
  reply.status(201).send({ error: false, data: member, message: "Acceso actualizado correctamente." });
}

export async function updatePropertyMemberController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = PropertyMemberParamsSchema.parse(request.params);
  const body = UpdatePropertyMemberSchema.parse(request.body);
  const requester = getAuthenticatedUser(request);
  const service = new PropertiesService(request.server.prisma);
  const member = await service.updateMember(params.id, params.userId, body, requester);
  reply.send({ error: false, data: member, message: "Acceso actualizado correctamente." });
}

export async function deletePropertyMemberController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = PropertyMemberParamsSchema.parse(request.params);
  const requester = getAuthenticatedUser(request);
  const service = new PropertiesService(request.server.prisma);
  await service.removeMember(params.id, params.userId, requester);
  reply.send({ error: false, data: { deleted: true }, message: "Acceso eliminado correctamente." });
}
