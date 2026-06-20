import type { FastifyPluginAsync } from "fastify";
import { listChatMessagesController, sendChatMessageController } from "./chat.controller";

export const chatRoutes: FastifyPluginAsync = async (app) => {
  app.get("/:roomId/messages", { preHandler: [app.authenticate] }, listChatMessagesController);
  app.post("/:roomId/messages", { preHandler: [app.authenticate] }, sendChatMessageController);
};
