import { Permission } from "@sadoj/shared";
import type { FastifyPluginAsync } from "fastify";
import { requirePermission } from "../../shared/middleware/rbac.middleware";
import {
  approveWarrantController,
  createWarrantReportController,
  createWarrantController,
  executeWarrantController,
  getWarrantReportController,
  getWarrantController,
  listWarrantsController,
  rejectWarrantController,
  uploadWarrantFileController
} from "./warrants.controller";

export const warrantsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", { preHandler: [app.authenticate, requirePermission([Permission.MANAGE_WARRANTS])] }, listWarrantsController);
  app.post("/", { preHandler: [app.authenticate, requirePermission([Permission.MANAGE_WARRANTS])] }, createWarrantController);
  app.get("/:id/report", { preHandler: [app.authenticate, requirePermission([Permission.MANAGE_WARRANTS])] }, getWarrantReportController);
  app.post("/:id/report", { preHandler: [app.authenticate, requirePermission([Permission.MANAGE_WARRANTS])] }, createWarrantReportController);
  app.get("/:id", { preHandler: [app.authenticate, requirePermission([Permission.MANAGE_WARRANTS])] }, getWarrantController);
  app.patch("/:id/approve", { preHandler: [app.authenticate, requirePermission([Permission.MANAGE_WARRANTS])] }, approveWarrantController);
  app.patch("/:id/reject", { preHandler: [app.authenticate, requirePermission([Permission.MANAGE_WARRANTS])] }, rejectWarrantController);
  app.patch("/:id/execute", { preHandler: [app.authenticate, requirePermission([Permission.MANAGE_WARRANTS])] }, executeWarrantController);
  app.post("/:id/files", { preHandler: [app.authenticate, requirePermission([Permission.UPLOAD_FILES])] }, uploadWarrantFileController);
};
