import type { FastifyReply, FastifyRequest } from "fastify";
import { getAuthenticatedUser } from "../../shared/utils/authenticated-user";
import {
  ChangeStatusSchema,
  CreateInvestigationSchema,
  InvestigationParamsSchema,
  InvestigationParticipantParamsSchema,
  InvestigationSubjectParamsSchema,
  InvestigationsQuerySchema,
  LinkSubjectSchema,
  ShareInvestigationSchema,
  UpdateInvestigationSchema
} from "./investigations.schema";
import { InvestigationsService } from "./investigations.service";

export async function listInvestigationsController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const query = InvestigationsQuerySchema.parse(request.query);
  const requester = getAuthenticatedUser(request);
  const service = new InvestigationsService(request.server.prisma);
  const result = await service.findAll(requester, query);

  reply.send({ error: false, data: result.data, meta: result.meta });
}

export async function createInvestigationController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const body = CreateInvestigationSchema.parse(request.body);
  const requester = getAuthenticatedUser(request);
  const service = new InvestigationsService(request.server.prisma);
  const investigation = await service.create(body, requester);

  reply.status(201).send({ error: false, data: investigation, message: "Investigación creada correctamente." });
}

export async function getInvestigationController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = InvestigationParamsSchema.parse(request.params);
  const requester = getAuthenticatedUser(request);
  const service = new InvestigationsService(request.server.prisma);
  const investigation = await service.findById(params.id, requester);

  reply.send({ error: false, data: investigation });
}

export async function getInvestigationDatalinkController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = InvestigationParamsSchema.parse(request.params);
  const requester = getAuthenticatedUser(request);
  const service = new InvestigationsService(request.server.prisma);
  const graph = await service.getDatalink(params.id, requester);

  reply.send({ error: false, data: graph });
}

export async function getInvestigationTimelineController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = InvestigationParamsSchema.parse(request.params);
  const requester = getAuthenticatedUser(request);
  const service = new InvestigationsService(request.server.prisma);
  const timeline = await service.timeline(params.id, requester);

  reply.send({ error: false, data: timeline });
}

export async function updateInvestigationController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = InvestigationParamsSchema.parse(request.params);
  const body = UpdateInvestigationSchema.parse(request.body);
  const requester = getAuthenticatedUser(request);
  const service = new InvestigationsService(request.server.prisma);
  const investigation = await service.update(params.id, body, requester);

  reply.send({ error: false, data: investigation, message: "Investigación actualizada correctamente." });
}

export async function closeInvestigationController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = InvestigationParamsSchema.parse(request.params);
  const requester = getAuthenticatedUser(request);
  const service = new InvestigationsService(request.server.prisma);
  const investigation = await service.closeAsDismissed(params.id, requester);

  reply.send({ error: false, data: investigation, message: "Investigación cerrada correctamente." });
}

export async function changeInvestigationStatusController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = InvestigationParamsSchema.parse(request.params);
  const body = ChangeStatusSchema.parse(request.body);
  const requester = getAuthenticatedUser(request);
  const service = new InvestigationsService(request.server.prisma);
  const investigation = await service.update(params.id, { status: body.status }, requester);

  reply.send({ error: false, data: investigation, message: "Estado actualizado correctamente." });
}

export async function shareInvestigationController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = InvestigationParamsSchema.parse(request.params);
  const body = ShareInvestigationSchema.parse(request.body);
  const requester = getAuthenticatedUser(request);
  const service = new InvestigationsService(request.server.prisma);
  const participant = await service.share(params.id, body, requester);

  reply.send({ error: false, data: participant, message: "Investigación compartida correctamente." });
}

export async function revokeInvestigationAccessController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = InvestigationParticipantParamsSchema.parse(request.params);
  const requester = getAuthenticatedUser(request);
  const service = new InvestigationsService(request.server.prisma);
  await service.revokeAccess(params.id, params.userId, requester);

  reply.send({ error: false, data: { revoked: true }, message: "Acceso revocado correctamente." });
}

export async function listInvestigationParticipantsController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = InvestigationParamsSchema.parse(request.params);
  const requester = getAuthenticatedUser(request);
  const service = new InvestigationsService(request.server.prisma);
  const participants = await service.listParticipants(params.id, requester);

  reply.send({ error: false, data: participants });
}

export async function listInvestigationSubjectsController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = InvestigationParamsSchema.parse(request.params);
  const requester = getAuthenticatedUser(request);
  const service = new InvestigationsService(request.server.prisma);
  const subjects = await service.listSubjects(params.id, requester);

  reply.send({ error: false, data: subjects });
}

export async function linkInvestigationSubjectController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = InvestigationParamsSchema.parse(request.params);
  const body = LinkSubjectSchema.parse(request.body);
  const requester = getAuthenticatedUser(request);
  const service = new InvestigationsService(request.server.prisma);
  const subject = await service.linkSubject(params.id, body, requester);

  reply.send({ error: false, data: subject, message: "Sujeto vinculado correctamente." });
}

export async function unlinkInvestigationSubjectController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = InvestigationSubjectParamsSchema.parse(request.params);
  const requester = getAuthenticatedUser(request);
  const service = new InvestigationsService(request.server.prisma);
  await service.unlinkSubject(params.id, params.subjectId, requester);

  reply.send({ error: false, data: { unlinked: true }, message: "Sujeto desvinculado correctamente." });
}
