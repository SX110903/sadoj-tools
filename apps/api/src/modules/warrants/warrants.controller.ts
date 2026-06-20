import type { FastifyReply, FastifyRequest } from "fastify";
import { AppError } from "../../shared/errors/AppError";
import { getAuthenticatedUser } from "../../shared/utils/authenticated-user";
import { FilesService } from "../files/files.service";
import {
  CreateWarrantReportSchema,
  CreateWarrantSchema,
  ExecuteWarrantSchema,
  RejectWarrantSchema,
  WarrantParamsSchema,
  WarrantsQuerySchema
} from "./warrants.schema";
import { WarrantsService } from "./warrants.service";

export async function listWarrantsController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const query = WarrantsQuerySchema.parse(request.query);
  const requester = getAuthenticatedUser(request);
  const service = new WarrantsService(request.server.prisma);
  const result = await service.findAll(requester, query);

  reply.send({ error: false, data: result.data, meta: result.meta });
}

export async function createWarrantController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const body = CreateWarrantSchema.parse(request.body);
  const requester = getAuthenticatedUser(request);
  const service = new WarrantsService(request.server.prisma);
  const warrant = await service.create(body, requester);

  reply.status(201).send({ error: false, data: warrant, message: "Orden judicial creada correctamente." });
}

export async function getWarrantController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = WarrantParamsSchema.parse(request.params);
  const requester = getAuthenticatedUser(request);
  const service = new WarrantsService(request.server.prisma);
  const warrant = await service.findById(params.id, requester);

  reply.send({ error: false, data: warrant });
}

export async function approveWarrantController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = WarrantParamsSchema.parse(request.params);
  const requester = getAuthenticatedUser(request);
  const service = new WarrantsService(request.server.prisma);
  const warrant = await service.approve(params.id, requester);

  reply.send({ error: false, data: warrant, message: "Orden aprobada correctamente." });
}

export async function rejectWarrantController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = WarrantParamsSchema.parse(request.params);
  const body = RejectWarrantSchema.parse(request.body);
  const requester = getAuthenticatedUser(request);
  const service = new WarrantsService(request.server.prisma);
  const warrant = await service.reject(params.id, body, requester);

  reply.send({ error: false, data: warrant, message: "Orden rechazada correctamente." });
}

export async function executeWarrantController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = WarrantParamsSchema.parse(request.params);
  const body = ExecuteWarrantSchema.parse(request.body);
  const requester = getAuthenticatedUser(request);
  const service = new WarrantsService(request.server.prisma);
  const warrant = await service.execute(params.id, body, requester);

  reply.send({ error: false, data: warrant, message: "Orden marcada como ejecutada." });
}

export async function getWarrantReportController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = WarrantParamsSchema.parse(request.params);
  const requester = getAuthenticatedUser(request);
  const service = new WarrantsService(request.server.prisma);
  const report = await service.getReport(params.id, requester);

  reply.send({ error: false, data: report });
}

export async function createWarrantReportController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = WarrantParamsSchema.parse(request.params);
  const body = CreateWarrantReportSchema.parse(request.body);
  const requester = getAuthenticatedUser(request);
  const service = new WarrantsService(request.server.prisma);
  const report = await service.createReport(params.id, body, requester);

  reply.status(201).send({ error: false, data: report, message: "Informe registrado correctamente." });
}

export async function uploadWarrantFileController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = WarrantParamsSchema.parse(request.params);
  const requester = getAuthenticatedUser(request);
  const file = await request.file();

  if (file === undefined) {
    throw new AppError(400, "FILE_REQUIRED", "Debes adjuntar un archivo.");
  }

  const buffer = await file.toBuffer();
  const service = new FilesService(request.server.prisma);
  const result = await service.upload(buffer, file.filename, file.mimetype, requester, { type: "warrant", id: params.id });

  reply.status(201).send({ error: false, data: result, message: "Archivo adjuntado correctamente." });
}
