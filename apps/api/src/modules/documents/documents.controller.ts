import type { FastifyReply, FastifyRequest } from "fastify";
import { getAuthenticatedUser } from "../../shared/utils/authenticated-user";
import {
  CreateDocumentSchema,
  DocumentParamsSchema,
  DocumentsQuerySchema,
  UpdateDocumentSchema,
  UpdateDocumentStatusSchema
} from "./documents.schema";
import { DocumentsService } from "./documents.service";

export async function listDocumentsController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const query = DocumentsQuerySchema.parse(request.query);
  const requester = getAuthenticatedUser(request);
  const service = new DocumentsService(request.server.prisma);
  const result = await service.findAll(requester, query);

  reply.send({ error: false, data: result.data, meta: result.meta });
}

export async function createDocumentController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const body = CreateDocumentSchema.parse(request.body);
  const requester = getAuthenticatedUser(request);
  const service = new DocumentsService(request.server.prisma);
  const document = await service.create(body, requester);

  reply.status(201).send({ error: false, data: document, message: "Documento creado correctamente." });
}

export async function getDocumentController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = DocumentParamsSchema.parse(request.params);
  const requester = getAuthenticatedUser(request);
  const service = new DocumentsService(request.server.prisma);
  const document = await service.findById(params.id, requester);

  reply.send({ error: false, data: document });
}

export async function updateDocumentController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = DocumentParamsSchema.parse(request.params);
  const body = UpdateDocumentSchema.parse(request.body);
  const requester = getAuthenticatedUser(request);
  const service = new DocumentsService(request.server.prisma);
  const document = await service.update(params.id, body, requester);

  reply.send({ error: false, data: document, message: "Documento actualizado correctamente." });
}

export async function updateDocumentStatusController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = DocumentParamsSchema.parse(request.params);
  const body = UpdateDocumentStatusSchema.parse(request.body);
  const requester = getAuthenticatedUser(request);
  const service = new DocumentsService(request.server.prisma);
  const document = await service.updateStatus(params.id, body, requester);

  reply.send({ error: false, data: document, message: "Estado actualizado correctamente." });
}

export async function signDocumentController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = DocumentParamsSchema.parse(request.params);
  const requester = getAuthenticatedUser(request);
  const service = new DocumentsService(request.server.prisma);
  const document = await service.sign(params.id, requester);

  reply.send({ error: false, data: document, message: "Documento firmado correctamente." });
}

export async function deleteDocumentController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = DocumentParamsSchema.parse(request.params);
  const requester = getAuthenticatedUser(request);
  const service = new DocumentsService(request.server.prisma);
  await service.delete(params.id, requester);

  reply.send({ error: false, data: { deleted: true }, message: "Documento eliminado correctamente." });
}
