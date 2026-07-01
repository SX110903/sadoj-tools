import { Permission } from "@sadoj/shared";
import type { FastifyPluginAsync } from "fastify";
import { requirePermission } from "../../shared/middleware/rbac.middleware";
import {
  approveCandidateController,
  createCandidateController,
  createInterviewController,
  deleteCandidateController,
  getCandidateController,
  listCandidatesController,
  rejectCandidateController,
  updateCandidateController,
  updateInterviewController
} from "./hr.controller";

export const hrRoutes: FastifyPluginAsync = async (app) => {
  const manageHr = [app.authenticate, requirePermission([Permission.MANAGE_HR])];

  app.get("/", { preHandler: manageHr }, listCandidatesController);
  app.post("/", { preHandler: manageHr }, createCandidateController);
  app.get("/:id", { preHandler: manageHr }, getCandidateController);
  app.patch("/:id", { preHandler: manageHr }, updateCandidateController);
  app.delete("/:id", { preHandler: manageHr }, deleteCandidateController);
  app.post("/:id/interview", { preHandler: manageHr }, createInterviewController);
  app.patch("/:id/interview", { preHandler: manageHr }, updateInterviewController);
  app.post("/:id/approve", { preHandler: manageHr }, approveCandidateController);
  app.post("/:id/reject", { preHandler: manageHr }, rejectCandidateController);
};
