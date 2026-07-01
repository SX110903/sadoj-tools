import { TaskPriority, TaskStatus } from "../../shared/prisma";
import { z } from "zod";

export const TaskParamsSchema = z.object({
  id: z.string().min(1)
});

export const TasksQuerySchema = z.object({
  status: z.nativeEnum(TaskStatus).optional(),
  assignedToId: z.string().min(1).optional()
});

export const MyTasksQuerySchema = z.object({
  status: z.nativeEnum(TaskStatus).optional()
});

export const CreateTaskSchema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().max(2000).optional(),
  assignedToId: z.string().min(1),
  priority: z.nativeEnum(TaskPriority).optional(),
  investigationId: z.string().min(1).optional(),
  dueDate: z.string().datetime().optional()
});

export const UpdateTaskSchema = z.object({
  title: z.string().trim().min(3).max(160).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  dueDate: z.string().datetime().nullable().optional()
});

export type TasksQueryInput = z.infer<typeof TasksQuerySchema>;
export type MyTasksQueryInput = z.infer<typeof MyTasksQuerySchema>;
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
