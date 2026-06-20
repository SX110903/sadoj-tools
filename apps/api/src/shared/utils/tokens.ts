import { randomUUID } from "node:crypto";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { type RoleType } from "@sadoj/shared";
import { ACCESS_TOKEN_TTL_SECONDS, env, REFRESH_TOKEN_TTL_SECONDS } from "../../config/env";
import { AppError } from "../errors/AppError";

export type TokenType = "access" | "refresh";

export interface AuthTokenPayload extends JwtPayload {
  sub: string;
  role: RoleType;
  tokenId: string;
  type: TokenType;
}

export interface SignedToken {
  token: string;
  tokenId: string;
}

function isAuthTokenPayload(value: string | JwtPayload, type: TokenType): value is AuthTokenPayload {
  return typeof value !== "string" && typeof value.sub === "string" && typeof value.tokenId === "string" && value.type === type;
}

export function signAccessToken(userId: string, role: RoleType): SignedToken {
  const tokenId = randomUUID();
  const token = jwt.sign({ sub: userId, role, tokenId, type: "access" }, env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL_SECONDS });
  return { token, tokenId };
}

export function signRefreshToken(userId: string, role: RoleType): SignedToken {
  const tokenId = randomUUID();
  const token = jwt.sign({ sub: userId, role, tokenId, type: "refresh" }, env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_TTL_SECONDS });
  return { token, tokenId };
}

export function verifyAccessToken(token: string): AuthTokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);

  if (!isAuthTokenPayload(decoded, "access")) {
    throw new AppError(401, "INVALID_TOKEN", "El token de acceso no es válido.");
  }

  return decoded;
}

export function verifyRefreshToken(token: string): AuthTokenPayload {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);

  if (!isAuthTokenPayload(decoded, "refresh")) {
    throw new AppError(401, "INVALID_REFRESH_TOKEN", "El token de renovación no es válido.");
  }

  return decoded;
}

