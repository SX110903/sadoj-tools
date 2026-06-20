import type { FastifyPluginAsync } from "fastify";
import { deleteNoteController, getNoteController, pinNoteController, updateNoteController } from "./notes.controller";

export const notesRoutes: FastifyPluginAsync = async (app) => {
  app.get("/:id", { preHandler: [app.authenticate] }, getNoteController);
  app.put("/:id", { preHandler: [app.authenticate] }, updateNoteController);
  app.delete("/:id", { preHandler: [app.authenticate] }, deleteNoteController);
  app.patch("/:id/pin", { preHandler: [app.authenticate] }, pinNoteController);
};
