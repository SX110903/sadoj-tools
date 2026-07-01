import { hasPermission, Permission, ROLE_LEVEL, RoleType } from "@sadoj/shared";
import { AppError } from "../../shared/errors/AppError";
import { isUniqueConstraintError } from "../../shared/prisma-errors";
import {
  InvestigationStatus,
  IncidentOrigin,
  IncidentResult,
  NotificationType,
  PropertyIncidentType,
  Prisma,
  WarrantResult,
  WarrantStatus,
  WarrantType,
  type PrismaClient,
  type WarrantType as PrismaWarrantType
} from "../../shared/prisma";
import { buildPaginationMeta, getPagination, type PaginationMeta } from "../../shared/utils/pagination";
import { withUniqueRetry } from "../../shared/utils/retry";
import type { AuthenticatedUser } from "../../types/fastify";
import type {
  CreateWarrantInput,
  CreateWarrantReportInput,
  ExecuteWarrantInput,
  RejectWarrantInput,
  WarrantsQueryInput
} from "./warrants.schema";
import { NotificationsService } from "../notifications/notifications.service";

export interface PaginatedWarrants {
  data: unknown[];
  meta: PaginationMeta;
}

const WARRANT_ABBREVIATIONS: Readonly<Record<WarrantType, string>> = {
  [WarrantType.ALLANAMIENTO]: "ALLAN",
  [WarrantType.DETENCION]: "DETEN",
  [WarrantType.INTERCEPCION]: "INTER",
  [WarrantType.INCAUTACION]: "INCAU"
};

const VALID_INVESTIGATION_STATUSES = new Set<InvestigationStatus>([InvestigationStatus.OPEN, InvestigationStatus.ACTIVE]);
const PROPERTY_TARGET_TYPES = new Set<WarrantType>([WarrantType.ALLANAMIENTO, WarrantType.INCAUTACION]);
const PROPERTY_INCIDENT_SEQUENCE_RETRY_LIMIT = 3;

export class WarrantsService {
  public constructor(private readonly prisma: PrismaClient) {}

