import { Permission } from "@sadoj/shared";
import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { requirePermission } from "../../shared/middleware/rbac.middleware";

const ZonesQuerySchema = z.object({});

export const zonesRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", { preHandler: [app.authenticate, requirePermission([Permission.VIEW_SUBJECTS])] }, async (request, reply) => {
    ZonesQuerySchema.parse(request.query);
    const zones = await request.server.prisma.zone.findMany({ orderBy: [{ district: "asc" }, { name: "asc" }] });
    reply.send({ error: false, data: zones });
  });
};
