import type { FastifyReply, FastifyRequest } from "fastify";
import { AdminAuditQuerySchema } from "./admin.schema";
import { AdminService } from "./admin.service";

export async function getAdminStatsController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const service = new AdminService(request.server.prisma);
  const stats = await service.getStats();

  reply.send({ error: false, data: stats });
}

export async function getAdminRolesController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const service = new AdminService(request.server.prisma);

  reply.send({ error: false, data: service.getRoles() });
}

export async function getAdminAuditController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const query = AdminAuditQuerySchema.parse(request.query);
  const service = new AdminService(request.server.prisma);
  const result = await service.getAuditLogs(query);

  reply.send({ error: false, data: result.data, meta: result.meta });
}