  public async findAll(requester: AuthenticatedUser, query: WarrantsQueryInput): Promise<PaginatedWarrants> {
    await this.expireApprovedWarrants();
    const pagination = getPagination(query);
    const where: Prisma.WarrantWhereInput = {};

    if (query.status !== undefined) where.status = query.status;
    if (query.type !== undefined) where.type = query.type;
    if (query.investigationId !== undefined) where.investigationId = query.investigationId;

    if (!hasPermission(requester.role, Permission.VIEW_ALL_INVESTIGATIONS)) {
      where.investigation = {
        OR: [{ leadFiscalId: requester.id }, { participants: { some: { userId: requester.id } } }]
      };
    }

    const [total, warrants] = await this.prisma.$transaction([
      this.prisma.warrant.count({ where }),
      this.prisma.warrant.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: "desc" },
        include: this.includeRelations()
      })
    ]);

    return { data: warrants, meta: buildPaginationMeta(total, pagination.page, pagination.limit) };
  }

  public async findById(id: string, requester: AuthenticatedUser): Promise<unknown> {
    await this.expireApprovedWarrants();
    const warrant = await this.prisma.warrant.findUnique({
      where: { id },
      include: this.includeRelations()
    });

    if (warrant === null) {
      throw new AppError(404, "WARRANT_NOT_FOUND", "No se encontró la orden solicitada.");
    }

    await this.ensureInvestigationAccess(warrant.investigationId, requester);
    return warrant;
  }

  public async create(data: CreateWarrantInput, requester: AuthenticatedUser): Promise<unknown> {
    await this.ensureInvestigationOpen(data.investigationId, requester);
    const propertyId = await this.resolvePropertyTarget(data);

    return withUniqueRetry(async () => {
      const warrantNumber = await this.generateWarrantNumber(data.type as PrismaWarrantType);

      return this.prisma.warrant.create({
        data: {
          warrantNumber,
          investigationId: data.investigationId,
          propertyId,
          type: data.type as PrismaWarrantType,
          title: data.title,
          description: data.description,
          location: data.location,
          justification: data.justification,
          legalBasis: data.legalBasis,
          requestedById: requester.id
        },
        include: this.includeRelations()
      });
    }, ["warrantNumber"]);
  }

  public async approve(id: string, requester: AuthenticatedUser): Promise<unknown> {
    this.ensureCanReview(requester);
    const warrant = await this.prisma.warrant.findUnique({ where: { id } });

    if (warrant === null) {
      throw new AppError(404, "WARRANT_NOT_FOUND", "No se encontró la orden solicitada.");
    }

    await this.ensureInvestigationAccess(warrant.investigationId, requester);

    if (warrant.requestedById === requester.id) {
      throw new AppError(403, "SELF_APPROVAL_FORBIDDEN", "No puedes aprobar una orden solicitada por ti.");
    }

    if (warrant.status !== WarrantStatus.PENDING) {
      throw new AppError(409, "INVALID_WARRANT_STATUS", "Solo se pueden aprobar órdenes pendientes.");
    }

    const updated = await this.prisma.warrant.update({
      where: { id },
      data: {
        status: WarrantStatus.APPROVED,
        approvedById: requester.id,
        approvedAt: new Date(),
        rejectionReason: null
      },
      include: this.includeRelations()
    });

    await new NotificationsService(this.prisma).notify({
      recipientId: warrant.requestedById,
      actorId: requester.id,
      type: NotificationType.WARRANT_APPROVED,
      title: "Orden aprobada",
      message: `${updated.warrantNumber} fue aprobada.`,
      link: `/ordenes/${id}`,
      meta: { warrantId: id, warrantNumber: updated.warrantNumber }
    });

    return updated;
  }

  public async reject(id: string, data: RejectWarrantInput, requester: AuthenticatedUser): Promise<unknown> {
    this.ensureCanReview(requester);
    const warrant = await this.prisma.warrant.findUnique({ where: { id } });

    if (warrant === null) {
      throw new AppError(404, "WARRANT_NOT_FOUND", "No se encontró la orden solicitada.");
    }

    await this.ensureInvestigationAccess(warrant.investigationId, requester);

    if (warrant.status !== WarrantStatus.PENDING) {
      throw new AppError(409, "INVALID_WARRANT_STATUS", "Solo se pueden rechazar órdenes pendientes.");
    }

    const updated = await this.prisma.warrant.update({
      where: { id },
      data: {
        status: WarrantStatus.REJECTED,
        rejectionReason: data.reason,
        approvedById: null,
        approvedAt: null
      },
      include: this.includeRelations()
    });

    await new NotificationsService(this.prisma).notify({
      recipientId: warrant.requestedById,
      actorId: requester.id,
      type: NotificationType.WARRANT_REJECTED,
      title: "Orden rechazada",
      message: `${updated.warrantNumber} fue rechazada.`,
      link: `/ordenes/${id}`,
      meta: { warrantId: id, warrantNumber: updated.warrantNumber, reason: data.reason }
    });

    return updated;
  }

  public async execute(id: string, data: ExecuteWarrantInput, requester: AuthenticatedUser): Promise<unknown> {
    const warrant = await this.prisma.warrant.findUnique({ where: { id } });

    if (warrant === null) {
      throw new AppError(404, "WARRANT_NOT_FOUND", "No se encontró la orden solicitada.");
    }

    await this.ensureInvestigationAccess(warrant.investigationId, requester);

    if (warrant.status !== WarrantStatus.APPROVED) {
      throw new AppError(409, "INVALID_WARRANT_STATUS", "Solo se pueden ejecutar órdenes aprobadas.");
    }

    return this.prisma.warrant.update({
      where: { id },
      data: {
        status: WarrantStatus.EXECUTED,
        executedAt: new Date(),
        executionNotes: data.executionNotes
      },
      include: this.includeRelations()
    });
  }

  public async getReport(id: string, requester: AuthenticatedUser): Promise<unknown> {
    const warrant = await this.prisma.warrant.findUnique({
      where: { id },
      select: { id: true, investigationId: true }
    });

    if (warrant === null) {
      throw new AppError(404, "WARRANT_NOT_FOUND", "No se encontró la orden solicitada.");
    }

    await this.ensureInvestigationAccess(warrant.investigationId, requester);

    const report = await this.prisma.warrantReport.findUnique({
      where: { warrantId: id },
      include: {
        createdBy: { select: { id: true, displayName: true, role: true, avatar: true } },
        files: {
          include: { uploadedBy: { select: { id: true, displayName: true, role: true, avatar: true } } },
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (report === null) {
      throw new AppError(404, "WARRANT_REPORT_NOT_FOUND", "No se encontró el informe de esta orden.");
    }

    return report;
  }

  public async createReport(id: string, data: CreateWarrantReportInput, requester: AuthenticatedUser): Promise<unknown> {
    const warrant = await this.prisma.warrant.findUnique({
      where: { id },
      include: { warrantReport: true }
    });

    if (warrant === null) {
      throw new AppError(404, "WARRANT_NOT_FOUND", "No se encontró la orden solicitada.");
    }

    await this.ensureInvestigationAccess(warrant.investigationId, requester);

    if (warrant.status !== WarrantStatus.EXECUTED) {
      throw new AppError(409, "INVALID_WARRANT_STATUS", "Solo se puede informar una orden ejecutada.");
    }

    if (warrant.warrantReport !== null) {
      throw new AppError(409, "WARRANT_REPORT_EXISTS", "La orden ya tiene un informe registrado.");
    }

    for (let attempt = 1; attempt <= PROPERTY_INCIDENT_SEQUENCE_RETRY_LIMIT; attempt += 1) {
      try {
        return await this.prisma.$transaction(async (transaction) => {
          const raidSequence = await this.nextPropertyIncidentSequence(transaction, warrant.propertyId);
          const report = await transaction.warrantReport.create({
            data: {
              warrantId: id,
              result: data.result,
              raidSequence,
              findings: data.findings,
              evidence: data.evidence ?? null,
              persons: data.persons ?? null,
              participatingAgencies: data.participatingAgencies ?? null,
              notes: data.notes ?? null,
              createdById: requester.id
            },
            include: {
              createdBy: { select: { id: true, displayName: true, role: true, avatar: true } },
              files: {
                include: { uploadedBy: { select: { id: true, displayName: true, role: true, avatar: true } } },
                orderBy: { createdAt: "desc" }
              }
            }
          });

          await this.syncPropertyIncidentFromReport(transaction, warrant, report, requester.id, raidSequence);

          return report;
        });
      } catch (error) {
        if (attempt < PROPERTY_INCIDENT_SEQUENCE_RETRY_LIMIT && isUniqueConstraintError(error, ["propertyId", "sequence"])) {
          continue;
        }

        throw error;
      }
    }

    throw new AppError(409, "PROPERTY_INCIDENT_SEQUENCE_CONFLICT", "No se pudo asignar un numero de allanamiento. Intentalo de nuevo.");
  }

  private includeRelations(): Prisma.WarrantInclude {
    return {
      investigation: { select: { id: true, caseNumber: true, title: true, status: true } },
      property: { select: { id: true, address: true, type: true, zone: true, notes: true, gtaX: true, gtaY: true, createdAt: true } },
      requestedBy: { select: { id: true, displayName: true, role: true, avatar: true } },
      approvedBy: { select: { id: true, displayName: true, role: true, avatar: true } },
      files: {
        include: { uploadedBy: { select: { id: true, displayName: true, role: true, avatar: true } } },
        orderBy: { createdAt: "desc" }
      },
      warrantReport: {
        include: {
          createdBy: { select: { id: true, displayName: true, role: true, avatar: true } },
          files: {
            include: { uploadedBy: { select: { id: true, displayName: true, role: true, avatar: true } } },
            orderBy: { createdAt: "desc" }
          }
        }
      }
    };
  }

  private async resolvePropertyTarget(data: CreateWarrantInput): Promise<string | null> {
    const propertyId = data.propertyId ?? null;
    if (propertyId === null || !PROPERTY_TARGET_TYPES.has(data.type)) return null;

    const property = await this.prisma.property.findUnique({ where: { id: propertyId }, select: { id: true } });
    if (property === null) {
      throw new AppError(404, "PROPERTY_NOT_FOUND", "No se encontrÃ³ la propiedad objetivo.");
    }

    return property.id;
  }

  private async nextPropertyIncidentSequence(transaction: Prisma.TransactionClient, propertyId: string | null): Promise<number | null> {
    if (propertyId === null) return null;

    const aggregate = await transaction.propertyIncident.aggregate({
      where: { propertyId },
      _max: { sequence: true }
    });

    return (aggregate._max.sequence ?? 0) + 1;
  }

  private async syncPropertyIncidentFromReport(
    transaction: Prisma.TransactionClient,
    warrant: {
      id: string;
      propertyId: string | null;
      type: WarrantType;
      title: string;
      executedAt: Date | null;
      investigationId: string;
    },
    report: {
      result: WarrantResult;
      findings: string;
      evidence: string | null;
      persons: string | null;
      participatingAgencies: string | null;
      createdAt: Date;
    },
    createdById: string,
    sequence: number | null
  ): Promise<void> {
    const incidentType = this.toPropertyIncidentType(warrant.type);
    if (warrant.propertyId === null || incidentType === null || sequence === null) return;

    const existing = await transaction.propertyIncident.findUnique({
      where: { warrantId: warrant.id },
      select: { id: true, sequence: true }
    });

    const data = {
      type: incidentType,
      title: warrant.title,
      description: report.findings,
      result: this.toIncidentResult(report.result),
      occurredAt: warrant.executedAt ?? report.createdAt,
      origin: IncidentOrigin.WARRANT,
      participatingAgencies: report.participatingAgencies,
      evidence: report.evidence,
      personsPresent: report.persons,
      investigationId: warrant.investigationId
    };

    if (existing !== null) {
      await transaction.propertyIncident.update({
        where: { id: existing.id },
        data
      });
      return;
    }

    await transaction.propertyIncident.create({
      data: {
        ...data,
        propertyId: warrant.propertyId,
        sequence,
        warrantId: warrant.id,
        createdById
      }
    });
  }

  private toPropertyIncidentType(type: WarrantType): PropertyIncidentType | null {
    if (type === WarrantType.ALLANAMIENTO) return PropertyIncidentType.RAID;
    if (type === WarrantType.INCAUTACION) return PropertyIncidentType.SEIZURE;
    return null;
  }

  private toIncidentResult(result: WarrantResult): IncidentResult {
    if (result === WarrantResult.POSITIVE) return IncidentResult.POSITIVE;
    if (result === WarrantResult.PARTIAL) return IncidentResult.PARTIAL;
    return IncidentResult.NEGATIVE;
  }

  private async generateWarrantNumber(type: PrismaWarrantType): Promise<string> {
    const year = new Date().getFullYear();
    const yearStart = new Date(year, 0, 1);
    const abbreviation = WARRANT_ABBREVIATIONS[type];
    const count = await this.prisma.warrant.count({
      where: {
        type,
        createdAt: { gte: yearStart }
      }
    });

    return `ORD-${abbreviation}-${year}-${String(count + 1).padStart(3, "0")}`;
  }

  private ensureCanReview(requester: AuthenticatedUser): void {
    if (ROLE_LEVEL[requester.role] < ROLE_LEVEL[RoleType.FISCAL_DIVISION]) {
      throw new AppError(403, "FORBIDDEN", "Solo un District Attorney o superior puede revisar órdenes.");
    }
  }

  private async ensureInvestigationOpen(investigationId: string, requester: AuthenticatedUser): Promise<void> {
    const investigation = await this.prisma.investigation.findUnique({
      where: { id: investigationId },
      include: { participants: { where: { userId: requester.id } } }
    });

    if (investigation === null) {
      throw new AppError(404, "INVESTIGATION_NOT_FOUND", "No se encontró la investigación solicitada.");
    }

    if (!VALID_INVESTIGATION_STATUSES.has(investigation.status)) {
      throw new AppError(409, "INVESTIGATION_NOT_OPEN", "La investigación debe estar abierta o activa para solicitar órdenes.");
    }

    await this.ensureInvestigationAccess(investigationId, requester);
  }

  private async ensureInvestigationAccess(investigationId: string, requester: AuthenticatedUser): Promise<void> {
    const investigation = await this.prisma.investigation.findUnique({
      where: { id: investigationId },
      include: { participants: { where: { userId: requester.id } } }
    });

    if (investigation === null) {
      throw new AppError(404, "INVESTIGATION_NOT_FOUND", "No se encontró la investigación solicitada.");
    }

    const hasGlobalAccess = hasPermission(requester.role, Permission.VIEW_ALL_INVESTIGATIONS);
    const isLead = investigation.leadFiscalId === requester.id;
    const isParticipant = investigation.participants.length > 0;

    if (!hasGlobalAccess && !isLead && !isParticipant) {
      throw new AppError(403, "INVESTIGATION_ACCESS_DENIED", "No tienes acceso a esta investigación.");
    }
  }

  private async expireApprovedWarrants(): Promise<void> {
    const cutoff = new Date(Date.now() - 72 * 60 * 60 * 1000);

    await this.prisma.warrant.updateMany({
      where: {
        status: WarrantStatus.APPROVED,
        executedAt: null,
        approvedAt: { lt: cutoff }
      },
      data: { status: WarrantStatus.EXPIRED }
    });
  }
}
