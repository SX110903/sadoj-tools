import type { FastifyPluginAsync } from "fastify";
import { dashboardStatsController } from "./dashboard.controller";

export const dashboardRoutes: FastifyPluginAsync = async (app) => {
  app.get("/stats", { preHandler: [app.authenticate] }, dashboardStatsController);
};
