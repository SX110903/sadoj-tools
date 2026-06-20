import type { FastifyReply, FastifyRequest } from "fastify";
import { getAuthenticatedUser } from "../../shared/utils/authenticated-user";
import {
  CreateMapDrawingSchema,
  CreateMapElementSchema,
  LinkMapElementSubjectSchema,
  MapDrawingParamsSchema,
  MapElementParamsSchema,
  MapElementsQuerySchema,
  MapElementSubjectParamsSchema,
  MapInvestigationParamsSchema,
  UpdateMapDrawingSchema,
  UpdateMapElementSchema
} from "./map.schema";
import { MapService } from "./map.service";

export async function listMapPropertiesController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const service = new MapService(request.server.prisma);
  const properties = await service.findProperties();

  reply.send({ error: false, data: properties });
}

export async function listMapZonesController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const service = new MapService(request.server.prisma);
  const zones = await service.findZones();

  reply.send({ error: false, data: zones });
}

export async function getInvestigationMapController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = MapInvestigationParamsSchema.parse(request.params);
  const requester = getAuthenticatedUser(request);
  const service = new MapService(request.server.prisma);
  const mapData = await service.findInvestigationMap(params.investigationId, requester);

  reply.send({ error: false, data: mapData });
}

export async function listMapElementsController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const query = MapElementsQuerySchema.parse(request.query);
  const requester = getAuthenticatedUser(request);
  const service = new MapService(request.server.prisma);
  const elements = await service.findElements(query, requester);

  reply.send({ error: false, data: elements });
}

export async function createMapElementController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const body = CreateMapElementSchema.parse(request.body);
  const requester = getAuthenticatedUser(request);
  const service = new MapService(request.server.prisma);
  const element = await service.createElement(body, requester);

  reply.status(201).send({ error: false, data: element, message: "Elemento de inteligencia guardado correctamente." });
}

export async function updateMapElementController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = MapElementParamsSchema.parse(request.params);
  const body = UpdateMapElementSchema.parse(request.body);
  const requester = getAuthenticatedUser(request);
  const service = new MapService(request.server.prisma);
  const element = await service.updateElement(params.id, body, requester);

  reply.send({ error: false, data: element, message: "Elemento de inteligencia actualizado correctamente." });
}

export async function deleteMapElementController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = MapElementParamsSchema.parse(request.params);
  const requester = getAuthenticatedUser(request);
  const service = new MapService(request.server.prisma);
  await service.deleteElement(params.id, requester);

  reply.send({ error: false, data: { deleted: true }, message: "Elemento de inteligencia eliminado correctamente." });
}

export async function linkMapElementSubjectController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = MapElementParamsSchema.parse(request.params);
  const body = LinkMapElementSubjectSchema.parse(request.body);
  const requester = getAuthenticatedUser(request);
  const service = new MapService(request.server.prisma);
  const link = await service.linkElementSubject(params.id, body, requester);

  reply.status(201).send({ error: false, data: link, message: "Sujeto vinculado al elemento correctamente." });
}

export async function unlinkMapElementSubjectController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = MapElementSubjectParamsSchema.parse(request.params);
  const requester = getAuthenticatedUser(request);
  const service = new MapService(request.server.prisma);
  await service.unlinkElementSubject(params.id, params.subjectId, requester);

  reply.send({ error: false, data: { unlinked: true }, message: "Sujeto desvinculado del elemento correctamente." });
}

export async function createMapDrawingController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const body = CreateMapDrawingSchema.parse(request.body);
  const requester = getAuthenticatedUser(request);
  const service = new MapService(request.server.prisma);
  const drawing = await service.createDrawing(body, requester);

  reply.status(201).send({ error: false, data: drawing, message: "Dibujo guardado correctamente." });
}

export async function updateMapDrawingController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = MapDrawingParamsSchema.parse(request.params);
  const body = UpdateMapDrawingSchema.parse(request.body);
  const requester = getAuthenticatedUser(request);
  const service = new MapService(request.server.prisma);
  const drawing = await service.updateDrawing(params.id, body, requester);

  reply.send({ error: false, data: drawing, message: "Dibujo actualizado correctamente." });
}

export async function deleteMapDrawingController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = MapDrawingParamsSchema.parse(request.params);
  const requester = getAuthenticatedUser(request);
  const service = new MapService(request.server.prisma);
  await service.deleteDrawing(params.id, requester);

  reply.send({ error: false, data: { deleted: true }, message: "Dibujo eliminado correctamente." });
}
