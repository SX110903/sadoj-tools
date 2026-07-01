import type { FastifyReply, FastifyRequest } from "fastify";
import { AppError } from "../../shared/errors/AppError";
import { getAuthenticatedUser } from "../../shared/utils/authenticated-user";
import { FilesService } from "../files/files.service";
import {
  BatchUpdateBoardCardsSchema,
  BoardCardParamsSchema,
  BoardConnectionParamsSchema,
  BoardParamsSchema,
  BoardStepParamsSchema,
  CreateBoardCardSchema,
  CreateBoardConnectionSchema,
  CreateGlobalBoardSchema,
  CreateBoardStepSchema,
  ReorderBoardStepsSchema,
  ScopedBoardParamsSchema,
  UpdateBoardCardSchema,
  UpdateBoardConnectionSchema,
  UpdateBoardStepSchema
} from "./boards.schema";
import { BoardsService } from "./boards.service";

const STEP_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function getScopedBoardController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = ScopedBoardParamsSchema.parse(request.params);
  const requester = getAuthenticatedUser(request);
  const service = new BoardsService(request.server.prisma);
  const board = await service.getScopedBoard(params.scope, params.id, requester);
  reply.send({ error: false, data: board });
}

export async function listGlobalBoardsController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const requester = getAuthenticatedUser(request);
  const service = new BoardsService(request.server.prisma);
  const boards = await service.listGlobalBoards(requester);
  reply.send({ error: false, data: boards });
}

export async function createGlobalBoardController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const body = CreateGlobalBoardSchema.parse(request.body);
  const requester = getAuthenticatedUser(request);
  const service = new BoardsService(request.server.prisma);
  const board = await service.createGlobalBoard(body, requester);
  reply.status(201).send({ error: false, data: board, message: "Pizarra global creada correctamente." });
}

export async function getGlobalBoardController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = BoardParamsSchema.parse(request.params);
  const requester = getAuthenticatedUser(request);
  const service = new BoardsService(request.server.prisma);
  const board = await service.getBoard(params.boardId, requester);
  reply.send({ error: false, data: board });
}

export async function deleteGlobalBoardController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = BoardParamsSchema.parse(request.params);
  const requester = getAuthenticatedUser(request);
  const service = new BoardsService(request.server.prisma);
  await service.deleteGlobalBoard(params.boardId, requester);
  reply.send({ error: false, data: { deleted: true }, message: "Pizarra global eliminada correctamente." });
}

export async function createBoardCardController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = BoardParamsSchema.parse(request.params);
  const body = CreateBoardCardSchema.parse(request.body);
  const requester = getAuthenticatedUser(request);
  const service = new BoardsService(request.server.prisma);
  const board = await service.createCard(params.boardId, body, requester);
  reply.status(201).send({ error: false, data: board, message: "Tarjeta creada correctamente." });
}

export async function updateBoardCardController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = BoardCardParamsSchema.parse(request.params);
  const body = UpdateBoardCardSchema.parse(request.body);
  const requester = getAuthenticatedUser(request);
  const service = new BoardsService(request.server.prisma);
  const board = await service.updateCard(params.boardId, params.cardId, body, requester);
  reply.send({ error: false, data: board, message: "Tarjeta actualizada correctamente." });
}

export async function batchUpdateBoardCardsController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = BoardParamsSchema.parse(request.params);
  const body = BatchUpdateBoardCardsSchema.parse(request.body);
  const requester = getAuthenticatedUser(request);
  const service = new BoardsService(request.server.prisma);
  const board = await service.batchUpdateCards(params.boardId, body, requester);
  reply.send({ error: false, data: board });
}

export async function deleteBoardCardController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = BoardCardParamsSchema.parse(request.params);
  const requester = getAuthenticatedUser(request);
  const service = new BoardsService(request.server.prisma);
  const board = await service.deleteCard(params.boardId, params.cardId, requester);
  reply.send({ error: false, data: board, message: "Tarjeta eliminada correctamente." });
}

export async function listBoardStepsController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = BoardParamsSchema.parse(request.params);
  const requester = getAuthenticatedUser(request);
  const steps = await new BoardsService(request.server.prisma).listSteps(params.boardId, requester);
  reply.send({ error: false, data: steps });
}

