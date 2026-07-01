import type { FastifyReply, FastifyRequest } from "fastify";
import { getAuthenticatedUser } from "../../shared/utils/authenticated-user";
import {
  ApproveCandidateSchema,
  CandidateParamsSchema,
  CandidatesQuerySchema,
  CreateCandidateSchema,
  CreateInterviewSchema,
  RejectCandidateSchema,
  UpdateCandidateSchema,
  UpdateInterviewSchema
} from "./hr.schema";
import { HrService } from "./hr.service";

export async function listCandidatesController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const query = CandidatesQuerySchema.parse(request.query);
  const result = await new HrService(request.server.prisma).findAll(query);
  reply.send({ error: false, data: result.data, meta: result.meta });
}

export async function createCandidateController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const body = CreateCandidateSchema.parse(request.body);
  const candidate = await new HrService(request.server.prisma).create(body, getAuthenticatedUser(request));
  reply.status(201).send({ error: false, data: candidate, message: "Candidato registrado correctamente." });
}

export async function getCandidateController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = CandidateParamsSchema.parse(request.params);
  const candidate = await new HrService(request.server.prisma).findById(params.id);
  reply.send({ error: false, data: candidate });
}

export async function updateCandidateController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = CandidateParamsSchema.parse(request.params);
  const body = UpdateCandidateSchema.parse(request.body);
  const candidate = await new HrService(request.server.prisma).update(params.id, body);
  reply.send({ error: false, data: candidate, message: "Datos del candidato actualizados." });
}

export async function deleteCandidateController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = CandidateParamsSchema.parse(request.params);
  await new HrService(request.server.prisma).delete(params.id);
  reply.send({ error: false, data: { deleted: true }, message: "Candidato eliminado correctamente." });
}

export async function createInterviewController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = CandidateParamsSchema.parse(request.params);
  const body = CreateInterviewSchema.parse(request.body);
  const interview = await new HrService(request.server.prisma).createInterview(params.id, body, getAuthenticatedUser(request));
  reply.status(201).send({ error: false, data: interview, message: "Entrevista registrada correctamente." });
}

export async function updateInterviewController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = CandidateParamsSchema.parse(request.params);
  const body = UpdateInterviewSchema.parse(request.body);
  const interview = await new HrService(request.server.prisma).updateInterview(params.id, body);
  reply.send({ error: false, data: interview, message: "Entrevista actualizada correctamente." });
}

export async function approveCandidateController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = CandidateParamsSchema.parse(request.params);
  const body = ApproveCandidateSchema.parse(request.body);
  const candidate = await new HrService(request.server.prisma).approve(params.id, body, getAuthenticatedUser(request));
  reply.send({ error: false, data: candidate, message: "Candidato aprobado y cuenta de Legal Staff creada." });
}

export async function rejectCandidateController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = CandidateParamsSchema.parse(request.params);
  const body = RejectCandidateSchema.parse(request.body);
  const candidate = await new HrService(request.server.prisma).reject(params.id, body, getAuthenticatedUser(request));
  reply.send({ error: false, data: candidate, message: "Candidato rechazado." });
}
