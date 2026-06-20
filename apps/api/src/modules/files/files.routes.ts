import { Permission } from "@sadoj/shared";
import type { FastifyPluginAsync } from "fastify";
import { requirePermission } from "../../shared/middleware/rbac.middleware";
import { deleteFileController, downloadFileController, listFilesController, uploadFileController } from "./files.controller";

export const filesRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", { preHandler: [app.authenticate] }, listFilesController);
  app.post("/upload", { preHandler: [app.authenticate, requirePermission([Permission.UPLOAD_FILES])] }, uploadFileController);
  app.delete("/:id", { preHandler: [app.authenticate] }, deleteFileController);
  app.get("/:id/download", { preHandler: [app.authenticate] }, downloadFileController);
};
