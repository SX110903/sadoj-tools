import { AppError } from "../../shared/errors/AppError";
import { InvestigationStatus, Prisma, RelationshipType, type PrismaClient, type RelationshipType as PrismaRelationshipType } from "../../shared/prisma";
import { sortTimelineEvents, summarizeText, type TimelineEvent } from "../../shared/timeline";
import { buildPaginationMeta, getPagination, type PaginationMeta } from "../../shared/utils/pagination";
import { canSeeConfidentialNotes } from "../../shared/utils/role";
import type { AuthenticatedUser } from "../../types/fastify";
import type { AssignZoneInput, CreateRelationshipInput, CreateSubjectInput, LinkPropertyInput, LinkVehicleInput, SubjectsQueryInput, UpdateSubjectInput } from "./subjects.schema";

export interface PaginatedSubjects {
  data: unknown[];
  meta: PaginationMeta;
}

const INVERSE_RELATIONSHIP: Readonly<Record<RelationshipType, RelationshipType>> = {
  [RelationshipType.ASSOCIATE]: RelationshipType.ASSOCIATE,
  [RelationshipType.FAMILY]: RelationshipType.FAMILY,
  [RelationshipType.EMPLOYER]: RelationshipType.EMPLOYEE,
  [RelationshipType.EMPLOYEE]: RelationshipType.EMPLOYER,
  [RelationshipType.ACCOMPLICE]: RelationshipType.ACCOMPLICE,
  [RelationshipType.RIVAL]: RelationshipType.RIVAL,
  [RelationshipType.UNKNOWN]: RelationshipType.UNKNOWN
};

export class SubjectsService {
  public constructor(private readonly prisma: PrismaClient) {}

