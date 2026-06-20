import type { FastifyPluginAsync } from "fastify";
import {
  deleteNotificationController,
  listNotificationsController,
  markAllNotificationsReadController,
  markNotificationReadController,
  unreadCountController
} from "./notifications.controller";

export const notificationsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", { preHandler: [app.authenticate] }, listNotificationsController);
  app.get("/unread-count", { preHandler: [app.authenticate] }, unreadCountController);
  app.patch("/read-all", { preHandler: [app.authenticate] }, markAllNotificationsReadController);
  app.patch("/:id/read", { preHandler: [app.authenticate] }, markNotificationReadController);
  app.delete("/:id", { preHandler: [app.authenticate] }, deleteNotificationController);
};
