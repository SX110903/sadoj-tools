import { Permission } from "@sadoj/shared";
import type { FastifyPluginAsync } from "fastify";
import {
  awardUserDecorationController,
  listUserDecorationsController,
  revokeUserDecorationController
} from "../decorations/decorations.controller";
import { listUserExamResultsController } from "../exams/exams.controller";
import { createUserNoteController, listUserNotesController } from "../notes/notes.controller";
import { requireOperationalAccess, requirePermission } from "../../shared/middleware/rbac.middleware";
import {
  changeUserRoleController,
  createUserController,
  deactivateUserController,
  getUserController,
  listUserInvestigationsController,
  listUsersController,
  mentionUsersController,
  updateUserController,
  updateUserAvatarController
} from "./users.controller";

export const usersRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", { preHandler: [app.authenticate, requirePermission([Permission.MANAGE_USERS])] }, listUsersController);
  app.get("/mentions", { preHandler: [app.authenticate, requireOperationalAccess] }, mentionUsersController);
  app.post("/", { preHandler: [app.authenticate, requirePermission([Permission.MANAGE_USERS])] }, createUserController);
  app.get("/:id", { preHandler: [app.authenticate] }, getUserController);
  app.put("/:id", { preHandler: [app.authenticate] }, updateUserController);
  app.delete("/:id", { preHandler: [app.authenticate, requirePermission([Permission.MANAGE_USERS])] }, deactivateUserController);
  app.patch("/:id/role", { preHandler: [app.authenticate, requirePermission([Permission.MANAGE_ROLES])] }, changeUserRoleController);
  app.patch("/:id/avatar", { preHandler: [app.authenticate] }, updateUserAvatarController);
  app.get("/:id/notes", { preHandler: [app.authenticate, requirePermission([Permission.VIEW_NOTES])] }, listUserNotesController);
  app.post("/:id/notes", { preHandler: [app.authenticate, requirePermission([Permission.ADD_NOTES])] }, createUserNoteController);
  app.get("/:id/investigations", { preHandler: [app.authenticate] }, listUserInvestigationsController);
  app.get("/:id/exam-results", { preHandler: [app.authenticate] }, listUserExamResultsController);
  app.get("/:id/decorations", { preHandler: [app.authenticate] }, listUserDecorationsController);
  app.post("/:id/decorations", { preHandler: [app.authenticate, requirePermission([Permission.MANAGE_USERS])] }, awardUserDecorationController);
  app.delete("/:id/decorations/:awardId", { preHandler: [app.authenticate, requirePermission([Permission.MANAGE_USERS])] }, revokeUserDecorationController);
};
