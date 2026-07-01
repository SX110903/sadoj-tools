import { Permission } from "@sadoj/shared";
import type { FastifyPluginAsync } from "fastify";
import { requirePermission } from "../../shared/middleware/rbac.middleware";
import {
  createAcademyClassController,
  createAcademyContentController,
  deleteAcademyContentController,
  getAcademyContentController,
  getClassAttendanceController,
  getMyAcademyRecordController,
  getMyAttendanceController,
  getUserAcademyRecordController,
  listAcademyClassesController,
  listAcademyContentController,
  markClassAttendanceController,
  updateAcademyClassController,
  updateAcademyContentController
} from "./academy.controller";

export const academyRoutes: FastifyPluginAsync = async (app) => {
  const viewAcademy = [app.authenticate, requirePermission([Permission.VIEW_ACADEMY])];
  const publishAcademy = [app.authenticate, requirePermission([Permission.PUBLISH_ACADEMY])];
  const manageAcademy = [app.authenticate, requirePermission([Permission.MANAGE_ACADEMY])];

  app.get("/content", { preHandler: viewAcademy }, listAcademyContentController);
  app.get("/content/:id", { preHandler: viewAcademy }, getAcademyContentController);
  app.post("/content", { preHandler: publishAcademy }, createAcademyContentController);
  app.patch("/content/:id", { preHandler: publishAcademy }, updateAcademyContentController);
  app.delete("/content/:id", { preHandler: publishAcademy }, deleteAcademyContentController);
  app.get("/classes", { preHandler: viewAcademy }, listAcademyClassesController);
  app.post("/classes", { preHandler: manageAcademy }, createAcademyClassController);
  app.patch("/classes/:id", { preHandler: manageAcademy }, updateAcademyClassController);
  app.get("/classes/:id/attendance", { preHandler: manageAcademy }, getClassAttendanceController);
  app.post("/classes/:id/attendance", { preHandler: manageAcademy }, markClassAttendanceController);
  app.get("/attendance/mine", { preHandler: viewAcademy }, getMyAttendanceController);
  app.get("/record/mine", { preHandler: viewAcademy }, getMyAcademyRecordController);
};

export const academyUserRecordRoutes: FastifyPluginAsync = async (app) => {
  app.get("/:id/academy-record", { preHandler: [app.authenticate] }, getUserAcademyRecordController);
};