  public async search(query: SubjectsQueryInput): Promise<PaginatedSubjects> {
    const pagination = getPagination(query);
    const where: Prisma.SubjectWhereInput = {};

    if (query.status !== undefined) where.status = query.status;
    if (query.dangerLevel !== undefined) where.dangerLevel = query.dangerLevel;
    if (query.organizationId !== undefined) where.organizationId = query.organizationId;
    if (query.organization !== undefined) {
      where.OR = [
        { organization: { contains: query.organization, mode: "insensitive" } },
        { criminalOrganization: { name: { contains: query.organization, mode: "insensitive" } } },
        { criminalOrganization: { alias: { contains: query.organization, mode: "insensitive" } } }
      ];
    }
    if (query.hasVehicles === true) where.vehicles = { some: {} };
    if (query.q !== undefined) {
      where.OR = [
        { firstName: { contains: query.q, mode: "insensitive" } },
        { lastName: { contains: query.q, mode: "insensitive" } },
        { alias: { contains: query.q, mode: "insensitive" } }
      ];
    }

    const [total, subjects] = await this.prisma.$transaction([
      this.prisma.subject.count({ where }),
      this.prisma.subject.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { investigations: true, vehicles: true, properties: true, documents: true } },
          criminalOrganization: true
        }
      })
    ]);

    return { data: subjects, meta: buildPaginationMeta(total, pagination.page, pagination.limit) };
  }

  public async findById(id: string, requester: AuthenticatedUser): Promise<unknown> {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
      include: {
        vehicles: { include: { vehicle: true } },
        properties: { include: { property: true } },
        relationships: { include: { to: true } },
        zones: { include: { zone: true } },
        investigations: { include: { investigation: { select: { id: true, caseNumber: true, title: true, status: true, leadFiscalId: true } } } },
        _count: { select: { investigations: true, vehicles: true, properties: true, documents: true } },
        criminalOrganization: true,
        mapElements: {
          include: {
            mapElement: {
              include: {
                organization: true,
                property: true
              }
            }
          }
        },
        notes: {
          where: canSeeConfidentialNotes(requester.role) ? {} : { isConfidential: false },
          include: { author: { select: { id: true, displayName: true, role: true, avatar: true } } },
          orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }]
        },
        files: true
      }
    });

    if (subject === null) {
      throw new AppError(404, "SUBJECT_NOT_FOUND", "No se encontró el sujeto solicitado.");
    }

    return subject;
  }

  public async create(data: CreateSubjectInput, createdById: string): Promise<unknown> {
    return this.prisma.subject.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        alias: data.alias ?? null,
        dateOfBirth: data.dateOfBirth ?? null,
        nationality: data.nationality ?? null,
        occupation: data.occupation ?? null,
        phone: data.phone ?? null,
        address: data.address ?? null,
        photo: data.photoUrl ?? null,
        dangerLevel: data.dangerLevel,
        status: data.status,
        isOrganized: data.isOrganized,
        organization: data.organization ?? null,
        organizationId: data.organizationId ?? null,
        createdById
      }
    });
  }

  public async update(id: string, data: UpdateSubjectInput): Promise<unknown> {
    await this.ensureSubject(id);
    const updateData: Prisma.SubjectUpdateInput = {};

    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.alias !== undefined) updateData.alias = data.alias;
    if (data.dateOfBirth !== undefined) updateData.dateOfBirth = data.dateOfBirth;
    if (data.nationality !== undefined) updateData.nationality = data.nationality;
    if (data.occupation !== undefined) updateData.occupation = data.occupation;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.photoUrl !== undefined) updateData.photo = data.photoUrl;
    if (data.dangerLevel !== undefined) updateData.dangerLevel = data.dangerLevel;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.isOrganized !== undefined) updateData.isOrganized = data.isOrganized;
    if (data.organization !== undefined) updateData.organization = data.organization;
    if (data.organizationId !== undefined) updateData.criminalOrganization = { connect: { id: data.organizationId } };

    return this.prisma.subject.update({ where: { id }, data: updateData });
  }

  public async delete(id: string): Promise<void> {
    await this.ensureSubject(id);
    const activeInvestigationCount = await this.prisma.investigationSubject.count({
      where: {
        subjectId: id,
        investigation: {
          status: {
            notIn: [InvestigationStatus.CLOSED_DISMISSED, InvestigationStatus.CLOSED_SUCCESSFUL]
          }
        }
      }
    });

    if (activeInvestigationCount > 0) {
      throw new AppError(409, "SUBJECT_HAS_ACTIVE_INVESTIGATIONS", "No puedes eliminar un sujeto con investigaciones activas.");
    }

    await this.prisma.subject.delete({ where: { id } });
  }

  public async updatePhoto(id: string, photoUrl: string): Promise<unknown> {
    await this.ensureSubject(id);

    return this.prisma.subject.update({
      where: { id },
      data: { photo: photoUrl }
    });
  }

  public async timeline(id: string, requester: AuthenticatedUser): Promise<TimelineEvent[]> {
    await this.ensureSubject(id);
    const [documents, notes, files, auditLogs, investigations] = await Promise.all([
      this.prisma.document.findMany({
        where: { subjectId: id },
        orderBy: { updatedAt: "desc" },
        take: 30,
        select: {
          id: true,
          documentNumber: true,
          title: true,
          status: true,
          updatedAt: true,
          createdBy: { select: { displayName: true } }
        }
      }),
      this.prisma.note.findMany({
        where: { subjectId: id, ...(canSeeConfidentialNotes(requester.role) ? {} : { isConfidential: false }) },
        orderBy: { createdAt: "desc" },
        take: 30,
        select: {
          id: true,
          content: true,
          isConfidential: true,
          createdAt: true,
          author: { select: { displayName: true } }
        }
      }),
      this.prisma.file.findMany({
        where: { subjectId: id },
        orderBy: { createdAt: "desc" },
        take: 30,
        select: {
          id: true,
          originalName: true,
          mimeType: true,
          url: true,
          createdAt: true,
          uploadedBy: { select: { displayName: true } }
        }
      }),
      this.prisma.auditLog.findMany({
        where: { entity: "Subject", entityId: id },
        orderBy: { createdAt: "desc" },
        take: 30,
        select: {
          id: true,
          action: true,
          createdAt: true,
          user: { select: { displayName: true } }
        }
      }),
      this.prisma.investigationSubject.findMany({
        where: { subjectId: id },
        orderBy: { investigation: { updatedAt: "desc" } },
        take: 30,
        include: {
          investigation: {
            select: {
              id: true,
              caseNumber: true,
              title: true,
              status: true,
              updatedAt: true
            }
          }
        }
      })
    ]);

    return sortTimelineEvents([
      ...investigations.map<TimelineEvent>((item) => ({
        id: `investigation:${item.investigation.id}`,
        type: "investigation",
        title: `${item.investigation.caseNumber} - ${item.investigation.title}`,
        description: `Vinculado como ${item.role}. Estado: ${item.investigation.status}.`,
        occurredAt: item.investigation.updatedAt,
        href: `/investigaciones/${item.investigation.id}`,
        actorName: null
      })),
      ...documents.map<TimelineEvent>((document) => ({
        id: `document:${document.id}`,
        type: "document",
        title: `${document.documentNumber} - ${document.title}`,
        description: `Documento en estado ${document.status}.`,
        occurredAt: document.updatedAt,
        href: `/documentos/${document.id}`,
        actorName: document.createdBy.displayName
      })),
      ...notes.map<TimelineEvent>((note) => ({
        id: `note:${note.id}`,
        type: "note",
        title: note.isConfidential ? "Nota confidencial" : "Nota",
        description: summarizeText(note.content),
        occurredAt: note.createdAt,
        href: null,
        actorName: note.author.displayName
      })),
      ...files.map<TimelineEvent>((file) => ({
        id: `file:${file.id}`,
        type: "file",
        title: file.originalName,
        description: file.mimeType,
        occurredAt: file.createdAt,
        href: file.url,
        actorName: file.uploadedBy.displayName
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

  public async linkVehicle(id: string, data: LinkVehicleInput): Promise<unknown> {
    await this.ensureSubject(id);
    await this.prisma.vehicle.findUniqueOrThrow({ where: { id: data.vehicleId } });

    return this.prisma.subjectVehicle.upsert({
      where: { subjectId_vehicleId: { subjectId: id, vehicleId: data.vehicleId } },
      update: { relation: data.relation },
      create: { subjectId: id, vehicleId: data.vehicleId, relation: data.relation },
      include: { vehicle: true }
    });
  }

  public async unlinkVehicle(id: string, vehicleId: string): Promise<void> {
    await this.prisma.subjectVehicle.delete({ where: { subjectId_vehicleId: { subjectId: id, vehicleId } } });
  }

  public async linkProperty(id: string, data: LinkPropertyInput): Promise<unknown> {
    await this.ensureSubject(id);
    await this.prisma.property.findUniqueOrThrow({ where: { id: data.propertyId } });

    return this.prisma.subjectProperty.upsert({
      where: { subjectId_propertyId: { subjectId: id, propertyId: data.propertyId } },
      update: { relation: data.relation },
      create: { subjectId: id, propertyId: data.propertyId, relation: data.relation },
      include: { property: true }
    });
  }

  public async unlinkProperty(id: string, propertyId: string): Promise<void> {
    await this.prisma.subjectProperty.delete({ where: { subjectId_propertyId: { subjectId: id, propertyId } } });
  }

  public async addRelationship(id: string, data: CreateRelationshipInput): Promise<unknown> {
    if (id === data.toSubjectId) {
      throw new AppError(400, "INVALID_RELATIONSHIP", "No puedes relacionar un sujeto consigo mismo.");
    }

    await this.ensureSubject(id);
    await this.ensureSubject(data.toSubjectId);
    const inverseType = INVERSE_RELATIONSHIP[data.type];

    return this.prisma.$transaction(async (transaction) => {
      const relationship = await transaction.subjectRelationship.upsert({
        where: { fromId_toId: { fromId: id, toId: data.toSubjectId } },
        update: {
          type: data.type as PrismaRelationshipType,
          description: data.description ?? null,
          strength: data.strength
        },
        create: {
          fromId: id,
          toId: data.toSubjectId,
          type: data.type as PrismaRelationshipType,
          description: data.description ?? null,
          strength: data.strength
        },
        include: { to: true }
      });

      await transaction.subjectRelationship.upsert({
        where: { fromId_toId: { fromId: data.toSubjectId, toId: id } },
        update: {
          type: inverseType as PrismaRelationshipType,
          description: data.description ?? null,
          strength: data.strength
        },
        create: {
          fromId: data.toSubjectId,
          toId: id,
          type: inverseType as PrismaRelationshipType,
          description: data.description ?? null,
          strength: data.strength
        }
      });

      return relationship;
    });
  }

  public async removeRelationship(relationshipId: string): Promise<void> {
    const relationship = await this.prisma.subjectRelationship.findUniqueOrThrow({ where: { id: relationshipId } });

    await this.prisma.$transaction([
      this.prisma.subjectRelationship.deleteMany({
        where: {
          OR: [
            { fromId: relationship.fromId, toId: relationship.toId },
            { fromId: relationship.toId, toId: relationship.fromId }
          ]
        }
      })
    ]);
  }

  public async assignZone(id: string, data: AssignZoneInput): Promise<unknown> {
    await this.ensureSubject(id);
    await this.prisma.zone.findUniqueOrThrow({ where: { id: data.zoneId } });

    return this.prisma.subjectZone.upsert({
      where: { subjectId_zoneId: { subjectId: id, zoneId: data.zoneId } },
      update: { frequency: data.frequency ?? null, lastSeenAt: data.lastSeenAt ?? null },
      create: { subjectId: id, zoneId: data.zoneId, frequency: data.frequency ?? null, lastSeenAt: data.lastSeenAt ?? null },
      include: { zone: true }
    });
  }

  public async removeZone(id: string, zoneId: string): Promise<void> {
    await this.prisma.subjectZone.delete({ where: { subjectId_zoneId: { subjectId: id, zoneId } } });
  }

  private async ensureSubject(id: string): Promise<void> {
    const subject = await this.prisma.subject.findUnique({ where: { id } });

    if (subject === null) {
      throw new AppError(404, "SUBJECT_NOT_FOUND", "No se encontró el sujeto solicitado.");
    }
  }
}
