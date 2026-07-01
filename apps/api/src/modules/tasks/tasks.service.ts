import { hasPermission, Permission, ROLE_LEVEL, type RoleType } from "@sadoj/shared";
import { AppError } from "../../shared/errors/AppError";
import { NotificationType, Prisma, TaskStatus, type PrismaClient } from "../../shared/prisma";
import type { AuthenticatedUser } from "../../types/fastify";
import { NotificationsService } from "../notifications/notifications.service";
import type { CreateTaskInput, MyTasksQueryInput, TasksQueryInput, UpdateTaskInput } from "./tasks.schema";

const TASK_INCLUDE = {
  assignedTo: { select: { id: true, displayName: true, role: true, avatar: true } },
  assignedBy: { select: { id: true, displayName: true, role: true, avatar: true } },
  investigation: { select: { id: true, caseNumber: true, title: true } }
} satisfies Prisma.TaskInclude;

export class TasksService {
  public constructor(private readonly prisma: PrismaClient) {}

  public async findMine(userId: string, query: MyTasksQueryInput): Promise<unknown[]> {
    const where: Prisma.TaskWhereInput = { assignedToId: userId };
    if (query.status !== undefined) where.status = query.status;

    return this.prisma.task.findMany({
      where,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: TASK_INCLUDE
    });
  }

  public async findAll(query: TasksQueryInput): Promise<unknown[]> {
    const where: Prisma.TaskWhereInput = {};
    if (query.status !== undefined) where.status = query.status;
    if (query.assignedToId !== undefined) where.assignedToId = query.assignedToId;

    return this.prisma.task.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: TASK_INCLUDE
    });
  }

  public async create(data: CreateTaskInput, creator: AuthenticatedUser): Promise<unknown> {
    const assignee = await this.prisma.user.findUnique({ where: { id: data.assignedToId }, select: { id: true, role: true } });

    if (assignee === null) {
      throw new AppError(404, "USER_NOT_FOUND", "No se encontró el fiscal destinatario.");
    }

    if (!this.canAssignTo(creator, assignee.role as RoleType, assignee.id)) {
      throw new AppError(403, "FORBIDDEN", "No puedes asignar tareas a un fiscal de rango superior.");
    }

    if (data.investigationId !== undefined) {
      await this.ensureInvestigationExists(data.investigationId);
    }

    const createData: Prisma.TaskUncheckedCreateInput = {
      title: data.title,
      assignedToId: data.assignedToId,
      assignedById: creator.id
    };
    if (data.description !== undefined) createData.description = data.description;
    if (data.priority !== undefined) createData.priority = data.priority;
    if (data.investigationId !== undefined) createData.investigationId = data.investigationId;
    if (data.dueDate !== undefined) createData.dueDate = new Date(data.dueDate);

    const task = await this.prisma.$transaction(async (transaction) => {
      const created = await transaction.task.create({ data: createData, include: TASK_INCLUDE });

      await transaction.auditLog.create({
        data: {
          userId: creator.id,
          action: "ASSIGN_TASK",
          entity: "Task",
          entityId: created.id,
          meta: { assignedToId: data.assignedToId, title: data.title }
        }
      });

      return created;
    });

    await new NotificationsService(this.prisma).notify({
      recipientId: data.assignedToId,
      actorId: creator.id,
      type: NotificationType.TASK_ASSIGNED,
      title: "Nueva tarea asignada",
      message: `Se te ha asignado la tarea «${data.title}».`,
      link: "/perfil",
      meta: { taskId: task.id, title: data.title }
    });

    return task;
  }

  public async update(id: string, data: UpdateTaskInput, requester: AuthenticatedUser): Promise<unknown> {
    const task = await this.prisma.task.findUnique({ where: { id }, select: { id: true, assignedToId: true, assignedById: true, status: true } });

    if (task === null) {
      throw new AppError(404, "TASK_NOT_FOUND", "No se encontró la tarea solicitada.");
    }

    const isAssigner = task.assignedById === requester.id;
    const isAssignee = task.assignedToId === requester.id;
    const canManage = isAssigner || hasPermission(requester.role, Permission.MANAGE_USERS);

    if (!canManage && !isAssignee) {
      throw new AppError(403, "FORBIDDEN", "No tienes permisos para modificar esta tarea.");
    }

    const updateData = this.buildUpdateData(data, canManage);

    if (data.status !== undefined) {
      updateData.completedAt = data.status === TaskStatus.DONE ? new Date() : null;
    }

    return this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.task.update({ where: { id }, data: updateData, include: TASK_INCLUDE });

      await transaction.auditLog.create({
        data: { userId: requester.id, action: "UPDATE_TASK", entity: "Task", entityId: id, meta: { status: updated.status } }
      });

      return updated;
    });
  }

  public async delete(id: string, requester: AuthenticatedUser): Promise<void> {
    const task = await this.prisma.task.findUnique({ where: { id }, select: { id: true, assignedById: true } });

    if (task === null) {
      throw new AppError(404, "TASK_NOT_FOUND", "No se encontró la tarea solicitada.");
    }

    if (task.assignedById !== requester.id && !hasPermission(requester.role, Permission.MANAGE_USERS)) {
      throw new AppError(403, "FORBIDDEN", "No tienes permisos para eliminar esta tarea.");
    }

    await this.prisma.$transaction(async (transaction) => {
      await transaction.task.delete({ where: { id } });
      await transaction.auditLog.create({
        data: { userId: requester.id, action: "DELETE_TASK", entity: "Task", entityId: id }
      });
    });
  }

  private buildUpdateData(data: UpdateTaskInput, canManage: boolean): Prisma.TaskUncheckedUpdateInput {
    const updateData: Prisma.TaskUncheckedUpdateInput = {};

    if (data.status !== undefined) updateData.status = data.status;

    // The assignee may only move a task's status; details belong to the assigner.
    if (!canManage) {
      return updateData;
    }

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate === null ? null : new Date(data.dueDate);

    return updateData;
  }

  private canAssignTo(creator: AuthenticatedUser, assigneeRole: RoleType, assigneeId: string): boolean {
    if (creator.id === assigneeId || hasPermission(creator.role, Permission.MANAGE_USERS)) {
      return true;
    }

    return ROLE_LEVEL[creator.role] > ROLE_LEVEL[assigneeRole];
  }

  private async ensureInvestigationExists(investigationId: string): Promise<void> {
    const investigation = await this.prisma.investigation.findUnique({ where: { id: investigationId }, select: { id: true } });

    if (investigation === null) {
      throw new AppError(404, "INVESTIGATION_NOT_FOUND", "No se encontró la investigación indicada.");
    }
  }
}
