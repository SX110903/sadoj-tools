import type { FastifyPluginAsync } from "fastify";
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
  app.get("/", { preHandler: [app.authenticate] }, listDocumentsController);
  app.post("/", { preHandler: [app.authenticate] }, createDocumentController);
  app.get("/:id", { preHandler: [app.authenticate] }, getDocumentController);
  app.put("/:id", { preHandler: [app.authenticate] }, updateDocumentController);
  app.patch("/:id", { preHandler: [app.authenticate] }, updateDocumentController);
  app.patch("/:id/status", { preHandler: [app.authenticate] }, updateDocumentStatusController);
  app.patch("/:id/sign", { preHandler: [app.authenticate] }, signDocumentController);
  app.delete("/:id", { preHandler: [app.authenticate] }, deleteDocumentController);
};
