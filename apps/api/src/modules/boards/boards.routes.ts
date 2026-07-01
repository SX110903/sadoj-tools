import { Permission } from "@sadoj/shared";
import type { FastifyPluginAsync } from "fastify";
import { requirePermission } from "../../shared/middleware/rbac.middleware";
import {
  batchUpdateBoardCardsController,
  createBoardCardController,
  createBoardConnectionController,
  createBoardStepController,
  createGlobalBoardController,
  deleteBoardCardController,
  deleteBoardConnectionController,
  deleteBoardStepController,
  deleteGlobalBoardController,
  getGlobalBoardController,
  getScopedBoardController,
  listBoardStepsController,
  listGlobalBoardsController,
  reorderBoardStepsController,
  updateBoardStepController,
  updateBoardCardController,
  updateBoardConnectionController,
  uploadBoardStepImageController
} from "./boards.controller";

export const boardsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/global", { preHandler: [app.authenticate] }, listGlobalBoardsController);
  app.post("/global", { preHandler: [app.authenticate] }, createGlobalBoardController);
  app.get("/global/:boardId", { preHandler: [app.authenticate] }, getGlobalBoardController);
  app.delete("/global/:boardId", { preHandler: [app.authenticate] }, deleteGlobalBoardController);
  app.get("/:scope/:id", { preHandler: [app.authenticate] }, getScopedBoardController);
  app.post("/:boardId/cards", { preHandler: [app.authenticate] }, createBoardCardController);
  app.patch("/:boardId/cards/positions", { preHandler: [app.authenticate] }, batchUpdateBoardCardsController);
  app.patch("/:boardId/cards/:cardId", { preHandler: [app.authenticate] }, updateBoardCardController);
  app.delete("/:boardId/cards/:cardId", { preHandler: [app.authenticate] }, deleteBoardCardController);
  app.get("/:boardId/steps", { preHandler: [app.authenticate] }, listBoardStepsController);
  app.post("/:boardId/steps", { preHandler: [app.authenticate] }, createBoardStepController);
  app.patch("/:boardId/steps/reorder", { preHandler: [app.authenticate] }, reorderBoardStepsController);
  app.patch("/:boardId/steps/:stepId", { preHandler: [app.authenticate] }, updateBoardStepController);
  app.delete("/:boardId/steps/:stepId", { preHandler: [app.authenticate] }, deleteBoardStepController);
  app.post(
    "/:boardId/steps/:stepId/image",
    { preHandler: [app.authenticate, requirePermission([Permission.UPLOAD_FILES])] },
    uploadBoardStepImageController
  );
  app.post("/:boardId/connections", { preHandler: [app.authenticate] }, createBoardConnectionController);
  app.patch("/:boardId/connections/:connectionId", { preHandler: [app.authenticate] }, updateBoardConnectionController);
  app.delete("/:boardId/connections/:connectionId", { preHandler: [app.authenticate] }, deleteBoardConnectionController);
};
