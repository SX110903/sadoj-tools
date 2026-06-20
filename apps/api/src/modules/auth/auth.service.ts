import bcrypt from "bcryptjs";
import { ROLE_PERMISSIONS, type Permission, type RoleType } from "@sadoj/shared";
import type Redis from "ioredis";
import { ACCESS_TOKEN_TTL_SECONDS, REFRESH_TOKEN_TTL_SECONDS } from "../../config/env";
import { AppError } from "../../shared/errors/AppError";
import type { PrismaClient, User as PrismaUser } from "../../shared/prisma";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../shared/utils/tokens";

const REFRESH_TOKEN_PREFIX = "refresh";
const ACCESS_BLACKLIST_PREFIX = "blacklist:access";

export interface UserSafe {
  id: string;
  username: string;
  displayName: string;
  email: string | null;
  avatar: string | null;
  badgeNumber: string | null;
  division: string | null;
  bio: string | null;
  active: boolean;
  role: RoleType;
  permissions: readonly Permission[];
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: UserSafe;
}

export class AuthService {
  public constructor(
    private readonly prisma: PrismaClient,
    private readonly redis: Redis
  ) {}

  public async login(username: string, password: string): Promise<AuthResult> {
    try {
      const user = await this.prisma.user.findUnique({ where: { username } });

      if (user === null || !user.active) {
        throw new AppError(401, "INVALID_CREDENTIALS", "Usuario o contraseña incorrectos.");
      }

      const passwordMatches = await bcrypt.compare(password, user.password);

      if (!passwordMatches) {
        throw new AppError(401, "INVALID_CREDENTIALS", "Usuario o contraseña incorrectos.");
      }

      await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
      return this.createAuthResult(user);
    } catch (error: unknown) {
      throw error;
    }
  }

  public async logout(userId: string, accessTokenId: string, refreshToken: string | undefined): Promise<void> {
    try {
      if (refreshToken !== undefined) {
        const payload = verifyRefreshToken(refreshToken);
        await this.redis.del(this.refreshKey(payload.sub, payload.tokenId));
      }

      await this.redis.set(this.accessBlacklistKey(accessTokenId), userId, "EX", ACCESS_TOKEN_TTL_SECONDS);
    } catch (error: unknown) {
      throw error;
    }
  }

  public async refresh(refreshToken: string): Promise<AuthResult> {
    try {
      const payload = verifyRefreshToken(refreshToken);
      const refreshKey = this.refreshKey(payload.sub, payload.tokenId);
      const storedUserId = await this.redis.get(refreshKey);

      if (storedUserId !== payload.sub) {
        throw new AppError(401, "REFRESH_TOKEN_REVOKED", "La sesión ha expirado. Inicia sesión de nuevo.");
      }

      await this.redis.del(refreshKey);

      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });

      if (user === null || !user.active) {
        throw new AppError(401, "USER_INACTIVE", "La cuenta no está activa.");
      }

      return this.createAuthResult(user);
    } catch (error: unknown) {
      throw error;
    }
  }

  public async me(userId: string): Promise<UserSafe> {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });

      if (user === null || !user.active) {
        throw new AppError(404, "USER_NOT_FOUND", "No se encontró el usuario autenticado.");
      }

      return this.toUserSafe(user);
    } catch (error: unknown) {
      throw error;
    }
  }

  private async createAuthResult(user: PrismaUser): Promise<AuthResult> {
    const role = user.role as RoleType;
    const accessToken = signAccessToken(user.id, role);
    const refreshToken = signRefreshToken(user.id, role);

    await this.redis.set(this.refreshKey(user.id, refreshToken.tokenId), user.id, "EX", REFRESH_TOKEN_TTL_SECONDS);

    return {
      accessToken: accessToken.token,
      refreshToken: refreshToken.token,
      user: this.toUserSafe(user)
    };
  }

  private toUserSafe(user: PrismaUser): UserSafe {
    const role = user.role as RoleType;

    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      avatar: user.avatar,
      badgeNumber: user.badgeNumber,
      division: user.division,
      bio: user.bio,
      active: user.active,
      role,
      permissions: ROLE_PERMISSIONS[role],
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  private refreshKey(userId: string, tokenId: string): string {
    return `${REFRESH_TOKEN_PREFIX}:${userId}:${tokenId}`;
  }

  private accessBlacklistKey(tokenId: string): string {
    return `${ACCESS_BLACKLIST_PREFIX}:${tokenId}`;
  }
}
