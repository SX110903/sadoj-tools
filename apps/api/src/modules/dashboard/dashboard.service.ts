import { ROLE_LEVEL, type RoleType } from "@sadoj/shared";
import { InvestigationStatus, SubjectStatus, WarrantStatus, type PrismaClient } from "../../shared/prisma";
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
    const [activeInvestigations, watchedSubjects, pendingWarrants, myActivity, recentInvestigations, recentActivity] = await this.prisma.$transaction([
      this.prisma.investigation.count({ where: { status: { in: [InvestigationStatus.OPEN, InvestigationStatus.ACTIVE] } } }),
      this.prisma.subject.count({ where: { status: SubjectStatus.UNDER_SURVEILLANCE } }),
      this.prisma.warrant.count({ where: { status: WarrantStatus.PENDING } }),
      this.prisma.auditLog.count({ where: { userId: requester.id, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
      this.prisma.investigation.findMany({
        where: {
          OR: [{ leadFiscalId: requester.id }, { participants: { some: { userId: requester.id } } }]
        },
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
      }),
      this.prisma.auditLog.findMany({
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
