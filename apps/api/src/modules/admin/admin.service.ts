import { Permission, ROLE_LABELS_ES, ROLE_LEVEL, ROLE_PERMISSIONS, RoleType } from "@sadoj/shared";
import { Prisma, type PrismaClient } from "../../shared/prisma";
import { buildPaginationMeta, getPagination, type PaginationMeta } from "../../shared/utils/pagination";
import type { AdminAuditQueryInput } from "./admin.schema";

const AUDIT_INCLUDE = {
  user: { select: { id: true, displayName: true, role: true, avatar: true } }
} satisfies Prisma.AuditLogInclude;

type AdminAuditLog = Prisma.AuditLogGetPayload<{ include: typeof AUDIT_INCLUDE }>;

export interface AdminStats {
  users: {
    total: number;
    active: number;
    inactive: number;
  };
  investigations: {
    total: number;
    active: number;
  };
  sanctions: {
    total: number;
    active: number;
  };
  audit: {
    last24h: number;
  };
  roles: Array<{
    role: RoleType;
    label: string;
    level: number;
    users: number;
  }>;
  recentAudit: AdminAuditLog[];
}

export interface AdminRoleInfo {
  role: RoleType;
  label: string;
  level: number;
  permissions: readonly Permission[];
}

export interface PaginatedAuditLogs {
  data: AdminAuditLog[];
  meta: PaginationMeta;
}

export class AdminService {
  public constructor(private readonly prisma: PrismaClient) {}

  public async getStats(): Promise<AdminStats> {
    const [totalUsers, activeUsers, totalInvestigations, activeInvestigations, totalSanctions, activeSanctions, auditLast24h, recentAudit, userRoles] =
      await this.prisma.$transaction([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { active: true } }),
        this.prisma.investigation.count(),
        this.prisma.investigation.count({ where: { status: { in: ["OPEN", "ACTIVE"] } } }),
        this.prisma.sanction.count(),
        this.prisma.sanction.count({ where: { active: true } }),
        this.prisma.auditLog.count({ where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
        this.prisma.auditLog.findMany({
          take: 8,
          orderBy: { createdAt: "desc" },
          include: AUDIT_INCLUDE
        }),
        this.prisma.user.findMany({ select: { role: true } })
      ]);

    const usersByRoleMap = new Map<RoleType, number>();
    for (const user of userRoles) {
      const role = user.role as RoleType;
      usersByRoleMap.set(role, (usersByRoleMap.get(role) ?? 0) + 1);
    }

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers
      },
      investigations: {
        total: totalInvestigations,
        active: activeInvestigations
      },
      sanctions: {
        total: totalSanctions,
        active: activeSanctions
      },
      audit: {
        last24h: auditLast24h
      },
      roles: this.getRoles().map((role) => ({
        role: role.role,
        label: role.label,
        level: role.level,
        users: usersByRoleMap.get(role.role) ?? 0
      })),
      recentAudit
    };
  }

  public getRoles(): AdminRoleInfo[] {
    return Object.values(RoleType)
      .map((role) => ({
        role,
        label: ROLE_LABELS_ES[role],
        level: ROLE_LEVEL[role],
        permissions: ROLE_PERMISSIONS[role]
      }))
      .sort((first, second) => second.level - first.level);
  }

  public async getAuditLogs(query: AdminAuditQueryInput): Promise<PaginatedAuditLogs> {
    const pagination = getPagination(query);
    const where: Prisma.AuditLogWhereInput = {};

    if (query.action !== undefined) where.action = { contains: query.action, mode: "insensitive" };
    if (query.entity !== undefined) where.entity = { contains: query.entity, mode: "insensitive" };
    if (query.userId !== undefined) where.userId = query.userId;

    const [total, logs] = await this.prisma.$transaction([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: "desc" },
        include: AUDIT_INCLUDE
      })
    ]);

    return {
      data: logs,
      meta: buildPaginationMeta(total, pagination.page, pagination.limit)
    };
  }
}
