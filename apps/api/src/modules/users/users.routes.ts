import { Permission } from "@sadoj/shared";
import type { FastifyPluginAsync } from "fastify";
import { createUserNoteController, listUserNotesController } from "../notes/notes.controller";
import { requirePermission } from "../../shared/middleware/rbac.middleware";
import {
  changeUserRoleController,
  createUserController,
  deactivateUserController,
  getUserController,
  listUsersController,
  mentionUsersController,
  updateUserController,
  updateUserAvatarController
} from "./users.controller";

export const usersRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", { preHandler: [app.authenticate, requirePermission([Permission.MANAGE_USERS])] }, listUsersController);
  app.get("/mentions", { preHandler: [app.authenticate] }, mentionUsersController);
  app.post("/", { preHandler: [app.authenticate, requirePermission([Permission.MANAGE_USERS])] }, createUserController);
  app.get("/:id", { preHandler: [app.authenticate] }, getUserController);
  app.put("/:id", { preHandler: [app.authenticate] }, updateUserController);
  app.delete("/:id", { preHandler: [app.authenticate, requirePermission([Permission.MANAGE_USERS])] }, deactivateUserController);
  app.patch("/:id/role", { preHandler: [app.authenticate, requirePermission([Permission.MANAGE_ROLES])] }, changeUserRoleController);
  app.patch("/:id/avatar", { preHandler: [app.authenticate] }, updateUserAvatarController);
  app.get("/:id/notes", { preHandler: [app.authenticate, requirePermission([Permission.VIEW_NOTES])] }, listUserNotesController);
  app.post("/:id/notes", { preHandler: [app.authenticate, requirePermission([Permission.ADD_NOTES])] }, createUserNoteController);
};
