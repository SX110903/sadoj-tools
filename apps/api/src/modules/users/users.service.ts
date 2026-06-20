import bcrypt from "bcryptjs";
import { hasPermission, Permission, ROLE_PERMISSIONS, RoleType } from "@sadoj/shared";
import { AppError } from "../../shared/errors/AppError";
import { Prisma, type PrismaClient, type RoleType as PrismaRoleType, type User as PrismaUser } from "../../shared/prisma";
import { buildPaginationMeta, getPagination, type PaginationMeta } from "../../shared/utils/pagination";
import { isRoleAbove } from "../../shared/utils/role";
import type { AuthenticatedUser } from "../../types/fastify";
import type { CreateUserInput, MentionUsersQueryInput, UpdateUserInput, UsersQueryInput } from "./users.schema";

const BCRYPT_ROUNDS = 12;

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

export interface PaginatedUsers {
  data: UserSafe[];
  meta: PaginationMeta;
}

export class UsersService {
  public constructor(private readonly prisma: PrismaClient) {}

  public async findAll(query: UsersQueryInput): Promise<PaginatedUsers> {
    const pagination = getPagination(query);
    const where: Prisma.UserWhereInput = {};

    if (query.role !== undefined) {
      where.role = query.role as PrismaRoleType;
    }

    if (query.active !== undefined) {
      where.active = query.active;
    }

    if (query.search !== undefined) {
      where.OR = [
        { username: { contains: query.search, mode: "insensitive" } },
        { displayName: { contains: query.search, mode: "insensitive" } },
        { badgeNumber: { contains: query.search, mode: "insensitive" } },
        { division: { contains: query.search, mode: "insensitive" } }
      ];
    }

    const [total, users] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: "desc" }
      })
    ]);

    return {
      data: users.map((user) => this.toUserSafe(user)),
      meta: buildPaginationMeta(total, pagination.page, pagination.limit)
    };
  }

  public async findMentionCandidates(query: MentionUsersQueryInput): Promise<Array<Pick<UserSafe, "id" | "displayName" | "role" | "avatar">>> {
    const users = await this.prisma.user.findMany({
      where: {
        active: true,
        ...(query.search === undefined
          ? {}
          : {
              OR: [
                { displayName: { contains: query.search, mode: "insensitive" } },
                { username: { contains: query.search, mode: "insensitive" } },
                { badgeNumber: { contains: query.search, mode: "insensitive" } }
              ]
            })
      },
      take: query.limit,
      orderBy: { displayName: "asc" },
      select: { id: true, displayName: true, role: true, avatar: true }
    });

    return users.map((user) => ({ ...user, role: user.role as RoleType }));
  }

  public async findById(id: string): Promise<UserSafe> {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (user === null) {
      throw new AppError(404, "USER_NOT_FOUND", "No se encontró el fiscal solicitado.");
    }

    return this.toUserSafe(user);
  }

  public async create(data: CreateUserInput): Promise<UserSafe> {
    const password = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        username: data.username,
        displayName: data.displayName,
        password,
        email: data.email ?? null,
        avatar: data.avatarUrl ?? null,
        badgeNumber: data.badgeNumber ?? null,
        division: data.division ?? null,
        bio: data.bio ?? null,
        role: data.role as PrismaRoleType
      }
    });

    return this.toUserSafe(user);
  }

  public async update(id: string, data: UpdateUserInput, requester: AuthenticatedUser): Promise<UserSafe> {
    if (requester.id !== id && !hasPermission(requester.role, Permission.MANAGE_USERS)) {
      throw new AppError(403, "FORBIDDEN", "No tienes permisos para editar este fiscal.");
    }

    await this.findById(id);

    const updateData: Prisma.UserUpdateInput = {};

    if (data.displayName !== undefined) updateData.displayName = data.displayName;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.avatarUrl !== undefined) updateData.avatar = data.avatarUrl;
    if (data.badgeNumber !== undefined) updateData.badgeNumber = data.badgeNumber;
    if (data.division !== undefined) updateData.division = data.division;
    if (data.bio !== undefined) updateData.bio = data.bio;

    const user = await this.prisma.user.update({ where: { id }, data: updateData });

    return this.toUserSafe(user);
  }

  public async deactivate(id: string): Promise<UserSafe> {
    await this.findById(id);

    const user = await this.prisma.user.update({
      where: { id },
      data: { active: false }
    });

    return this.toUserSafe(user);
  }

  public async changeRole(id: string, role: RoleType, requester: AuthenticatedUser): Promise<UserSafe> {
    const target = await this.findById(id);

    if (!isRoleAbove(requester.role, target.role) || !isRoleAbove(requester.role, role)) {
      throw new AppError(403, "ROLE_LEVEL_TOO_LOW", "No puedes asignar o modificar un rol igual o superior al tuyo.");
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: { role: role as PrismaRoleType }
    });

    return this.toUserSafe(user);
  }

  public async updateAvatar(id: string, avatarUrl: string): Promise<UserSafe> {
    await this.findById(id);

    const user = await this.prisma.user.update({
      where: { id },
      data: { avatar: avatarUrl }
    });

    return this.toUserSafe(user);
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
}
