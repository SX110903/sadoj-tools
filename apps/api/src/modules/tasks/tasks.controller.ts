import type { FastifyReply, FastifyRequest } from "fastify";
import { getAuthenticatedUser } from "../../shared/utils/authenticated-user";
import { CreateTaskSchema, MyTasksQuerySchema, TaskParamsSchema, TasksQuerySchema, UpdateTaskSchema } from "./tasks.schema";
import { TasksService } from "./tasks.service";

export async function listMyTasksController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const query = MyTasksQuerySchema.parse(request.query);
  const requester = getAuthenticatedUser(request);
  const service = new TasksService(request.server.prisma);
  const tasks = await service.findMine(requester.id, query);

  reply.send({ error: false, data: tasks });
}

export async function listTasksController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const query = TasksQuerySchema.parse(request.query);
  const service = new TasksService(request.server.prisma);
  const tasks = await service.findAll(query);

  reply.send({ error: false, data: tasks });
}

export async function createTaskController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const body = CreateTaskSchema.parse(request.body);
  const creator = getAuthenticatedUser(request);
  const service = new TasksService(request.server.prisma);
  const task = await service.create(body, creator);

  reply.status(201).send({ error: false, data: task, message: "Tarea asignada correctamente." });
}

export async function updateTaskController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = TaskParamsSchema.parse(request.params);
  const body = UpdateTaskSchema.parse(request.body);
  const requester = getAuthenticatedUser(request);
  const service = new TasksService(request.server.prisma);
  const task = await service.update(params.id, body, requester);

  reply.send({ error: false, data: task, message: "Tarea actualizada correctamente." });
}

export async function deleteTaskController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = TaskParamsSchema.parse(request.params);
  const requester = getAuthenticatedUser(request);
  const service = new TasksService(request.server.prisma);
  await service.delete(params.id, requester);

  reply.send({ error: false, data: { deleted: true }, message: "Tarea eliminada correctamente." });
}
