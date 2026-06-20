import type { FastifyReply, FastifyRequest } from "fastify";
import { getAuthenticatedUser } from "../../shared/utils/authenticated-user";
import { SearchQuerySchema } from "./search.schema";
import { SearchService } from "./search.service";

export async function globalSearchController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const query = SearchQuerySchema.parse(request.query);
  const requester = getAuthenticatedUser(request);
  const service = new SearchService(request.server.prisma);
  const results = await service.search(requester, query);

  reply.send({ error: false, data: results });
}
