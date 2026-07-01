import { Permission } from "@sadoj/shared";
import type { FastifyPluginAsync } from "fastify";
import { requirePermission } from "../../shared/middleware/rbac.middleware";
import {
  createDecorationController,
  deleteDecorationController,
  listDecorationsController,
  updateDecorationController
} from "./decorations.controller";

export const decorationsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", { preHandler: [app.authenticate] }, listDecorationsController);
  app.post("/", { preHandler: [app.authenticate, requirePermission([Permission.MANAGE_USERS])] }, createDecorationController);
  app.patch("/:id", { preHandler: [app.authenticate, requirePermission([Permission.MANAGE_USERS])] }, updateDecorationController);
  app.delete("/:id", { preHandler: [app.authenticate, requirePermission([Permission.MANAGE_USERS])] }, deleteDecorationController);
};
