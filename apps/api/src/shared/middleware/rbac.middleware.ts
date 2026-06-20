import type { FastifyReply, FastifyRequest } from "fastify";
import { hasPermission, type Permission } from "@sadoj/shared";
import { AppError } from "../errors/AppError";

export function requirePermission(requiredPermissions: readonly Permission[]) {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    const authenticatedUser = request.user;

    if (authenticatedUser === undefined) {
      throw new AppError(401, "UNAUTHENTICATED", "Debes iniciar sesión para acceder a este recurso.");
    }

    const isAllowed = requiredPermissions.every((permission) => hasPermission(authenticatedUser.role, permission));

    if (!isAllowed) {
      throw new AppError(403, "FORBIDDEN", "No tienes permisos para realizar esta acción.");
    }
  };
}
