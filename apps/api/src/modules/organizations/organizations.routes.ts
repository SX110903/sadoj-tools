import { Permission } from "@sadoj/shared";
import type { FastifyPluginAsync } from "fastify";
import { requirePermission } from "../../shared/middleware/rbac.middleware";
import {
  createOrganizationController,
  deleteOrganizationController,
  getOrganizationController,
  listOrganizationsController,
  updateOrganizationController
} from "./organizations.controller";

export const organizationsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", { preHandler: [app.authenticate, requirePermission([Permission.VIEW_SUBJECTS])] }, listOrganizationsController);
  app.post("/", { preHandler: [app.authenticate, requirePermission([Permission.MANAGE_SUBJECTS])] }, createOrganizationController);
  app.get("/:id", { preHandler: [app.authenticate, requirePermission([Permission.VIEW_SUBJECTS])] }, getOrganizationController);
  app.put("/:id", { preHandler: [app.authenticate, requirePermission([Permission.MANAGE_SUBJECTS])] }, updateOrganizationController);
  app.delete("/:id", { preHandler: [app.authenticate, requirePermission([Permission.MANAGE_SUBJECTS])] }, deleteOrganizationController);
};
