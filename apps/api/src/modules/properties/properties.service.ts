import { hasPermission, Permission } from "@sadoj/shared";
import { AppError } from "../../shared/errors/AppError";
import {
  AccessLevel,
  IncidentOrigin,
  Prisma,
  WarrantType,
  type PrismaClient
} from "../../shared/prisma";
import { sortTimelineEvents, type TimelineEvent } from "../../shared/timeline";
import { buildPaginationMeta, getPagination, type PaginationMeta } from "../../shared/utils/pagination";
import type { AuthenticatedUser } from "../../types/fastify";
import {
  canAccessProperty,
  ensurePropertyAccess
} from "./property-access";
import type {
  CreatePropertyIncidentInput,
  CreatePropertyInput,
  PropertiesQueryInput,
  UpdatePropertyIncidentInput,
  UpdatePropertyInput,
  UpdatePropertyMemberInput,
  UpsertPropertyMemberInput
} from "./properties.schema";

export interface PaginatedProperties {
  data: unknown[];
  meta: PaginationMeta;
}

const PERSON_SELECT = {
  id: true,
  displayName: true,
  role: true,
  avatar: true
} satisfies Prisma.UserSelect;

const MEMBER_USER_SELECT = {
  id: true,
  username: true,
  displayName: true,
  role: true,
  avatar: true,
  badgeNumber: true,
  division: true
} satisfies Prisma.UserSelect;

const DOSSIER_PROPERTY_SELECT = {
  id: true,
  address: true,
  type: true,
  zone: true,
  notes: true,
  gtaX: true,
  gtaY: true,
  createdById: true,
  createdAt: true,
  subjects: {
    include: {
      subject: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          alias: true,
          photo: true,
          status: true,
          dangerLevel: true,
          organizationId: true,
          criminalOrganization: { select: { id: true, name: true, alias: true, color: true, type: true } }
        }
      }
    },
    orderBy: { relation: "asc" }
  }
} satisfies Prisma.PropertySelect;

const PROPERTY_INCIDENT_INCLUDE = {
  createdBy: { select: PERSON_SELECT },
  warrant: { select: { id: true, warrantNumber: true, type: true, title: true, status: true } },
  investigation: { select: { id: true, caseNumber: true, title: true, status: true } },
  files: {
    include: { uploadedBy: { select: PERSON_SELECT } },
    orderBy: { createdAt: "desc" }
  }
} satisfies Prisma.PropertyIncidentInclude;

const PROPERTY_MEMBER_INCLUDE = {
  user: { select: MEMBER_USER_SELECT },
  addedBy: { select: PERSON_SELECT }
} satisfies Prisma.PropertyMemberInclude;

export class PropertiesService {
  public constructor(private readonly prisma: PrismaClient) {}

