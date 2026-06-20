import { Permission } from "@sadoj/shared";
import type { FastifyPluginAsync } from "fastify";
import { requirePermission } from "../../shared/middleware/rbac.middleware";
import { createVehicleController, deleteVehicleController, getVehicleController, listVehiclesController, updateVehicleController } from "./vehicles.controller";

export const vehiclesRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", { preHandler: [app.authenticate, requirePermission([Permission.VIEW_SUBJECTS])] }, listVehiclesController);
  app.post("/", { preHandler: [app.authenticate, requirePermission([Permission.MANAGE_SUBJECTS])] }, createVehicleController);
  app.get("/:id", { preHandler: [app.authenticate, requirePermission([Permission.VIEW_SUBJECTS])] }, getVehicleController);
  app.put("/:id", { preHandler: [app.authenticate, requirePermission([Permission.MANAGE_SUBJECTS])] }, updateVehicleController);
  app.delete("/:id", { preHandler: [app.authenticate, requirePermission([Permission.MANAGE_SUBJECTS])] }, deleteVehicleController);
};

