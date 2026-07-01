import { Permission } from "@sadoj/shared";
import type { FastifyPluginAsync } from "fastify";
import { requirePermission } from "../../shared/middleware/rbac.middleware";
import {
  createTaskController,
  deleteTaskController,
  listMyTasksController,
  listTasksController,
  updateTaskController
} from "./tasks.controller";

export const tasksRoutes: FastifyPluginAsync = async (app) => {
  app.get("/mine", { preHandler: [app.authenticate] }, listMyTasksController);
  app.get("/", { preHandler: [app.authenticate, requirePermission([Permission.MANAGE_USERS])] }, listTasksController);
  app.post("/", { preHandler: [app.authenticate] }, createTaskController);
  app.patch("/:id", { preHandler: [app.authenticate] }, updateTaskController);
  app.delete("/:id", { preHandler: [app.authenticate] }, deleteTaskController);
};
