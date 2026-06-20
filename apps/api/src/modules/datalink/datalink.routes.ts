import type { FastifyPluginAsync } from "fastify";
import { globalDatalinkController } from "./datalink.controller";

export const datalinkRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", { preHandler: [app.authenticate] }, globalDatalinkController);
};
