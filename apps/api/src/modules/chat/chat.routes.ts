import type { FastifyPluginAsync } from "fastify";
import { requireOperationalAccess } from "../../shared/middleware/rbac.middleware";
import { listChatMessagesController, sendChatMessageController } from "./chat.controller";

export const chatRoutes: FastifyPluginAsync = async (app) => {
  app.get("/:roomId/messages", { preHandler: [app.authenticate, requireOperationalAccess] }, listChatMessagesController);
  app.post("/:roomId/messages", { preHandler: [app.authenticate, requireOperationalAccess] }, sendChatMessageController);
};
