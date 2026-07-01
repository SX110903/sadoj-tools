import type { FastifyPluginAsync } from "fastify";
import { requireOperationalAccess } from "../../shared/middleware/rbac.middleware";
import { globalSearchController } from "./search.controller";

export const searchRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", { preHandler: [app.authenticate, requireOperationalAccess] }, globalSearchController);
};
