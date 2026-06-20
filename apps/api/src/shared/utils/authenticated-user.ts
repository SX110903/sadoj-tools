import type { FastifyRequest } from "fastify";
import { AppError } from "../errors/AppError";
import type { AuthenticatedUser } from "../../types/fastify";

export function getAuthenticatedUser(request: FastifyRequest): AuthenticatedUser {
  if (request.user === undefined) {
    throw new AppError(401, "UNAUTHENTICATED", "Debes iniciar sesión para acceder a este recurso.");
  }

  return request.user;
}