  public async findAll(query: PropertiesQueryInput): Promise<PaginatedProperties> {
    const pagination = getPagination(query);
    const where: Prisma.PropertyWhereInput = {};

    if (query.q !== undefined) {
      where.address = { contains: query.q, mode: "insensitive" };
    }

    const [total, properties] = await this.prisma.$transaction([
      this.prisma.property.count({ where }),
      this.prisma.property.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: "desc" },
        include: {
          subjects: { include: { subject: true } },
          _count: { select: { incidents: true } }
        }
      })
    ]);

    return {
      data: properties.map((property) => ({
        ...property,
        operationsCount: property._count.incidents
      })),
      meta: buildPaginationMeta(total, pagination.page, pagination.limit)
    };
  }

  public async findById(id: string): Promise<unknown> {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: { subjects: { include: { subject: true } } }
    });

    if (property === null) {
      throw new AppError(404, "PROPERTY_NOT_FOUND", "No se encontro la propiedad solicitada.");
    }

    return property;
  }

  public async create(data: CreatePropertyInput, requester: AuthenticatedUser): Promise<unknown> {
    return this.prisma.$transaction(async (transaction) => {
      const property = await transaction.property.create({
        data: {
          ...data,
          zone: data.zone ?? null,
          notes: data.notes ?? null,
          gtaX: data.gtaX ?? null,
          gtaY: data.gtaY ?? null,
          createdById: requester.id
        }
      });

      await transaction.propertyMember.create({
        data: {
          propertyId: property.id,
          userId: requester.id,
          accessLevel: AccessLevel.ADMIN,
          addedById: requester.id
        }
      });

      await this.createAuditLog(transaction, requester.id, "PROPERTY_CREATED", "Property", property.id, { address: property.address });

      return property;
    });
  }

  public async update(id: string, data: UpdatePropertyInput): Promise<unknown> {
    await this.findById(id);
    const updateData: Prisma.PropertyUpdateInput = {};

    if (data.address !== undefined) updateData.address = data.address;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.zone !== undefined) updateData.zone = data.zone;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.gtaX !== undefined) updateData.gtaX = data.gtaX;
    if (data.gtaY !== undefined) updateData.gtaY = data.gtaY;

    return this.prisma.property.update({ where: { id }, data: updateData });
  }

  public async history(id: string): Promise<unknown[]> {
    await this.findById(id);

    return this.prisma.warrant.findMany({
      where: this.propertyWarrantWhere(id),
      orderBy: { createdAt: "desc" },
      include: {
        property: true,
        warrantReport: { include: { files: true, createdBy: { select: { id: true, displayName: true, role: true, avatar: true } } } },
        files: true,
        requestedBy: { select: { id: true, displayName: true, role: true, avatar: true } },
        approvedBy: { select: { id: true, displayName: true, role: true, avatar: true } },
        investigation: { select: { id: true, caseNumber: true, title: true, status: true } }
      }
    });
  }

  public async dossier(id: string, requester: AuthenticatedUser): Promise<unknown> {
    const property = await this.prisma.property.findUnique({
      where: { id },
      select: DOSSIER_PROPERTY_SELECT
    });

    if (property === null) {
      throw new AppError(404, "PROPERTY_NOT_FOUND", "No se encontro la propiedad solicitada.");
    }

    await ensurePropertyAccess(this.prisma, requester, id, "read");

    const [incidents, members] = await Promise.all([
      this.prisma.propertyIncident.findMany({
        where: { propertyId: id },
        orderBy: { sequence: "asc" },
        include: PROPERTY_INCIDENT_INCLUDE
      }),
      this.prisma.propertyMember.findMany({
        where: { propertyId: id },
        orderBy: [{ accessLevel: "desc" }, { addedAt: "asc" }],
        include: PROPERTY_MEMBER_INCLUDE
      })
    ]);

    const organizationsById = new Map<string, NonNullable<(typeof property.subjects)[number]["subject"]["criminalOrganization"]>>();
    property.subjects.forEach((link) => {
      const organization = link.subject.criminalOrganization;
      if (organization !== null) organizationsById.set(organization.id, organization);
    });

    const [canWrite, canManageMembers] = await Promise.all([
      canAccessProperty(this.prisma, requester, id, "write"),
      canAccessProperty(this.prisma, requester, id, "admin")
    ]);

    return {
      property,
      owners: property.subjects,
      organizations: [...organizationsById.values()],
      incidentCount: incidents.length,
      incidents,
      members,
      permissions: {
        canRead: true,
        canWrite,
        canManageMembers
      }
    };
  }

  public async createIncident(id: string, data: CreatePropertyIncidentInput, requester: AuthenticatedUser): Promise<unknown> {
    await this.ensurePropertyExists(id);
    await ensurePropertyAccess(this.prisma, requester, id, "write");
    await this.ensureInvestigationExists(data.investigationId);

    return this.prisma.$transaction(async (transaction) => {
      const sequence = await this.nextIncidentSequence(transaction, id);
      const incident = await transaction.propertyIncident.create({
        data: {
          propertyId: id,
          sequence,
          type: data.type,
          title: data.title,
          description: data.description,
          result: data.result ?? null,
          occurredAt: data.occurredAt,
          origin: IncidentOrigin.MANUAL,
          participatingAgencies: data.participatingAgencies ?? null,
          evidence: data.evidence ?? null,
          personsPresent: data.personsPresent ?? null,
          investigationId: data.investigationId ?? null,
          createdById: requester.id
        },
        include: PROPERTY_INCIDENT_INCLUDE
      });

      await this.createAuditLog(transaction, requester.id, "PROPERTY_INCIDENT_CREATED", "PropertyIncident", incident.id, {
        propertyId: id,
        sequence
      });

      return incident;
    });
  }

  public async updateIncident(id: string, incidentId: string, data: UpdatePropertyIncidentInput, requester: AuthenticatedUser): Promise<unknown> {
    const incident = await this.findIncidentForProperty(id, incidentId);
    await ensurePropertyAccess(this.prisma, requester, id, "write");
    await this.ensureInvestigationExists(data.investigationId);

    if (incident.origin === IncidentOrigin.WARRANT) {
      throw new AppError(409, "WARRANT_INCIDENT_LOCKED", "Los incidentes creados desde una orden se actualizan desde el informe de la orden.");
    }

    const updateData: Prisma.PropertyIncidentUpdateInput = {};

    if (data.type !== undefined) updateData.type = data.type;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.occurredAt !== undefined) updateData.occurredAt = data.occurredAt;
    if (data.result !== undefined) updateData.result = data.result;
    if (data.participatingAgencies !== undefined) updateData.participatingAgencies = data.participatingAgencies;
    if (data.evidence !== undefined) updateData.evidence = data.evidence;
    if (data.personsPresent !== undefined) updateData.personsPresent = data.personsPresent;
    if (data.investigationId !== undefined) updateData.investigation = { connect: { id: data.investigationId } };

    const updated = await this.prisma.propertyIncident.update({
      where: { id: incidentId },
      data: updateData,
      include: PROPERTY_INCIDENT_INCLUDE
    });

    await this.prisma.auditLog.create({
      data: {
        userId: requester.id,
        action: "PROPERTY_INCIDENT_UPDATED",
        entity: "PropertyIncident",
        entityId: incidentId,
        meta: { propertyId: id }
      }
    });

    return updated;
  }

  public async deleteIncident(id: string, incidentId: string, requester: AuthenticatedUser): Promise<void> {
    const incident = await this.findIncidentForProperty(id, incidentId);
    await ensurePropertyAccess(this.prisma, requester, id, "write");

    if (incident.origin === IncidentOrigin.WARRANT) {
      throw new AppError(409, "WARRANT_INCIDENT_LOCKED", "Los incidentes creados desde una orden se conservan como parte del expediente judicial.");
    }

    await this.prisma.$transaction(async (transaction) => {
      await transaction.propertyIncident.delete({ where: { id: incidentId } });
      await this.createAuditLog(transaction, requester.id, "PROPERTY_INCIDENT_DELETED", "PropertyIncident", incidentId, { propertyId: id });
    });
  }

  public async listMembers(id: string, requester: AuthenticatedUser): Promise<unknown[]> {
    await this.ensurePropertyExists(id);
    await ensurePropertyAccess(this.prisma, requester, id, "read");

    return this.prisma.propertyMember.findMany({
      where: { propertyId: id },
      orderBy: [{ accessLevel: "desc" }, { addedAt: "asc" }],
      include: PROPERTY_MEMBER_INCLUDE
    });
  }

  public async upsertMember(id: string, data: UpsertPropertyMemberInput, requester: AuthenticatedUser): Promise<unknown> {
    await this.ensurePropertyExists(id);
    await ensurePropertyAccess(this.prisma, requester, id, "admin");
    await this.ensureUserExists(data.userId);

    const member = await this.prisma.propertyMember.upsert({
      where: { propertyId_userId: { propertyId: id, userId: data.userId } },
      create: {
        propertyId: id,
        userId: data.userId,
        accessLevel: data.accessLevel,
        addedById: requester.id
      },
      update: {
        accessLevel: data.accessLevel
      },
      include: PROPERTY_MEMBER_INCLUDE
    });

    await this.prisma.auditLog.create({
      data: {
        userId: requester.id,
        action: "PROPERTY_MEMBER_UPSERTED",
        entity: "PropertyMember",
        entityId: member.id,
        meta: { propertyId: id, targetUserId: data.userId, accessLevel: data.accessLevel }
      }
    });

    return member;
  }

  public async updateMember(id: string, userId: string, data: UpdatePropertyMemberInput, requester: AuthenticatedUser): Promise<unknown> {
    const property = await this.ensurePropertyExists(id);
    await ensurePropertyAccess(this.prisma, requester, id, "admin");
    const member = await this.findPropertyMember(id, userId);

    if (property.createdById === userId && data.accessLevel !== AccessLevel.ADMIN) {
      throw new AppError(409, "CREATOR_ACCESS_LOCKED", "No se puede reducir el acceso del creador del expediente.");
    }

    if (member.accessLevel === AccessLevel.ADMIN && data.accessLevel !== AccessLevel.ADMIN) {
      await this.ensureAnotherAdminExists(id, userId);
    }

    const updated = await this.prisma.propertyMember.update({
      where: { propertyId_userId: { propertyId: id, userId } },
      data: { accessLevel: data.accessLevel },
      include: PROPERTY_MEMBER_INCLUDE
    });

    await this.prisma.auditLog.create({
      data: {
        userId: requester.id,
        action: "PROPERTY_MEMBER_UPDATED",
        entity: "PropertyMember",
        entityId: updated.id,
        meta: { propertyId: id, targetUserId: userId, accessLevel: data.accessLevel }
      }
    });

    return updated;
  }

  public async removeMember(id: string, userId: string, requester: AuthenticatedUser): Promise<void> {
    const property = await this.ensurePropertyExists(id);
    await ensurePropertyAccess(this.prisma, requester, id, "admin");
    const member = await this.findPropertyMember(id, userId);

    if (property.createdById === userId) {
      throw new AppError(409, "CREATOR_ACCESS_LOCKED", "No se puede quitar al creador del expediente.");
    }

    if (member.accessLevel === AccessLevel.ADMIN) {
      await this.ensureAnotherAdminExists(id, userId);
    }

    await this.prisma.$transaction(async (transaction) => {
      await transaction.propertyMember.delete({ where: { propertyId_userId: { propertyId: id, userId } } });
      await this.createAuditLog(transaction, requester.id, "PROPERTY_MEMBER_REMOVED", "PropertyMember", member.id, {
        propertyId: id,
        targetUserId: userId
      });
    });
  }

  public async timeline(id: string): Promise<TimelineEvent[]> {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: {
        subjects: {
          include: {
            subject: { select: { id: true, firstName: true, lastName: true, updatedAt: true } }
          }
        }
      }
    });

    if (property === null) {
      throw new AppError(404, "PROPERTY_NOT_FOUND", "No se encontro la propiedad solicitada.");
    }

    const [mapElements, warrants, incidents, auditLogs] = await Promise.all([
      this.prisma.mapElement.findMany({
        where: { propertyId: id },
        orderBy: { updatedAt: "desc" },
        take: 30,
        select: {
          id: true,
          label: true,
          type: true,
          investigationId: true,
          updatedAt: true,
          createdBy: { select: { displayName: true } }
        }
      }),
      this.prisma.warrant.findMany({
        where: this.propertyWarrantWhere(id),
        orderBy: { createdAt: "desc" },
        take: 30,
        select: {
          id: true,
          warrantNumber: true,
          title: true,
          status: true,
          createdAt: true,
          requestedBy: { select: { displayName: true } }
        }
      }),
      this.prisma.propertyIncident.findMany({
        where: { propertyId: id },
        orderBy: { occurredAt: "desc" },
        take: 30,
        select: {
          id: true,
          sequence: true,
          title: true,
          type: true,
          occurredAt: true,
          createdBy: { select: { displayName: true } }
        }
      }),
      this.prisma.auditLog.findMany({
        where: { entity: "Property", entityId: id },
        orderBy: { createdAt: "desc" },
        take: 30,
        select: {
          id: true,
          action: true,
          createdAt: true,
          user: { select: { displayName: true } }
        }
      })
    ]);

    return sortTimelineEvents([
      {
        id: `property:${property.id}`,
        type: "map",
        title: property.address,
        description: `Propiedad registrada como ${property.type}.`,
        occurredAt: property.createdAt,
        href: `/mapa?propertyId=${property.id}`,
        actorName: null
      },
      ...property.subjects.map<TimelineEvent>((link) => ({
        id: `subject:${link.subject.id}:${property.id}`,
        type: "investigation",
        title: `${link.subject.firstName} ${link.subject.lastName}`,
        description: `Vinculo: ${link.relation}.`,
        occurredAt: link.subject.updatedAt,
        href: `/sujetos/${link.subject.id}`,
        actorName: null
      })),
      ...incidents.map<TimelineEvent>((incident) => ({
        id: `incident:${incident.id}`,
        type: "investigation",
        title: `Incidente #${incident.sequence}: ${incident.title}`,
        description: `Tipo: ${incident.type}.`,
        occurredAt: incident.occurredAt,
        href: `/propiedades/${property.id}`,
        actorName: incident.createdBy.displayName
      })),
      ...mapElements.map<TimelineEvent>((mapElement) => ({
        id: `map:${mapElement.id}`,
        type: "map",
        title: mapElement.label,
        description: `Punto de mapa: ${mapElement.type}.`,
        occurredAt: mapElement.updatedAt,
        href: mapElement.investigationId !== null ? `/mapa?investigationId=${mapElement.investigationId}` : "/mapa",
        actorName: mapElement.createdBy.displayName
      })),
      ...warrants.map<TimelineEvent>((warrant) => ({
        id: `warrant:${warrant.id}`,
        type: "warrant",
        title: `${warrant.warrantNumber} - ${warrant.title}`,
        description: `Orden en estado ${warrant.status}.`,
        occurredAt: warrant.createdAt,
        href: `/ordenes/${warrant.id}`,
        actorName: warrant.requestedBy.displayName
      })),
      ...auditLogs.map<TimelineEvent>((auditLog) => ({
        id: `audit:${auditLog.id}`,
        type: "audit",
        title: auditLog.action,
        description: "Evento registrado en auditoria.",
        occurredAt: auditLog.createdAt,
        href: null,
        actorName: auditLog.user.displayName
      }))
    ]).slice(0, 60);
  }

  public async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.prisma.property.delete({ where: { id } });
  }

  private async ensurePropertyExists(id: string): Promise<Prisma.PropertyGetPayload<{ select: { id: true; createdById: true } }>> {
    const property = await this.prisma.property.findUnique({
      where: { id },
      select: { id: true, createdById: true }
    });

    if (property === null) {
      throw new AppError(404, "PROPERTY_NOT_FOUND", "No se encontro la propiedad solicitada.");
    }

    return property;
  }

  private async ensureInvestigationExists(investigationId: string | undefined): Promise<void> {
    if (investigationId === undefined) return;

    const investigation = await this.prisma.investigation.findUnique({ where: { id: investigationId }, select: { id: true } });

    if (investigation === null) {
      throw new AppError(404, "INVESTIGATION_NOT_FOUND", "No se encontro la investigacion solicitada.");
    }
  }

  private async ensureUserExists(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, active: true } });

    if (user === null || !user.active) {
      throw new AppError(404, "USER_NOT_FOUND", "No se encontro el fiscal solicitado.");
    }
  }

  private async findIncidentForProperty(propertyId: string, incidentId: string): Promise<Prisma.PropertyIncidentGetPayload<{ select: { id: true; propertyId: true; origin: true } }>> {
    const incident = await this.prisma.propertyIncident.findUnique({
      where: { id: incidentId },
      select: { id: true, propertyId: true, origin: true }
    });

    if (incident === null || incident.propertyId !== propertyId) {
      throw new AppError(404, "PROPERTY_INCIDENT_NOT_FOUND", "No se encontro el incidente solicitado.");
    }

    return incident;
  }

  private async findPropertyMember(propertyId: string, userId: string): Promise<Prisma.PropertyMemberGetPayload<{ select: { id: true; accessLevel: true } }>> {
    const member = await this.prisma.propertyMember.findUnique({
      where: { propertyId_userId: { propertyId, userId } },
      select: { id: true, accessLevel: true }
    });

    if (member === null) {
      throw new AppError(404, "PROPERTY_MEMBER_NOT_FOUND", "No se encontro el miembro solicitado.");
    }

    return member;
  }

  private async ensureAnotherAdminExists(propertyId: string, currentUserId: string): Promise<void> {
    const admins = await this.prisma.propertyMember.count({
      where: {
        propertyId,
        accessLevel: AccessLevel.ADMIN,
        userId: { not: currentUserId }
      }
    });

    if (admins === 0) {
      throw new AppError(409, "LAST_ADMIN_LOCKED", "No se puede quitar el ultimo administrador del expediente.");
    }
  }

  private async nextIncidentSequence(transaction: Prisma.TransactionClient, propertyId: string): Promise<number> {
    const aggregate = await transaction.propertyIncident.aggregate({
      where: { propertyId },
      _max: { sequence: true }
    });

    return (aggregate._max.sequence ?? 0) + 1;
  }

  private async createAuditLog(
    transaction: Prisma.TransactionClient,
    userId: string,
    action: string,
    entity: string,
    entityId: string,
    meta: Prisma.InputJsonObject
  ): Promise<void> {
    await transaction.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        meta
      }
    });
  }

  private propertyWarrantWhere(propertyId: string): Prisma.WarrantWhereInput {
    return {
      type: { in: [WarrantType.ALLANAMIENTO, WarrantType.INCAUTACION] },
      OR: [
        { propertyId },
        {
          propertyId: null,
          investigation: {
            subjects: {
              some: {
                subject: {
                  properties: {
                    some: { propertyId }
                  }
                }
              }
            }
          }
        }
      ]
    };
  }
}
