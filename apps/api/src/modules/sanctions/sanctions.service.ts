import { hasPermission, Permission, ROLE_LEVEL, RoleType } from "@sadoj/shared";
import { AppError } from "../../shared/errors/AppError";
import { NotificationType, Prisma, SanctionType, type PrismaClient } from "../../shared/prisma";
import { buildPaginationMeta, getPagination, type PaginationMeta } from "../../shared/utils/pagination";
import type { AuthenticatedUser } from "../../types/fastify";
import { NotificationsService } from "../notifications/notifications.service";
import type { CreateSanctionInput, ResolveSanctionInput, SanctionsQueryInput } from "./sanctions.schema";

const SANCTION_INCLUDE = {
  user: { select: { id: true, displayName: true, username: true, role: true, avatar: true, badgeNumber: true } },
  issuedBy: { select: { id: true, displayName: true, role: true, avatar: true } }
} satisfies Prisma.SanctionInclude;

export interface PaginatedSanctions {
  data: unknown[];
  meta: PaginationMeta;
}

export class SanctionsService {
  public constructor(private readonly prisma: PrismaClient) {}

  public async findEligibleUsers(issuer: AuthenticatedUser): Promise<unknown[]> {
    const issuerLevel = ROLE_LEVEL[issuer.role];
    const users = await this.prisma.user.findMany({
      where: { active: true },
      orderBy: { displayName: "asc" },
      select: { id: true, displayName: true, username: true, role: true, avatar: true, badgeNumber: true }
    });

    return users.filter((user) => ROLE_LEVEL[user.role as RoleType] < issuerLevel);
  }

  public async findAll(query: SanctionsQueryInput): Promise<PaginatedSanctions> {
    const pagination = getPagination(query);
    const where: Prisma.SanctionWhereInput = {};

    if (query.userId !== undefined) where.userId = query.userId;
    if (query.type !== undefined) where.type = query.type;
    if (query.active !== undefined) where.active = query.active;

    const [total, sanctions] = await this.prisma.$transaction([
      this.prisma.sanction.count({ where }),
      this.prisma.sanction.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: "desc" },
        include: SANCTION_INCLUDE
      })
    ]);

    return {
      data: sanctions,
      meta: buildPaginationMeta(total, pagination.page, pagination.limit)
    };
  }

  public async findById(id: string): Promise<unknown> {
    const sanction = await this.prisma.sanction.findUnique({
      where: { id },
      include: SANCTION_INCLUDE
    });

    if (sanction === null) {
      throw new AppError(404, "SANCTION_NOT_FOUND", "No se encontró la sanción solicitada.");
    }

    return sanction;
  }

  public async findByUser(userId: string, requester: AuthenticatedUser): Promise<unknown[]> {
    if (requester.id !== userId && !hasPermission(requester.role, Permission.MANAGE_SANCTIONS)) {
      throw new AppError(403, "FORBIDDEN", "No tienes permisos para ver estas sanciones.");
    }

    return this.prisma.sanction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: SANCTION_INCLUDE
    });
  }

  public async create(data: CreateSanctionInput, issuer: AuthenticatedUser): Promise<unknown> {
    const target = await this.prisma.user.findUnique({ where: { id: data.userId } });

    if (target === null) {
      throw new AppError(404, "USER_NOT_FOUND", "No se encontró el fiscal sancionado.");
    }

    if (ROLE_LEVEL[issuer.role] <= ROLE_LEVEL[target.role as RoleType]) {
      throw new AppError(403, "ROLE_LEVEL_TOO_LOW", "No puedes sancionar a un fiscal de rango igual o superior.");
    }

    if (data.type === SanctionType.SUSPENSION && data.severity < 3) {
      throw new AppError(400, "INVALID_SEVERITY", "Una suspensión requiere severidad mínima de 3.");
    }

    if (data.type === SanctionType.DISMISSAL && ROLE_LEVEL[issuer.role] < 9) {
      throw new AppError(403, "ROLE_LEVEL_TOO_LOW", "Solo Fiscalía Adjunta o superior puede emitir un cese.");
    }

    const sanction = await this.prisma.$transaction(async (transaction) => {
      const sanction = await transaction.sanction.create({
        data: {
          userId: data.userId,
          type: data.type,
          description: data.description,
          severity: data.severity,
          issuedById: issuer.id
        },
        include: SANCTION_INCLUDE
      });

      await transaction.auditLog.create({
        data: {
          userId: issuer.id,
          action: "CREATE_SANCTION",
          entity: "Sanction",
          entityId: sanction.id,
          meta: { targetUserId: data.userId, type: data.type, severity: data.severity }
        }
      });

      return sanction;
    });

    await new NotificationsService(this.prisma).notify({
      recipientId: data.userId,
      actorId: issuer.id,
      type: NotificationType.SANCTION_ISSUED,
      title: "SanciÃ³n emitida",
      message: `Se registrÃ³ una sanciÃ³n ${data.type} en tu expediente interno.`,
      link: `/fiscales/${data.userId}`,
      meta: { sanctionId: sanction.id, type: data.type, severity: data.severity }
    });

    return sanction;
  }

  public async resolve(id: string, data: ResolveSanctionInput, resolver: AuthenticatedUser): Promise<unknown> {
    const sanction = await this.prisma.sanction.findUnique({ where: { id } });

    if (sanction === null) {
      throw new AppError(404, "SANCTION_NOT_FOUND", "No se encontró la sanción solicitada.");
    }

    if (!sanction.active) {
      throw new AppError(409, "SANCTION_ALREADY_RESOLVED", "La sanción ya está resuelta.");
    }

    return this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.sanction.update({
        where: { id },
        data: {
          active: false,
          resolvedAt: new Date(),
          resolvedNotes: data.resolvedNotes ?? null
        },
        include: SANCTION_INCLUDE
      });

      await transaction.auditLog.create({
        data: {
          userId: resolver.id,
          action: "RESOLVE_SANCTION",
          entity: "Sanction",
          entityId: id,
          meta: { targetUserId: sanction.userId, type: sanction.type }
        }
      });

      return updated;
    });
  }
}
