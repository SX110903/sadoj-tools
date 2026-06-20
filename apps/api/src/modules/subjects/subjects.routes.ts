import { Permission } from "@sadoj/shared";
import type { FastifyPluginAsync } from "fastify";
import { createSubjectNoteController, listSubjectNotesController } from "../notes/notes.controller";
import { requirePermission } from "../../shared/middleware/rbac.middleware";
import {
  addSubjectRelationshipController,
  assignSubjectZoneController,
  createSubjectController,
  deleteSubjectController,
  getSubjectController,
  getSubjectTimelineController,
  linkSubjectPropertyController,
  linkSubjectVehicleController,
  listSubjectsController,
  removeSubjectRelationshipController,
  removeSubjectZoneController,
  unlinkSubjectPropertyController,
  unlinkSubjectVehicleController,
  updateSubjectController,
  updateSubjectPhotoController
} from "./subjects.controller";

export const subjectsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", { preHandler: [app.authenticate, requirePermission([Permission.VIEW_SUBJECTS])] }, listSubjectsController);
  app.post("/", { preHandler: [app.authenticate, requirePermission([Permission.MANAGE_SUBJECTS])] }, createSubjectController);
  app.get("/:id/timeline", { preHandler: [app.authenticate, requirePermission([Permission.VIEW_SUBJECTS])] }, getSubjectTimelineController);
  app.get("/:id", { preHandler: [app.authenticate, requirePermission([Permission.VIEW_SUBJECTS])] }, getSubjectController);
  app.put("/:id", { preHandler: [app.authenticate, requirePermission([Permission.MANAGE_SUBJECTS])] }, updateSubjectController);
  app.delete("/:id", { preHandler: [app.authenticate, requirePermission([Permission.MANAGE_SUBJECTS])] }, deleteSubjectController);
  app.patch("/:id/photo", { preHandler: [app.authenticate, requirePermission([Permission.MANAGE_SUBJECTS])] }, updateSubjectPhotoController);
  app.post("/:id/vehicles", { preHandler: [app.authenticate, requirePermission([Permission.MANAGE_SUBJECTS])] }, linkSubjectVehicleController);
  app.delete("/:id/vehicles/:vehicleId", { preHandler: [app.authenticate, requirePermission([Permission.MANAGE_SUBJECTS])] }, unlinkSubjectVehicleController);
  app.post("/:id/properties", { preHandler: [app.authenticate, requirePermission([Permission.MANAGE_SUBJECTS])] }, linkSubjectPropertyController);
  app.delete("/:id/properties/:propertyId", { preHandler: [app.authenticate, requirePermission([Permission.MANAGE_SUBJECTS])] }, unlinkSubjectPropertyController);
  app.post("/:id/relationships", { preHandler: [app.authenticate, requirePermission([Permission.MANAGE_SUBJECTS])] }, addSubjectRelationshipController);
  app.delete("/:id/relationships/:relationshipId", { preHandler: [app.authenticate, requirePermission([Permission.MANAGE_SUBJECTS])] }, removeSubjectRelationshipController);
  app.post("/:id/zones", { preHandler: [app.authenticate, requirePermission([Permission.MANAGE_SUBJECTS])] }, assignSubjectZoneController);
  app.delete("/:id/zones/:zoneId", { preHandler: [app.authenticate, requirePermission([Permission.MANAGE_SUBJECTS])] }, removeSubjectZoneController);
  app.get("/:id/notes", { preHandler: [app.authenticate, requirePermission([Permission.VIEW_NOTES])] }, listSubjectNotesController);
  app.post("/:id/notes", { preHandler: [app.authenticate, requirePermission([Permission.ADD_NOTES])] }, createSubjectNoteController);
};
