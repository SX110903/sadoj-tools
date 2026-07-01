import type { FastifyReply, FastifyRequest } from "fastify";
import { getAuthenticatedUser } from "../../shared/utils/authenticated-user";
import {
  AssignExamSchema,
  AssignmentIdParamsSchema,
  CreateExamSchema,
  ExamParamsSchema,
  SubmitExamSchema,
  TakeParamsSchema,
  UpdateAssignmentSchema,
  UpdateExamSchema,
  UserExamResultsParamsSchema
} from "./exams.schema";
import { ExamsService } from "./exams.service";

export async function listExamsController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const service = new ExamsService(request.server.prisma);
  const exams = await service.listExams();
  reply.send({ error: false, data: exams });
}

export async function createExamController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const body = CreateExamSchema.parse(request.body);
  const actor = getAuthenticatedUser(request);
  const service = new ExamsService(request.server.prisma);
  const exam = await service.createExam(body, actor);
  reply.status(201).send({ error: false, data: exam, message: "Examen creado correctamente." });
}

export async function updateExamController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = ExamParamsSchema.parse(request.params);
  const body = UpdateExamSchema.parse(request.body);
  const actor = getAuthenticatedUser(request);
  const service = new ExamsService(request.server.prisma);
  const exam = await service.updateExam(params.id, body, actor);
  reply.send({ error: false, data: exam, message: "Examen actualizado correctamente." });
}

export async function deleteExamController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = ExamParamsSchema.parse(request.params);
  const actor = getAuthenticatedUser(request);
  const service = new ExamsService(request.server.prisma);
  await service.deleteExam(params.id, actor);
  reply.send({ error: false, data: { deleted: true }, message: "Examen eliminado correctamente." });
}

export async function listExamAssignmentsController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = ExamParamsSchema.parse(request.params);
  const service = new ExamsService(request.server.prisma);
  const assignments = await service.listAssignments(params.id);
  reply.send({ error: false, data: assignments });
}

export async function openExamAssignmentController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = ExamParamsSchema.parse(request.params);
  const body = AssignExamSchema.parse(request.body);
  const actor = getAuthenticatedUser(request);
  const service = new ExamsService(request.server.prisma);
  const assignment = await service.openAssignment(params.id, body, actor);
  reply.status(201).send({ error: false, data: assignment, message: "Examen abierto para el fiscal." });
}

export async function updateExamAssignmentController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = AssignmentIdParamsSchema.parse(request.params);
  const body = UpdateAssignmentSchema.parse(request.body);
  const actor = getAuthenticatedUser(request);
  const service = new ExamsService(request.server.prisma);
  const assignment = await service.updateAssignment(params.aid, body, actor);
  reply.send({ error: false, data: assignment, message: "Asignación actualizada correctamente." });
}

export async function deleteExamAssignmentController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = AssignmentIdParamsSchema.parse(request.params);
  const actor = getAuthenticatedUser(request);
  const service = new ExamsService(request.server.prisma);
  await service.deleteAssignment(params.aid, actor);
  reply.send({ error: false, data: { deleted: true }, message: "Asignación eliminada correctamente." });
}

export async function listAvailableExamsController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const requester = getAuthenticatedUser(request);
  const service = new ExamsService(request.server.prisma);
  const available = await service.listAvailable(requester.id);
  reply.send({ error: false, data: available });
}

export async function getExamForTakingController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = TakeParamsSchema.parse(request.params);
  const requester = getAuthenticatedUser(request);
  const service = new ExamsService(request.server.prisma);
  const exam = await service.getExamForTaking(params.assignmentId, requester);
  reply.send({ error: false, data: exam });
}

export async function submitExamController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = TakeParamsSchema.parse(request.params);
  const body = SubmitExamSchema.parse(request.body);
  const requester = getAuthenticatedUser(request);
  const service = new ExamsService(request.server.prisma);
  const result = await service.submit(params.assignmentId, body, requester);
  reply.send({ error: false, data: result, message: "Examen enviado correctamente." });
}

export async function listMyExamResultsController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const requester = getAuthenticatedUser(request);
  const service = new ExamsService(request.server.prisma);
  const results = await service.listMyResults(requester.id);
  reply.send({ error: false, data: results });
}

export async function listUserExamResultsController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = UserExamResultsParamsSchema.parse(request.params);
  const requester = getAuthenticatedUser(request);
  const service = new ExamsService(request.server.prisma);
  const results = await service.listUserResults(params.id, requester);
  reply.send({ error: false, data: results });
}
