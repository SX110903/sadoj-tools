import type { FastifyPluginAsync } from "fastify";
import { globalSearchController } from "./search.controller";

export const searchRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", { preHandler: [app.authenticate] }, globalSearchController);
};