export async function createBoardStepController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = BoardParamsSchema.parse(request.params);
  const body = CreateBoardStepSchema.parse(request.body);
  const requester = getAuthenticatedUser(request);
  const board = await new BoardsService(request.server.prisma).createStep(params.boardId, body, requester);
  reply.status(201).send({ error: false, data: board, message: "Paso añadido correctamente." });
}

export async function updateBoardStepController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = BoardStepParamsSchema.parse(request.params);
  const body = UpdateBoardStepSchema.parse(request.body);
  const requester = getAuthenticatedUser(request);
  const board = await new BoardsService(request.server.prisma).updateStep(params.boardId, params.stepId, body, requester);
  reply.send({ error: false, data: board, message: "Paso actualizado correctamente." });
}

export async function reorderBoardStepsController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = BoardParamsSchema.parse(request.params);
  const body = ReorderBoardStepsSchema.parse(request.body);
  const requester = getAuthenticatedUser(request);
  const board = await new BoardsService(request.server.prisma).reorderSteps(params.boardId, body, requester);
  reply.send({ error: false, data: board, message: "Pasos reordenados correctamente." });
}

export async function deleteBoardStepController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = BoardStepParamsSchema.parse(request.params);
  const requester = getAuthenticatedUser(request);
  const board = await new BoardsService(request.server.prisma).deleteStep(params.boardId, params.stepId, requester);
  reply.send({ error: false, data: board, message: "Paso eliminado correctamente." });
}

export async function uploadBoardStepImageController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = BoardStepParamsSchema.parse(request.params);
  const requester = getAuthenticatedUser(request);
  const multipartFile = await request.file();

  if (multipartFile === undefined) {
    throw new AppError(400, "FILE_REQUIRED", "Debes adjuntar una imagen.");
  }

  if (!STEP_IMAGE_MIME_TYPES.has(multipartFile.mimetype)) {
    throw new AppError(400, "INVALID_STEP_IMAGE", "La imagen debe ser JPG, PNG, WebP o GIF.");
  }

  const buffer = await multipartFile.toBuffer();
  const upload = await new FilesService(request.server.prisma).upload(
    buffer,
    multipartFile.filename,
    multipartFile.mimetype,
    requester,
    { type: "evidenceBoard", id: params.boardId }
  );
  const fileId = readUploadedFileId(upload.file);
  const board = await new BoardsService(request.server.prisma).updateStep(params.boardId, params.stepId, { fileId }, requester);
  reply.status(201).send({ error: false, data: board, message: "Imagen del paso actualizada correctamente." });
}

function readUploadedFileId(file: unknown): string {
  if (typeof file === "object" && file !== null && "id" in file && typeof file.id === "string") {
    return file.id;
  }

  throw new AppError(500, "INVALID_UPLOAD_RESULT", "No se pudo vincular la imagen subida.");
}

export async function createBoardConnectionController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = BoardParamsSchema.parse(request.params);
  const body = CreateBoardConnectionSchema.parse(request.body);
  const requester = getAuthenticatedUser(request);
  const service = new BoardsService(request.server.prisma);
  const board = await service.createConnection(params.boardId, body, requester);
  reply.status(201).send({ error: false, data: board, message: "Conexión creada correctamente." });
}

export async function updateBoardConnectionController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = BoardConnectionParamsSchema.parse(request.params);
  const body = UpdateBoardConnectionSchema.parse(request.body);
  const requester = getAuthenticatedUser(request);
  const service = new BoardsService(request.server.prisma);
  const board = await service.updateConnection(params.boardId, params.connectionId, body, requester);
  reply.send({ error: false, data: board, message: "Conexión actualizada correctamente." });
}

export async function deleteBoardConnectionController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = BoardConnectionParamsSchema.parse(request.params);
  const requester = getAuthenticatedUser(request);
  const service = new BoardsService(request.server.prisma);
  const board = await service.deleteConnection(params.boardId, params.connectionId, requester);
  reply.send({ error: false, data: board, message: "Conexión eliminada correctamente." });
}
