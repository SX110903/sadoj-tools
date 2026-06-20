import type { FastifyReply, FastifyRequest } from "fastify";
import { DatalinkQuerySchema } from "./datalink.schema";
import { DatalinkService } from "./datalink.service";

export async function globalDatalinkController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const query = DatalinkQuerySchema.parse(request.query);
  const service = new DatalinkService(request.server.prisma);
  const graph = await service.getGlobalGraph(query);

  reply.send({ error: false, data: graph });
}
