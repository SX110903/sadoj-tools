import { Permission } from "@sadoj/shared";
import type { FastifyPluginAsync } from "fastify";
import { requirePermission } from "../../shared/middleware/rbac.middleware";
import {
  createSanctionController,
  getSanctionController,
  listEligibleSanctionUsersController,
  listSanctionsController,
  listUserSanctionsController,
  resolveSanctionController
} from "./sanctions.controller";

export const sanctionsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", { preHandler: [app.authenticate, requirePermission([Permission.MANAGE_SANCTIONS])] }, listSanctionsController);
  app.post("/", { preHandler: [app.authenticate, requirePermission([Permission.MANAGE_SANCTIONS])] }, createSanctionController);
  app.get("/eligible-users", { preHandler: [app.authenticate, requirePermission([Permission.MANAGE_SANCTIONS])] }, listEligibleSanctionUsersController);
  app.get("/by-user/:userId", { preHandler: [app.authenticate] }, listUserSanctionsController);
  app.get("/:id", { preHandler: [app.authenticate, requirePermission([Permission.MANAGE_SANCTIONS])] }, getSanctionController);
  app.patch("/:id/resolve", { preHandler: [app.authenticate, requirePermission([Permission.MANAGE_SANCTIONS])] }, resolveSanctionController);
};
