import { Permission } from "@sadoj/shared";
import type { FastifyPluginAsync } from "fastify";
import { createInvestigationNoteController, listInvestigationNotesController } from "../notes/notes.controller";
import { requireOperationalAccess, requirePermission } from "../../shared/middleware/rbac.middleware";
import {
  changeInvestigationStatusController,
  closeInvestigationController,
  createInvestigationController,
  getInvestigationDatalinkController,
  getInvestigationController,
  getInvestigationTimelineController,
  linkInvestigationSubjectController,
  listInvestigationParticipantsController,
  listInvestigationsController,
  listInvestigationSubjectsController,
  revokeInvestigationAccessController,
  shareInvestigationController,
  unlinkInvestigationSubjectController,
  updateInvestigationController
} from "./investigations.controller";

export const investigationsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", { preHandler: [app.authenticate, requireOperationalAccess] }, listInvestigationsController);
  app.post("/", { preHandler: [app.authenticate, requirePermission([Permission.CREATE_INVESTIGATION])] }, createInvestigationController);
  app.get("/:id/datalink", { preHandler: [app.authenticate, requireOperationalAccess] }, getInvestigationDatalinkController);
  app.get("/:id/timeline", { preHandler: [app.authenticate, requireOperationalAccess] }, getInvestigationTimelineController);
  app.get("/:id", { preHandler: [app.authenticate, requireOperationalAccess] }, getInvestigationController);
  app.put("/:id", { preHandler: [app.authenticate, requirePermission([Permission.EDIT_INVESTIGATION])] }, updateInvestigationController);
  app.delete("/:id", { preHandler: [app.authenticate, requirePermission([Permission.DELETE_INVESTIGATION])] }, closeInvestigationController);
  app.patch("/:id/status", { preHandler: [app.authenticate, requirePermission([Permission.EDIT_INVESTIGATION])] }, changeInvestigationStatusController);
  app.post("/:id/share", { preHandler: [app.authenticate, requirePermission([Permission.SHARE_INVESTIGATION])] }, shareInvestigationController);
  app.delete("/:id/participants/:userId", { preHandler: [app.authenticate, requirePermission([Permission.SHARE_INVESTIGATION])] }, revokeInvestigationAccessController);
  app.get("/:id/participants", { preHandler: [app.authenticate, requireOperationalAccess] }, listInvestigationParticipantsController);
  app.get("/:id/subjects", { preHandler: [app.authenticate, requireOperationalAccess] }, listInvestigationSubjectsController);
  app.post("/:id/subjects", { preHandler: [app.authenticate, requirePermission([Permission.EDIT_INVESTIGATION])] }, linkInvestigationSubjectController);
  app.delete("/:id/subjects/:subjectId", { preHandler: [app.authenticate, requirePermission([Permission.EDIT_INVESTIGATION])] }, unlinkInvestigationSubjectController);
  app.get("/:id/notes", { preHandler: [app.authenticate, requirePermission([Permission.VIEW_NOTES])] }, listInvestigationNotesController);
  app.post("/:id/notes", { preHandler: [app.authenticate, requirePermission([Permission.ADD_NOTES])] }, createInvestigationNoteController);
};
