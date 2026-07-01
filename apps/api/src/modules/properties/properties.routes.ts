import { Permission } from "@sadoj/shared";
import type { FastifyPluginAsync } from "fastify";
import { requireOperationalAccess, requirePermission } from "../../shared/middleware/rbac.middleware";
import {
  createPropertyController,
  createPropertyIncidentController,
  deletePropertyIncidentController,
  deletePropertyMemberController,
  deletePropertyController,
  getPropertyDossierController,
  getPropertyController,
  getPropertyHistoryController,
  getPropertyTimelineController,
  listPropertiesController,
  listPropertyMembersController,
  updatePropertyIncidentController,
  updatePropertyMemberController,
  upsertPropertyMemberController,
  updatePropertyController
} from "./properties.controller";

export const propertiesRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", { preHandler: [app.authenticate, requirePermission([Permission.VIEW_SUBJECTS])] }, listPropertiesController);
  app.post("/", { preHandler: [app.authenticate, requirePermission([Permission.MANAGE_SUBJECTS])] }, createPropertyController);
  app.get("/:id/dossier", { preHandler: [app.authenticate, requireOperationalAccess] }, getPropertyDossierController);
  app.get("/:id/history", { preHandler: [app.authenticate, requirePermission([Permission.VIEW_SUBJECTS])] }, getPropertyHistoryController);
  app.get("/:id/timeline", { preHandler: [app.authenticate, requirePermission([Permission.VIEW_SUBJECTS])] }, getPropertyTimelineController);
  app.post("/:id/incidents", { preHandler: [app.authenticate, requireOperationalAccess] }, createPropertyIncidentController);
  app.put("/:id/incidents/:incidentId", { preHandler: [app.authenticate, requireOperationalAccess] }, updatePropertyIncidentController);
  app.delete("/:id/incidents/:incidentId", { preHandler: [app.authenticate, requireOperationalAccess] }, deletePropertyIncidentController);
  app.get("/:id/members", { preHandler: [app.authenticate, requireOperationalAccess] }, listPropertyMembersController);
  app.post("/:id/members", { preHandler: [app.authenticate, requireOperationalAccess] }, upsertPropertyMemberController);
  app.patch("/:id/members/:userId", { preHandler: [app.authenticate, requireOperationalAccess] }, updatePropertyMemberController);
  app.delete("/:id/members/:userId", { preHandler: [app.authenticate, requireOperationalAccess] }, deletePropertyMemberController);
  app.get("/:id", { preHandler: [app.authenticate, requirePermission([Permission.VIEW_SUBJECTS])] }, getPropertyController);
  app.put("/:id", { preHandler: [app.authenticate, requirePermission([Permission.MANAGE_SUBJECTS])] }, updatePropertyController);
  app.delete("/:id", { preHandler: [app.authenticate, requirePermission([Permission.MANAGE_SUBJECTS])] }, deletePropertyController);
};
