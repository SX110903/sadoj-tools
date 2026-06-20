import { Permission } from "@sadoj/shared";
import type { FastifyPluginAsync } from "fastify";
import { requirePermission } from "../../shared/middleware/rbac.middleware";
import {
  createMapDrawingController,
  createMapElementController,
  deleteMapDrawingController,
  deleteMapElementController,
  getInvestigationMapController,
  linkMapElementSubjectController,
  listMapElementsController,
  listMapPropertiesController,
  listMapZonesController,
  unlinkMapElementSubjectController,
  updateMapDrawingController,
  updateMapElementController
} from "./map.controller";

export const mapRoutes: FastifyPluginAsync = async (app) => {
  app.get("/properties", { preHandler: [app.authenticate, requirePermission([Permission.VIEW_SUBJECTS])] }, listMapPropertiesController);
  app.get("/zones", { preHandler: [app.authenticate, requirePermission([Permission.VIEW_SUBJECTS])] }, listMapZonesController);
  app.get("/elements", { preHandler: [app.authenticate, requirePermission([Permission.VIEW_SUBJECTS])] }, listMapElementsController);
  app.post("/elements", { preHandler: [app.authenticate, requirePermission([Permission.MANAGE_SUBJECTS])] }, createMapElementController);
  app.put("/elements/:id", { preHandler: [app.authenticate, requirePermission([Permission.MANAGE_SUBJECTS])] }, updateMapElementController);
  app.delete("/elements/:id", { preHandler: [app.authenticate, requirePermission([Permission.MANAGE_SUBJECTS])] }, deleteMapElementController);
  app.post("/elements/:id/subjects", { preHandler: [app.authenticate, requirePermission([Permission.MANAGE_SUBJECTS])] }, linkMapElementSubjectController);
  app.delete("/elements/:id/subjects/:subjectId", { preHandler: [app.authenticate, requirePermission([Permission.MANAGE_SUBJECTS])] }, unlinkMapElementSubjectController);
  app.get("/investigation/:investigationId", { preHandler: [app.authenticate] }, getInvestigationMapController);
  app.post("/drawings", { preHandler: [app.authenticate, requirePermission([Permission.EDIT_INVESTIGATION])] }, createMapDrawingController);
  app.put("/drawings/:id", { preHandler: [app.authenticate, requirePermission([Permission.EDIT_INVESTIGATION])] }, updateMapDrawingController);
  app.delete("/drawings/:id", { preHandler: [app.authenticate, requirePermission([Permission.EDIT_INVESTIGATION])] }, deleteMapDrawingController);
};
