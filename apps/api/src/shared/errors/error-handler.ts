import type { FastifyError, FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { Prisma } from "../prisma";
import { AppError } from "./AppError";

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error: FastifyError, request, reply) => {
    request.log.error({ error }, "request failed");

    if (error instanceof AppError) {
      reply.status(error.statusCode).send({ error: true, code: error.code, message: error.message });
      return;
    }

    if (error instanceof ZodError) {
      reply.status(400).send({
        error: true,
        code: "VALIDATION_ERROR",
        message: "La solicitud contiene datos inválidos."
      });
      return;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        reply.status(409).send({ error: true, code: "UNIQUE_CONSTRAINT", message: "Ya existe un registro con esos datos." });
        return;
      }

      if (error.code === "P2025") {
        reply.status(404).send({ error: true, code: "NOT_FOUND", message: "No se encontró el registro solicitado." });
        return;
      }
    }

    reply.status(500).send({ error: true, code: "INTERNAL_ERROR", message: "Error interno del servidor." });
  });
}
