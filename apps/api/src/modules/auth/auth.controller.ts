import type { FastifyReply, FastifyRequest } from "fastify";
import { IS_PRODUCTION, REFRESH_TOKEN_TTL_SECONDS } from "../../config/env";
import { AuthService } from "./auth.service";
import { EmptySchema, LoginSchema, RefreshSchema } from "./auth.schema";
import { AppError } from "../../shared/errors/AppError";

const REFRESH_COOKIE_NAME = "refreshToken";

function setRefreshCookie(reply: FastifyReply, refreshToken: string): void {
  reply.setCookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    sameSite: "strict",
    secure: IS_PRODUCTION,
    path: "/api/auth",
    maxAge: REFRESH_TOKEN_TTL_SECONDS
  });
}

function clearRefreshCookie(reply: FastifyReply): void {
  reply.clearCookie(REFRESH_COOKIE_NAME, { path: "/api/auth" });
}

export async function loginController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    const input = LoginSchema.parse(request.body);
    const authService = new AuthService(request.server.prisma, request.server.redis);
    const result = await authService.login(input.username, input.password);

    setRefreshCookie(reply, result.refreshToken);
    reply.send({ error: false, data: { accessToken: result.accessToken, user: result.user }, message: "Inicio de sesión correcto." });
  } catch (error: unknown) {
    throw error;
  }
}

export async function logoutController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    EmptySchema.parse({});

    if (request.user === undefined) {
      throw new AppError(401, "UNAUTHENTICATED", "Debes iniciar sesión para cerrar la sesión.");
    }

    const authService = new AuthService(request.server.prisma, request.server.redis);
    const refreshToken = request.cookies[REFRESH_COOKIE_NAME];

    await authService.logout(request.user.id, request.user.tokenId, refreshToken);
    clearRefreshCookie(reply);
    reply.send({ error: false, data: { loggedOut: true }, message: "Sesión cerrada correctamente." });
  } catch (error: unknown) {
    throw error;
  }
}

export async function refreshController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    RefreshSchema.parse({});

    const refreshToken = request.cookies[REFRESH_COOKIE_NAME];

    if (refreshToken === undefined) {
      throw new AppError(401, "MISSING_REFRESH_TOKEN", "No se encontró la cookie de renovación.");
    }

    const authService = new AuthService(request.server.prisma, request.server.redis);
    const result = await authService.refresh(refreshToken);

    setRefreshCookie(reply, result.refreshToken);
    reply.send({ error: false, data: { accessToken: result.accessToken, user: result.user }, message: "Token renovado correctamente." });
  } catch (error: unknown) {
    throw error;
  }
}

export async function meController(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    EmptySchema.parse({});

    if (request.user === undefined) {
      throw new AppError(401, "UNAUTHENTICATED", "Debes iniciar sesión para acceder a este recurso.");
    }

    const authService = new AuthService(request.server.prisma, request.server.redis);
    const user = await authService.me(request.user.id);

    reply.send({ error: false, data: user });
  } catch (error: unknown) {
    throw error;
  }
}

