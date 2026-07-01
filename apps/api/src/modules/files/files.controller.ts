import type { FastifyReply, FastifyRequest } from "fastify";
import { AppError } from "../../shared/errors/AppError";
import { getAuthenticatedUser } from "../../shared/utils/authenticated-user";
import { FileParamsSchema, FilesQuerySchema, FileUploadQuerySchema } from "./files.schema";
import { FilesService } from "./files.service";

export async function listFilesController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const query = FilesQuerySchema.parse(request.query);
  const requester = getAuthenticatedUser(request);
  const service = new FilesService(request.server.prisma);
  const files = await service.listForTarget({ type: query.targetType, id: query.targetId }, requester);

  reply.send({ error: false, data: files });
}

export async function uploadFileController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const query = FileUploadQuerySchema.parse(request.query);
  const requester = getAuthenticatedUser(request);
  const file = await request.file();

  if (file === undefined) {
    throw new AppError(400, "FILE_REQUIRED", "Debes adjuntar un archivo.");
  }

  const buffer = await file.toBuffer();
  const service = new FilesService(request.server.prisma);
  const result = await service.upload(buffer, file.filename, file.mimetype, requester, { type: query.targetType, id: query.targetId });

  reply.status(201).send({ error: false, data: result, message: "Archivo subido correctamente." });
}

export async function deleteFileController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = FileParamsSchema.parse(request.params);
  const requester = getAuthenticatedUser(request);
  const service = new FilesService(request.server.prisma);
  await service.delete(params.id, requester);

  reply.send({ error: false, data: { deleted: true }, message: "Archivo eliminado correctamente." });
}

export async function downloadFileController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = FileParamsSchema.parse(request.params);
  const requester = getAuthenticatedUser(request);
  const service = new FilesService(request.server.prisma);
  const url = await service.getSignedUrl(params.id, requester);

  reply.send({ error: false, data: { url } });
}
