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
    const summaries = await Promise.all(
      users.map(async (user) => {
        const [activeInvestigations, documentsLast30Days, activeSanctions] = await this.prisma.$transaction([
          this.prisma.investigation.count({
            where: {
              status: { in: [InvestigationStatus.OPEN, InvestigationStatus.ACTIVE] },
              OR: [{ leadFiscalId: user.id }, { participants: { some: { userId: user.id } } }]
            }
          }),
          this.prisma.document.count({ where: { createdById: user.id, createdAt: { gte: since } } }),
          this.prisma.sanction.count({ where: { userId: user.id, active: true } })
        ]);

        return {
          id: user.id,
          displayName: user.displayName,
          role: user.role,
          avatar: user.avatar,
          badgeNumber: user.badgeNumber,
          activeInvestigations,
          documentsLast30Days,
          activeSanctions,
          lastLoginAt: user.lastLoginAt
        };
      })
    );

    return summaries.sort((left, right) => ROLE_LEVEL[right.role as RoleType] - ROLE_LEVEL[left.role as RoleType]);
  }
}
