import type { FastifyReply, FastifyRequest } from "fastify";
import { getAuthenticatedUser } from "../../shared/utils/authenticated-user";
import {
  AssignZoneSchema,
  CreateRelationshipSchema,
  CreateSubjectSchema,
  LinkPropertySchema,
  LinkVehicleSchema,
  SubjectParamsSchema,
  SubjectPropertyParamsSchema,
  SubjectRelationshipParamsSchema,
  SubjectsQuerySchema,
  SubjectVehicleParamsSchema,
  SubjectZoneParamsSchema,
  UpdateSubjectPhotoSchema,
  UpdateSubjectSchema
} from "./subjects.schema";
import { SubjectsService } from "./subjects.service";

export async function listSubjectsController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const query = SubjectsQuerySchema.parse(request.query);
  const service = new SubjectsService(request.server.prisma);
  const result = await service.search(query);
  reply.send({ error: false, data: result.data, meta: result.meta });
}

export async function createSubjectController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const body = CreateSubjectSchema.parse(request.body);
  const requester = getAuthenticatedUser(request);
  const service = new SubjectsService(request.server.prisma);
  const subject = await service.create(body, requester.id);
  reply.status(201).send({ error: false, data: subject, message: "Sujeto creado correctamente." });
}

export async function getSubjectController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = SubjectParamsSchema.parse(request.params);
  const requester = getAuthenticatedUser(request);
  const service = new SubjectsService(request.server.prisma);
  const subject = await service.findById(params.id, requester);
  reply.send({ error: false, data: subject });
}

export async function getSubjectTimelineController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = SubjectParamsSchema.parse(request.params);
  const requester = getAuthenticatedUser(request);
  const service = new SubjectsService(request.server.prisma);
  const timeline = await service.timeline(params.id, requester);
  reply.send({ error: false, data: timeline });
}

export async function updateSubjectController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = SubjectParamsSchema.parse(request.params);
  const body = UpdateSubjectSchema.parse(request.body);
  const service = new SubjectsService(request.server.prisma);
  const subject = await service.update(params.id, body);
  reply.send({ error: false, data: subject, message: "Sujeto actualizado correctamente." });
}

export async function deleteSubjectController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = SubjectParamsSchema.parse(request.params);
  const service = new SubjectsService(request.server.prisma);
  await service.delete(params.id);
  reply.send({ error: false, data: { deleted: true }, message: "Sujeto eliminado correctamente." });
}

export async function updateSubjectPhotoController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = SubjectParamsSchema.parse(request.params);
  const body = UpdateSubjectPhotoSchema.parse(request.body);
  const service = new SubjectsService(request.server.prisma);
  const subject = await service.updatePhoto(params.id, body.photoUrl);
  reply.send({ error: false, data: subject, message: "Foto actualizada correctamente." });
}

export async function linkSubjectVehicleController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = SubjectParamsSchema.parse(request.params);
  const body = LinkVehicleSchema.parse(request.body);
  const service = new SubjectsService(request.server.prisma);
  const vehicle = await service.linkVehicle(params.id, body);
  reply.send({ error: false, data: vehicle, message: "Vehículo vinculado correctamente." });
}

export async function unlinkSubjectVehicleController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = SubjectVehicleParamsSchema.parse(request.params);
  const service = new SubjectsService(request.server.prisma);
  await service.unlinkVehicle(params.id, params.vehicleId);
  reply.send({ error: false, data: { unlinked: true }, message: "Vehículo desvinculado correctamente." });
}

export async function linkSubjectPropertyController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = SubjectParamsSchema.parse(request.params);
  const body = LinkPropertySchema.parse(request.body);
  const service = new SubjectsService(request.server.prisma);
  const property = await service.linkProperty(params.id, body);
  reply.send({ error: false, data: property, message: "Propiedad vinculada correctamente." });
}

export async function unlinkSubjectPropertyController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = SubjectPropertyParamsSchema.parse(request.params);
  const service = new SubjectsService(request.server.prisma);
  await service.unlinkProperty(params.id, params.propertyId);
  reply.send({ error: false, data: { unlinked: true }, message: "Propiedad desvinculada correctamente." });
}

export async function addSubjectRelationshipController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = SubjectParamsSchema.parse(request.params);
  const body = CreateRelationshipSchema.parse(request.body);
  const service = new SubjectsService(request.server.prisma);
  const relationship = await service.addRelationship(params.id, body);
  reply.status(201).send({ error: false, data: relationship, message: "Relación creada correctamente." });
}

export async function removeSubjectRelationshipController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = SubjectRelationshipParamsSchema.parse(request.params);
  const service = new SubjectsService(request.server.prisma);
  await service.removeRelationship(params.relationshipId);
  reply.send({ error: false, data: { deleted: true }, message: "Relación eliminada correctamente." });
}

export async function assignSubjectZoneController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = SubjectParamsSchema.parse(request.params);
  const body = AssignZoneSchema.parse(request.body);
  const service = new SubjectsService(request.server.prisma);
  const zone = await service.assignZone(params.id, body);
  reply.send({ error: false, data: zone, message: "Zona asignada correctamente." });
}

export async function removeSubjectZoneController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = SubjectZoneParamsSchema.parse(request.params);
  const service = new SubjectsService(request.server.prisma);
  await service.removeZone(params.id, params.zoneId);
  reply.send({ error: false, data: { deleted: true }, message: "Zona desasignada correctamente." });
}
