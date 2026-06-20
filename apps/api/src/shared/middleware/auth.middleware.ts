import type { FastifyReply, FastifyRequest } from "fastify";
import { ROLE_PERMISSIONS, type RoleType } from "@sadoj/shared";
import { AppError } from "../errors/AppError";
import { verifyAccessToken } from "../utils/tokens";

const BEARER_PREFIX = "Bearer ";

function readBearerToken(request: FastifyRequest): string {
  const header = request.headers.authorization;

  if (header === undefined || !header.startsWith(BEARER_PREFIX)) {
    throw new AppError(401, "MISSING_TOKEN", "Debes iniciar sesión para acceder a este recurso.");
  }

  return header.slice(BEARER_PREFIX.length);
}

export async function authenticateRequest(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  const token = readBearerToken(request);
  const payload = verifyAccessToken(token);
  const blacklistKey = `blacklist:access:${payload.tokenId}`;
  const isBlacklisted = await request.server.redis.exists(blacklistKey);

  if (isBlacklisted === 1) {
    throw new AppError(401, "TOKEN_REVOKED", "La sesión ya no es válida.");
  }

  const role = payload.role as RoleType;
  request.user = {
    id: payload.sub,
    role,
    tokenId: payload.tokenId,
    permissions: ROLE_PERMISSIONS[role]
  };
}

