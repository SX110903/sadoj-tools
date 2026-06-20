import type { FastifyReply, FastifyRequest } from "fastify";
import { getAuthenticatedUser } from "../../shared/utils/authenticated-user";
import { DashboardQuerySchema } from "./dashboard.schema";
import { DashboardService } from "./dashboard.service";

export async function dashboardStatsController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  DashboardQuerySchema.parse(request.query);
  const requester = getAuthenticatedUser(request);
  const service = new DashboardService(request.server.prisma);
  const stats = await service.stats(requester);

  reply.send({ error: false, data: stats });
}
