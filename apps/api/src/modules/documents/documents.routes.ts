import { Permission } from "@sadoj/shared";
import type { FastifyPluginAsync } from "fastify";
import { requirePermission } from "../../shared/middleware/rbac.middleware";
import {
  createDocumentController,
  deleteDocumentController,
  getDocumentController,
  listDocumentsController,
  signDocumentController,
  updateDocumentController,
  updateDocumentStatusController
} from "./documents.controller";

export const documentsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", { preHandler: [app.authenticate, requirePermission([Permission.VIEW_SUBJECTS])] }, listDocumentsController);
  app.post("/", { preHandler: [app.authenticate, requirePermission([Permission.VIEW_SUBJECTS])] }, createDocumentController);
  app.get("/:id", { preHandler: [app.authenticate, requirePermission([Permission.VIEW_SUBJECTS])] }, getDocumentController);
  app.put("/:id", { preHandler: [app.authenticate, requirePermission([Permission.VIEW_SUBJECTS])] }, updateDocumentController);
  app.patch("/:id", { preHandler: [app.authenticate, requirePermission([Permission.VIEW_SUBJECTS])] }, updateDocumentController);
  app.patch("/:id/status", { preHandler: [app.authenticate, requirePermission([Permission.VIEW_SUBJECTS])] }, updateDocumentStatusController);
  app.patch("/:id/sign", { preHandler: [app.authenticate, requirePermission([Permission.VIEW_SUBJECTS])] }, signDocumentController);
  app.delete("/:id", { preHandler: [app.authenticate, requirePermission([Permission.VIEW_SUBJECTS])] }, deleteDocumentController);
};
