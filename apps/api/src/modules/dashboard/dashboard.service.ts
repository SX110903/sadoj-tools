import { hasPermission, Permission, ROLE_LEVEL, type RoleType } from "@sadoj/shared";
import { InvestigationStatus, Prisma, SubjectStatus, WarrantStatus, type PrismaClient } from "../../shared/prisma";
import type { AuthenticatedUser } from "../../types/fastify";

interface PersonnelSummary {
  id: string;
  displayName: string;
  role: string;
  avatar: string | null;
  badgeNumber: string | null;
  activeInvestigations: number;
  documentsLast30Days: number;
  activeSanctions: number;
  lastLoginAt: Date | null;
}

export class DashboardService {
  public constructor(private readonly prisma: PrismaClient) {}

  public async stats(requester: AuthenticatedUser): Promise<unknown> {
    const canViewAllInvestigations = hasPermission(requester.role, Permission.VIEW_ALL_INVESTIGATIONS);
    const canViewSubjects = hasPermission(requester.role, Permission.VIEW_SUBJECTS);
    const canManageWarrants = hasPermission(requester.role, Permission.MANAGE_WARRANTS);
    const canViewAuditLog = hasPermission(requester.role, Permission.VIEW_AUDIT_LOG);
    const assignedInvestigationWhere: Prisma.InvestigationWhereInput = {
      OR: [{ leadFiscalId: requester.id }, { participants: { some: { userId: requester.id } } }]
    };
    const activeInvestigationWhere: Prisma.InvestigationWhereInput = {
      status: { in: [InvestigationStatus.OPEN, InvestigationStatus.ACTIVE] },
      ...(canViewAllInvestigations ? {} : assignedInvestigationWhere)
    };
    const recentActivityWhere: Prisma.AuditLogWhereInput = canViewAuditLog ? {} : { userId: requester.id };
    const recentInvestigationsArgs: Prisma.InvestigationFindManyArgs = {
      ...(canViewAllInvestigations ? {} : { where: assignedInvestigationWhere }),
      take: 5,
      orderBy: { updatedAt: "desc" },
      include: {
        leadFiscal: { select: { id: true, displayName: true, role: true, avatar: true } },
        participants: {
          take: 4,
          include: { user: { select: { id: true, displayName: true, avatar: true, role: true } } }
        },
        _count: { select: { participants: true, subjects: true } }
      }
    };

    const [activeInvestigations, watchedSubjects, pendingWarrants, myActivity, recentInvestigations, recentActivity] = await Promise.all([
      this.prisma.investigation.count({ where: activeInvestigationWhere }),
      canViewSubjects ? this.prisma.subject.count({ where: { status: SubjectStatus.UNDER_SURVEILLANCE } }) : Promise.resolve(0),
      canManageWarrants ? this.prisma.warrant.count({ where: { status: WarrantStatus.PENDING } }) : Promise.resolve(0),
      this.prisma.auditLog.count({ where: { userId: requester.id, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
      this.prisma.investigation.findMany(recentInvestigationsArgs),
      this.prisma.auditLog.findMany({
        where: recentActivityWhere,
        take: 8,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { displayName: true, role: true, avatar: true } } }
      })
    ]);

    return {
      stats: {
        activeInvestigations,
        watchedSubjects,
        pendingWarrants,
        myActivity
      },
      recentInvestigations,
      recentActivity,
      personnel: ROLE_LEVEL[requester.role] >= 8 ? await this.getPersonnelSummary() : []
    };
  }

  private async getPersonnelSummary(): Promise<PersonnelSummary[]> {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const users = await this.prisma.user.findMany({
      where: { active: true },
      orderBy: { displayName: "asc" },
      select: {
        id: true,
        displayName: true,
        role: true,
        avatar: true,
        badgeNumber: true,
        lastLoginAt: true
      }
    });
    const userIds = users.map((user) => user.id);

    // Aggregate once instead of querying per user (avoids N+1 on the team panel).
    const [activeInvestigations, documentGroups, sanctionGroups] = await Promise.all([
      this.prisma.investigation.findMany({
        where: { status: { in: [InvestigationStatus.OPEN, InvestigationStatus.ACTIVE] } },
        select: { leadFiscalId: true, participants: { select: { userId: true } } }
      }),
      this.prisma.document.groupBy({
        by: ["createdById"],
        where: { createdById: { in: userIds }, createdAt: { gte: since } },
        _count: { _all: true }
      }),
      this.prisma.sanction.groupBy({
        by: ["userId"],
        where: { userId: { in: userIds }, active: true },
        _count: { _all: true }
      })
    ]);

    const investigationCounts = new Map<string, number>();
    for (const investigation of activeInvestigations) {
      const involvedUserIds = new Set<string>();
      if (investigation.leadFiscalId !== null) {
        involvedUserIds.add(investigation.leadFiscalId);
      }
      for (const participant of investigation.participants) {
        involvedUserIds.add(participant.userId);
      }
      for (const userId of involvedUserIds) {
        investigationCounts.set(userId, (investigationCounts.get(userId) ?? 0) + 1);
      }
    }

    const documentCounts = new Map(documentGroups.map((group) => [group.createdById, group._count._all]));
    const sanctionCounts = new Map(sanctionGroups.map((group) => [group.userId, group._count._all]));

    const summaries: PersonnelSummary[] = users.map((user) => ({
      id: user.id,
      displayName: user.displayName,
      role: user.role,
      avatar: user.avatar,
      badgeNumber: user.badgeNumber,
      activeInvestigations: investigationCounts.get(user.id) ?? 0,
      documentsLast30Days: documentCounts.get(user.id) ?? 0,
      activeSanctions: sanctionCounts.get(user.id) ?? 0,
      lastLoginAt: user.lastLoginAt
    }));

    return summaries.sort((left, right) => ROLE_LEVEL[right.role as RoleType] - ROLE_LEVEL[left.role as RoleType]);
  }
}
