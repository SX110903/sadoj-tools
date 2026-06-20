import fp from "fastify-plugin";
import { authenticateRequest } from "../middleware/auth.middleware";

export const authPlugin = fp(async (app) => {
  app.decorate("authenticate", authenticateRequest);
});

