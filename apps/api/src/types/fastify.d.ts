import type { FastifyReply, FastifyRequest } from "fastify";
import type Redis from "ioredis";
import type { Permission, RoleType } from "@sadoj/shared";
import type { PrismaClient } from "../shared/prisma";

export interface AuthenticatedUser {
  id: string;
  role: RoleType;
  tokenId: string;
  permissions: readonly Permission[];
}

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
    redis: Redis;
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }

  interface FastifyRequest {
    user?: AuthenticatedUser;
  }
}
