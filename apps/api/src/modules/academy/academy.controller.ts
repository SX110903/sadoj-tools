import type { FastifyReply, FastifyRequest } from "fastify";
import { getAuthenticatedUser } from "../../shared/utils/authenticated-user";
import {
  AcademyClassParamsSchema,
  AcademyContentParamsSchema,
  AcademyContentQuerySchema,
  AcademyUserParamsSchema,
  CreateAcademyClassSchema,
  CreateAcademyContentSchema,
  MarkAttendanceSchema,
  UpdateAcademyClassSchema,
  UpdateAcademyContentSchema
} from "./academy.schema";
import { AcademyService } from "./academy.service";

export async function listAcademyContentController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const query = AcademyContentQuerySchema.parse(request.query);
  const content = await new AcademyService(request.server.prisma).listContent(query);
  reply.send({ error: false, data: content });
}

export async function getAcademyContentController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = AcademyContentParamsSchema.parse(request.params);
  const content = await new AcademyService(request.server.prisma).findContent(params.id);
  reply.send({ error: false, data: content });
}

export async function createAcademyContentController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const body = CreateAcademyContentSchema.parse(request.body);
  const content = await new AcademyService(request.server.prisma).createContent(body, getAuthenticatedUser(request));
  reply.status(201).send({ error: false, data: content, message: "Contenido publicado correctamente." });
}

export async function updateAcademyContentController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = AcademyContentParamsSchema.parse(request.params);
  const body = UpdateAcademyContentSchema.parse(request.body);
  const content = await new AcademyService(request.server.prisma).updateContent(params.id, body, getAuthenticatedUser(request));
  reply.send({ error: false, data: content, message: "Contenido actualizado correctamente." });
}

export async function deleteAcademyContentController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = AcademyContentParamsSchema.parse(request.params);
  await new AcademyService(request.server.prisma).deleteContent(params.id, getAuthenticatedUser(request));
  reply.send({ error: false, data: { deleted: true }, message: "Contenido eliminado correctamente." });
}

export async function listAcademyClassesController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const classes = await new AcademyService(request.server.prisma).listClasses();
  reply.send({ error: false, data: classes });
}

export async function createAcademyClassController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const body = CreateAcademyClassSchema.parse(request.body);
  const academyClass = await new AcademyService(request.server.prisma).createClass(body, getAuthenticatedUser(request));
  reply.status(201).send({ error: false, data: academyClass, message: "Clase creada correctamente." });
}

export async function updateAcademyClassController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = AcademyClassParamsSchema.parse(request.params);
  const body = UpdateAcademyClassSchema.parse(request.body);
  const academyClass = await new AcademyService(request.server.prisma).updateClass(params.id, body, getAuthenticatedUser(request));
  reply.send({ error: false, data: academyClass, message: "Clase actualizada correctamente." });
}

export async function getClassAttendanceController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = AcademyClassParamsSchema.parse(request.params);
  const attendance = await new AcademyService(request.server.prisma).getClassAttendance(params.id);
  reply.send({ error: false, data: attendance });
}

export async function markClassAttendanceController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = AcademyClassParamsSchema.parse(request.params);
  const entries = MarkAttendanceSchema.parse(request.body);
  const attendance = await new AcademyService(request.server.prisma).markAttendance(params.id, entries, getAuthenticatedUser(request));
  reply.send({ error: false, data: attendance, message: "Asistencia guardada correctamente." });
}

export async function getMyAttendanceController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const attendance = await new AcademyService(request.server.prisma).getMyAttendance(getAuthenticatedUser(request).id);
  reply.send({ error: false, data: attendance });
}

export async function getMyAcademyRecordController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const record = await new AcademyService(request.server.prisma).getMyRecord(getAuthenticatedUser(request).id);
  reply.send({ error: false, data: record });
}

export async function getUserAcademyRecordController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = AcademyUserParamsSchema.parse(request.params);
  const record = await new AcademyService(request.server.prisma).getUserRecord(params.id, getAuthenticatedUser(request));
  reply.send({ error: false, data: record });
}
