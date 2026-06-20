import { Permission } from "@sadoj/shared";
import type { FastifyPluginAsync } from "fastify";
import { requirePermission } from "../../shared/middleware/rbac.middleware";
import { getAdminAuditController, getAdminRolesController, getAdminStatsController } from "./admin.controller";

export const adminRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", { preHandler: [app.authenticate, requirePermission([Permission.SYSTEM_CONFIG])] }, getAdminStatsController);
  app.get("/stats", { preHandler: [app.authenticate, requirePermission([Permission.SYSTEM_CONFIG])] }, getAdminStatsController);
  app.get("/roles", { preHandler: [app.authenticate, requirePermission([Permission.MANAGE_ROLES])] }, getAdminRolesController);
  app.get("/audit", { preHandler: [app.authenticate, requirePermission([Permission.VIEW_AUDIT_LOG])] }, getAdminAuditController);
};
