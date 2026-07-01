import type { FastifyPluginAsync } from "fastify";
import { requireOperationalAccess } from "../../shared/middleware/rbac.middleware";
import { dashboardStatsController } from "./dashboard.controller";

export const dashboardRoutes: FastifyPluginAsync = async (app) => {
  app.get("/stats", { preHandler: [app.authenticate, requireOperationalAccess] }, dashboardStatsController);
};
