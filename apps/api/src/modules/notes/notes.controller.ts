import type { FastifyReply, FastifyRequest } from "fastify";
import { getAuthenticatedUser } from "../../shared/utils/authenticated-user";
import { CreateNoteSchema, NoteParamsSchema, ParentNoteParamsSchema, PinNoteSchema, UpdateNoteSchema } from "./notes.schema";
import { NotesService } from "./notes.service";

export async function listInvestigationNotesController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = ParentNoteParamsSchema.parse(request.params);
  const requester = getAuthenticatedUser(request);
  const service = new NotesService(request.server.prisma);
  const notes = await service.listForTarget({ type: "investigation", id: params.id }, requester);

  reply.send({ error: false, data: notes });
}

export async function createInvestigationNoteController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = ParentNoteParamsSchema.parse(request.params);
  const body = CreateNoteSchema.parse(request.body);
  const requester = getAuthenticatedUser(request);
  const service = new NotesService(request.server.prisma);
  const note = await service.createForTarget({ type: "investigation", id: params.id }, body, requester);

  reply.status(201).send({ error: false, data: note, message: "Nota añadida correctamente." });
}

export async function listSubjectNotesController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = ParentNoteParamsSchema.parse(request.params);
  const requester = getAuthenticatedUser(request);
  const service = new NotesService(request.server.prisma);
  const notes = await service.listForTarget({ type: "subject", id: params.id }, requester);

  reply.send({ error: false, data: notes });
}

export async function createSubjectNoteController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = ParentNoteParamsSchema.parse(request.params);
  const body = CreateNoteSchema.parse(request.body);
  const requester = getAuthenticatedUser(request);
  const service = new NotesService(request.server.prisma);
  const note = await service.createForTarget({ type: "subject", id: params.id }, body, requester);

  reply.status(201).send({ error: false, data: note, message: "Nota añadida correctamente." });
}

export async function listUserNotesController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = ParentNoteParamsSchema.parse(request.params);
  const requester = getAuthenticatedUser(request);
  const service = new NotesService(request.server.prisma);
  const notes = await service.listForTarget({ type: "user", id: params.id }, requester);

  reply.send({ error: false, data: notes });
}

export async function createUserNoteController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = ParentNoteParamsSchema.parse(request.params);
  const body = CreateNoteSchema.parse(request.body);
  const requester = getAuthenticatedUser(request);
  const service = new NotesService(request.server.prisma);
  const note = await service.createForTarget({ type: "user", id: params.id }, body, requester);

  reply.status(201).send({ error: false, data: note, message: "Nota añadida correctamente." });
}

export async function getNoteController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = NoteParamsSchema.parse(request.params);
  const requester = getAuthenticatedUser(request);
  const service = new NotesService(request.server.prisma);
  const note = await service.findById(params.id, requester);

  reply.send({ error: false, data: note });
}

export async function updateNoteController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = NoteParamsSchema.parse(request.params);
  const body = UpdateNoteSchema.parse(request.body);
  const requester = getAuthenticatedUser(request);
  const service = new NotesService(request.server.prisma);
  const note = await service.update(params.id, body, requester);

  reply.send({ error: false, data: note, message: "Nota actualizada correctamente." });
}

export async function pinNoteController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = NoteParamsSchema.parse(request.params);
  const body = PinNoteSchema.parse(request.body);
  const requester = getAuthenticatedUser(request);
  const service = new NotesService(request.server.prisma);
  const note = await service.pin(params.id, body, requester);

  reply.send({ error: false, data: note, message: "Nota fijada correctamente." });
}

export async function deleteNoteController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = NoteParamsSchema.parse(request.params);
  const requester = getAuthenticatedUser(request);
  const service = new NotesService(request.server.prisma);
  await service.delete(params.id, requester);

  reply.send({ error: false, data: { deleted: true }, message: "Nota eliminada correctamente." });
}
