import { Permission } from "@sadoj/shared";
import type { FastifyPluginAsync } from "fastify";
import { requirePermission } from "../../shared/middleware/rbac.middleware";
import {
  createExamController,
  deleteExamAssignmentController,
  deleteExamController,
  getExamForTakingController,
  listAvailableExamsController,
  listExamAssignmentsController,
  listExamsController,
  listMyExamResultsController,
  openExamAssignmentController,
  submitExamController,
  updateExamAssignmentController,
  updateExamController
} from "./exams.controller";

export const examsRoutes: FastifyPluginAsync = async (app) => {
  // Examinee side (own assignments)
  app.get("/available", { preHandler: [app.authenticate] }, listAvailableExamsController);
  app.get("/results/mine", { preHandler: [app.authenticate] }, listMyExamResultsController);
  app.get("/take/:assignmentId", { preHandler: [app.authenticate] }, getExamForTakingController);
  app.post("/take/:assignmentId", { preHandler: [app.authenticate] }, submitExamController);

  // Admin: assignments
  app.patch("/assignments/:aid", { preHandler: [app.authenticate, requirePermission([Permission.MANAGE_USERS])] }, updateExamAssignmentController);
  app.delete("/assignments/:aid", { preHandler: [app.authenticate, requirePermission([Permission.MANAGE_USERS])] }, deleteExamAssignmentController);

  // Admin: exam templates
  app.get("/", { preHandler: [app.authenticate, requirePermission([Permission.MANAGE_USERS])] }, listExamsController);
  app.post("/", { preHandler: [app.authenticate, requirePermission([Permission.MANAGE_USERS])] }, createExamController);
  app.get("/:id/assignments", { preHandler: [app.authenticate, requirePermission([Permission.MANAGE_USERS])] }, listExamAssignmentsController);
  app.post("/:id/assignments", { preHandler: [app.authenticate, requirePermission([Permission.MANAGE_USERS])] }, openExamAssignmentController);
  app.patch("/:id", { preHandler: [app.authenticate, requirePermission([Permission.MANAGE_USERS])] }, updateExamController);
  app.delete("/:id", { preHandler: [app.authenticate, requirePermission([Permission.MANAGE_USERS])] }, deleteExamController);
};
