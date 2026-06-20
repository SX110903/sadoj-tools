import type { FastifyPluginAsync } from "fastify";
import { loginController, logoutController, meController, refreshController } from "./auth.controller";

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post("/login", { config: { rateLimit: { max: 5, timeWindow: "15 minutes" } } }, loginController);
  app.post("/logout", { preHandler: [app.authenticate] }, logoutController);
  app.post("/refresh", refreshController);
  app.get("/me", { preHandler: [app.authenticate] }, meController);
};

