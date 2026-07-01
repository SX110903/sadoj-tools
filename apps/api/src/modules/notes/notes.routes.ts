import type { FastifyPluginAsync } from "fastify";
import { requireOperationalAccess } from "../../shared/middleware/rbac.middleware";
import { deleteNoteController, getNoteController, pinNoteController, updateNoteController } from "./notes.controller";

export const notesRoutes: FastifyPluginAsync = async (app) => {
  app.get("/:id", { preHandler: [app.authenticate, requireOperationalAccess] }, getNoteController);
  app.put("/:id", { preHandler: [app.authenticate, requireOperationalAccess] }, updateNoteController);
  app.delete("/:id", { preHandler: [app.authenticate, requireOperationalAccess] }, deleteNoteController);
  app.patch("/:id/pin", { preHandler: [app.authenticate, requireOperationalAccess] }, pinNoteController);
};
