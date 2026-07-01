import { hasPermission, Permission } from "@sadoj/shared";
import { AppError } from "../../shared/errors/AppError";
import {
  AccessLevel,
  InvestigationStatus,
  NotificationType,
  Prisma,
  type AccessLevel as PrismaAccessLevel,
  type InvestigationStatus as PrismaInvestigationStatus,
  type PrismaClient
} from "../../shared/prisma";
import { sortTimelineEvents, summarizeText, type TimelineEvent } from "../../shared/timeline";
import { generateCaseNumber } from "../../shared/utils/case-number";
import { withUniqueRetry } from "../../shared/utils/retry";
import { buildPaginationMeta, getPagination, type PaginationMeta } from "../../shared/utils/pagination";
import { canSeeConfidentialNotes } from "../../shared/utils/role";
import type { AuthenticatedUser } from "../../types/fastify";
import { NotificationsService } from "../notifications/notifications.service";
import type { CreateInvestigationInput, InvestigationsQueryInput, LinkSubjectInput, ShareInvestigationInput, UpdateInvestigationInput } from "./investigations.schema";

export interface PaginatedInvestigations {
  data: InvestigationListItem[];
  meta: PaginationMeta;
}

export type DatalinkNodeType = "subject" | "organization" | "property" | "vehicle" | "document" | "mapElement";
export type DatalinkEdgeType = "member_of" | "owns" | "linked_to" | "related" | "documented_in" | "mapped_in";

export interface DatalinkNode {
  id: string;
  type: DatalinkNodeType;
  label: string;
  meta: Record<string, string | number | boolean | null>;
  href: string;
}

export interface DatalinkEdge {
  id: string;
  source: string;
  target: string;
  type: DatalinkEdgeType;
  label: string;
}

export interface DatalinkGraph {
  nodes: DatalinkNode[];
  edges: DatalinkEdge[];
}

export interface InvestigationListItem {
  id: string;
  caseNumber: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  type: string;
  legalBasis: string | null;
  startDate: Date;
  closeDate: Date | null;
  leadFiscalId: string;
  createdAt: Date;
  updatedAt: Date;
  leadFiscal: {
    id: string;
    displayName: string;
    role: string;
    avatar: string | null;
  };
  counts: {
    participants: number;
    subjects: number;
  };
}

export class InvestigationsService {
  public constructor(private readonly prisma: PrismaClient) {}

  public async findAll(requester: AuthenticatedUser, query: InvestigationsQueryInput): Promise<PaginatedInvestigations> {
    const pagination = getPagination(query);
    const where: Prisma.InvestigationWhereInput = {};
    const accessWhere = this.buildAccessWhere(requester, query.search);

    if (query.status !== undefined) where.status = query.status;
    if (query.type !== undefined) where.type = query.type;
    if (query.priority !== undefined) where.priority = query.priority;
    if (accessWhere !== undefined) where.OR = accessWhere;

    const [total, investigations] = await this.prisma.$transaction([
      this.prisma.investigation.count({ where }),
      this.prisma.investigation.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: "desc" },
        include: {
          leadFiscal: { select: { id: true, displayName: true, role: true, avatar: true } },
          _count: { select: { participants: true, subjects: true } }
        }
      })
    ]);

    return {
      data: investigations.map((investigation) => ({
        ...investigation,
        counts: {
          participants: investigation._count.participants,
          subjects: investigation._count.subjects
        }
      })),
      meta: buildPaginationMeta(total, pagination.page, pagination.limit)
    };
  }

  public async findById(id: string, requester: AuthenticatedUser): Promise<unknown> {
    await this.ensureAccess(id, requester);

    const investigation = await this.prisma.investigation.findUnique({
      where: { id },
      include: {
        leadFiscal: { select: { id: true, displayName: true, role: true, avatar: true } },
        participants: { include: { user: { select: { id: true, displayName: true, role: true, avatar: true, badgeNumber: true } } } },
        subjects: { include: { subject: true } },
        chatRoom: true,
        _count: { select: { warrants: true, files: true, notes: true, documents: true, subjects: true, participants: true } }
      }
    });

    if (investigation === null) {
      throw new AppError(404, "INVESTIGATION_NOT_FOUND", "No se encontró la investigación solicitada.");
    }

    return investigation;
  }

  public async create(data: CreateInvestigationInput, requester: AuthenticatedUser): Promise<unknown> {
    return withUniqueRetry(() => this.createInvestigation(data, requester), ["caseNumber"]);
  }

  private async createInvestigation(data: CreateInvestigationInput, requester: AuthenticatedUser): Promise<unknown> {
    const caseNumber = await generateCaseNumber(this.prisma);

    return this.prisma.$transaction(async (transaction) => {
      const investigation = await transaction.investigation.create({
        data: {
          caseNumber,
          title: data.title,
          description: data.description,
          type: data.type,
          priority: data.priority,
          legalBasis: data.legalBasis ?? null,
          leadFiscalId: requester.id,
          participants: {
            create: {
              userId: requester.id,
              accessLevel: AccessLevel.ADMIN
            }
          },
          chatRoom: {
            create: {}
          }
        },
        include: {
          leadFiscal: { select: { id: true, displayName: true, role: true, avatar: true } },
          chatRoom: true,
          participants: true
        }
      });

      await transaction.auditLog.create({
        data: {
          userId: requester.id,
          action: "CREATE_INVESTIGATION",
          entity: "Investigation",
          entityId: investigation.id,
          investigationId: investigation.id
        }
      });

      return investigation;
    });
  }

  public async update(id: string, data: UpdateInvestigationInput, requester: AuthenticatedUser): Promise<unknown> {
    await this.ensureCanEdit(id, requester);
    const current = await this.prisma.investigation.findUnique({
      where: { id },
      select: {
        id: true,
        caseNumber: true,
        title: true,
        status: true,
        leadFiscalId: true,
        participants: { select: { userId: true } }
      }
    });

    const updateData: Prisma.InvestigationUpdateInput = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.legalBasis !== undefined) updateData.legalBasis = data.legalBasis;
    if (data.status !== undefined) updateData.status = data.status as PrismaInvestigationStatus;

    const investigation = await this.prisma.investigation.update({
      where: { id },
      data: updateData,
      include: { leadFiscal: { select: { id: true, displayName: true, role: true, avatar: true } } }
    });

    if (current !== null && data.status !== undefined && current.status !== data.status) {
      const recipientIds = [current.leadFiscalId, ...current.participants.map((participant) => participant.userId)];
      await new NotificationsService(this.prisma).notifyMany(recipientIds, {
        actorId: requester.id,
        type: NotificationType.INVESTIGATION_UPDATED,
        title: "InvestigaciÃ³n actualizada",
        message: `${current.caseNumber} cambiÃ³ de estado a ${data.status}.`,
        link: `/investigaciones/${id}`,
        meta: { investigationId: id, previousStatus: current.status, status: data.status }
      });
    }

    return investigation;
  }

  public async closeAsDismissed(id: string, requester: AuthenticatedUser): Promise<unknown> {
    if (!hasPermission(requester.role, Permission.DELETE_INVESTIGATION)) {
      throw new AppError(403, "FORBIDDEN", "No tienes permisos para cerrar esta investigación.");
    }

    await this.ensureAccess(id, requester);

    return this.prisma.investigation.update({
      where: { id },
      data: {
        status: InvestigationStatus.CLOSED_DISMISSED,
        closeDate: new Date()
      }
    });
  }

  public async share(id: string, data: ShareInvestigationInput, requester: AuthenticatedUser): Promise<unknown> {
    if (!hasPermission(requester.role, Permission.SHARE_INVESTIGATION)) {
      throw new AppError(403, "FORBIDDEN", "No tienes permisos para compartir investigaciones.");
    }

    await this.ensureAccess(id, requester);
    await this.prisma.user.findUniqueOrThrow({ where: { id: data.userId } });

    const participant = await this.prisma.investigationParticipant.upsert({
      where: { investigationId_userId: { investigationId: id, userId: data.userId } },
      update: { accessLevel: data.accessLevel as PrismaAccessLevel },
      create: {
        investigationId: id,
        userId: data.userId,
        accessLevel: data.accessLevel as PrismaAccessLevel,
        addedById: requester.id
      },
      include: { user: { select: { id: true, displayName: true, role: true, avatar: true } } }
    });

    const investigation = await this.prisma.investigation.findUnique({
      where: { id },
      select: { caseNumber: true, title: true }
    });

    await new NotificationsService(this.prisma).notify({
      recipientId: data.userId,
      actorId: requester.id,
      type: NotificationType.INVESTIGATION_ASSIGNED,
      title: "Nueva asignaciÃ³n",
      message: `${investigation?.caseNumber ?? "Una investigaciÃ³n"} fue asignada a tu despacho.`,
      link: `/investigaciones/${id}`,
      meta: { investigationId: id, accessLevel: data.accessLevel }
    });

    return participant;
  }

  public async revokeAccess(id: string, userId: string, requester: AuthenticatedUser): Promise<void> {
    if (!hasPermission(requester.role, Permission.SHARE_INVESTIGATION)) {
      throw new AppError(403, "FORBIDDEN", "No tienes permisos para revocar accesos.");
    }

    const investigation = await this.prisma.investigation.findUniqueOrThrow({ where: { id } });

    if (investigation.leadFiscalId === userId) {
      throw new AppError(400, "LEAD_FISCAL_REQUIRED", "No puedes revocar al fiscal líder.");
    }

    await this.ensureAccess(id, requester);
    await this.prisma.investigationParticipant.delete({
      where: { investigationId_userId: { investigationId: id, userId } }
    });
  }

  public async linkSubject(id: string, data: LinkSubjectInput, requester: AuthenticatedUser): Promise<unknown> {
    await this.ensureCanEdit(id, requester);
    await this.prisma.subject.findUniqueOrThrow({ where: { id: data.subjectId } });

    return this.prisma.investigationSubject.upsert({
      where: { investigationId_subjectId: { investigationId: id, subjectId: data.subjectId } },
      update: { role: data.role, notes: data.notes ?? null },
      create: {
        investigationId: id,
        subjectId: data.subjectId,
        role: data.role,
        notes: data.notes ?? null
      },
      include: { subject: true }
    });
  }

  public async unlinkSubject(id: string, subjectId: string, requester: AuthenticatedUser): Promise<void> {
    await this.ensureCanEdit(id, requester);
    await this.prisma.investigationSubject.delete({
      where: { investigationId_subjectId: { investigationId: id, subjectId } }
    });
  }

  public async listParticipants(id: string, requester: AuthenticatedUser): Promise<unknown> {
    await this.ensureAccess(id, requester);
    return this.prisma.investigationParticipant.findMany({
      where: { investigationId: id },
      include: { user: { select: { id: true, displayName: true, role: true, avatar: true, badgeNumber: true } } },
      orderBy: { addedAt: "asc" }
    });
  }

  public async listSubjects(id: string, requester: AuthenticatedUser): Promise<unknown> {
    await this.ensureAccess(id, requester);
    return this.prisma.investigationSubject.findMany({
      where: { investigationId: id },
      include: { subject: true },
      orderBy: { addedAt: "desc" }
    });
  }

  public async getDatalink(id: string, requester: AuthenticatedUser): Promise<DatalinkGraph> {
    await this.ensureAccess(id, requester);

    const investigation = await this.prisma.investigation.findUnique({
      where: { id },
      include: {
        subjects: {
          include: {
            subject: {
              include: {
                criminalOrganization: true,
                properties: { include: { property: true } },
                vehicles: { include: { vehicle: true } },
                relationships: { include: { to: true } },
                relatedTo: { include: { from: true } }
              }
            }
          }
        },
        documents: {
          include: {
            subject: { select: { id: true, firstName: true, lastName: true } }
          }
        },
        mapElements: {
          include: {
            organization: true,
            property: true,
            linkedSubjects: { include: { subject: true } }
          }
        }
      }
    });

    if (investigation === null) {
      throw new AppError(404, "INVESTIGATION_NOT_FOUND", "No se encontro la investigacion solicitada.");
    }

    const nodes = new Map<string, DatalinkNode>();
    const edges = new Map<string, DatalinkEdge>();
    const investigationSubjectIds = new Set(investigation.subjects.map((item) => item.subjectId));

    const addNode = (node: DatalinkNode): void => {
      if (!nodes.has(node.id)) nodes.set(node.id, node);
    };

    const addEdge = (edge: Omit<DatalinkEdge, "id">): void => {
      const edgeId = `${edge.source}->${edge.target}:${edge.type}:${edge.label}`;
      if (!edges.has(edgeId)) edges.set(edgeId, { ...edge, id: edgeId });
    };

    for (const item of investigation.subjects) {
      const subject = item.subject;
      const subjectNodeId = `subject:${subject.id}`;
      addNode({
        id: subjectNodeId,
        type: "subject",
        label: `${subject.firstName} ${subject.lastName}`,
        href: `/sujetos/${subject.id}`,
        meta: {
          alias: subject.alias,
          dangerLevel: subject.dangerLevel,
          status: subject.status,
          role: item.role,
          photo: subject.photo
        }
      });

      if (subject.criminalOrganization !== null) {
        const organizationNodeId = `organization:${subject.criminalOrganization.id}`;
        addNode({
          id: organizationNodeId,
          type: "organization",
          label: subject.criminalOrganization.name,
          href: `/organizaciones/${subject.criminalOrganization.id}`,
          meta: {
            alias: subject.criminalOrganization.alias,
            color: subject.criminalOrganization.color,
            type: subject.criminalOrganization.type,
            active: subject.criminalOrganization.active
          }
        });
        addEdge({ source: subjectNodeId, target: organizationNodeId, type: "member_of", label: "miembro de" });
      } else if (subject.organization !== null) {
        const organizationNodeId = `organization:name:${subject.organization}`;
        addNode({
          id: organizationNodeId,
          type: "organization",
          label: subject.organization,
          href: "/organizaciones",
          meta: { alias: null, color: "#8b9db5", type: "OTHER", active: true }
        });
        addEdge({ source: subjectNodeId, target: organizationNodeId, type: "member_of", label: "miembro de" });
      }

      for (const propertyLink of subject.properties) {
        const property = propertyLink.property;
        const propertyNodeId = `property:${property.id}`;
        addNode({
          id: propertyNodeId,
          type: "property",
          label: property.address,
          href: `/propiedades/${property.id}`,
          meta: {
            type: property.type,
            zone: property.zone,
            relation: propertyLink.relation,
            gtaX: property.gtaX,
            gtaY: property.gtaY
          }
        });
        addEdge({ source: subjectNodeId, target: propertyNodeId, type: "owns", label: propertyLink.relation });
      }

      for (const vehicleLink of subject.vehicles) {
        const vehicle = vehicleLink.vehicle;
        const vehicleNodeId = `vehicle:${vehicle.id}`;
        addNode({
          id: vehicleNodeId,
          type: "vehicle",
          label: `${vehicle.plate} - ${vehicle.brand} ${vehicle.model}`,
          href: `/sujetos/${subject.id}`,
          meta: {
            plate: vehicle.plate,
            brand: vehicle.brand,
            model: vehicle.model,
            color: vehicle.color,
            relation: vehicleLink.relation
          }
        });
        addEdge({ source: subjectNodeId, target: vehicleNodeId, type: "owns", label: vehicleLink.relation });
      }

      for (const relationship of subject.relationships) {
        if (!investigationSubjectIds.has(relationship.toId)) continue;
        const targetNodeId = `subject:${relationship.toId}`;
        addEdge({ source: subjectNodeId, target: targetNodeId, type: "related", label: relationship.type });
      }

      for (const relationship of subject.relatedTo) {
        if (!investigationSubjectIds.has(relationship.fromId)) continue;
        const sourceNodeId = `subject:${relationship.fromId}`;
        addEdge({ source: sourceNodeId, target: subjectNodeId, type: "related", label: relationship.type });
      }
    }

    for (const document of investigation.documents) {
      const documentNodeId = `document:${document.id}`;
      addNode({
        id: documentNodeId,
        type: "document",
        label: document.title,
        href: `/documentos/${document.id}`,
        meta: {
          documentNumber: document.documentNumber,
          status: document.status,
          type: document.type,
          subjectId: document.subjectId
        }
      });

      if (document.subjectId !== null) {
        addEdge({ source: `subject:${document.subjectId}`, target: documentNodeId, type: "documented_in", label: "documentado en" });
      }
    }

    for (const mapElement of investigation.mapElements) {
      const mapNodeId = `mapElement:${mapElement.id}`;
      addNode({
        id: mapNodeId,
        type: "mapElement",
        label: mapElement.label,
        href: `/mapa?investigationId=${id}`,
        meta: {
          legendNumber: mapElement.legendNumber,
          color: mapElement.color,
          elementType: mapElement.type,
          organizationId: mapElement.organizationId,
          propertyId: mapElement.propertyId
        }
      });

      if (mapElement.organizationId !== null) {
        addEdge({ source: mapNodeId, target: `organization:${mapElement.organizationId}`, type: "mapped_in", label: "ubicacion vinculada" });
      }

      if (mapElement.propertyId !== null) {
        addEdge({ source: mapNodeId, target: `property:${mapElement.propertyId}`, type: "mapped_in", label: "ubicacion vinculada" });
      }

      for (const link of mapElement.linkedSubjects) {
        addEdge({ source: mapNodeId, target: `subject:${link.subjectId}`, type: "mapped_in", label: link.role ?? "ubicacion vinculada" });
      }
    }

    return {
      nodes: Array.from(nodes.values()),
      edges: Array.from(edges.values())
    };
  }

  public async timeline(id: string, requester: AuthenticatedUser): Promise<TimelineEvent[]> {
    await this.ensureAccess(id, requester);
    const [investigation, documents, notes, files, warrants, mapElements, auditLogs] = await Promise.all([
      this.prisma.investigation.findUnique({
        where: { id },
        include: {
          leadFiscal: { select: { displayName: true } },
          subjects: {
            include: {
              subject: { select: { id: true, firstName: true, lastName: true, updatedAt: true } }
            }
          }
        }
      }),
      this.prisma.document.findMany({
        where: { investigationId: id },
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
        where: { investigationId: id, ...(canSeeConfidentialNotes(requester.role) ? {} : { isConfidential: false }) },
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
        where: { investigationId: id },
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
      this.prisma.warrant.findMany({
        where: { investigationId: id },
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
      this.prisma.mapElement.findMany({
        where: { investigationId: id },
        orderBy: { updatedAt: "desc" },
        take: 30,
        select: {
          id: true,
          label: true,
          type: true,
          updatedAt: true,
          createdBy: { select: { displayName: true } }
        }
      }),
      this.prisma.auditLog.findMany({
        where: { investigationId: id },
        orderBy: { createdAt: "desc" },
        take: 30,
        select: {
          id: true,
          action: true,
          entity: true,
          createdAt: true,
          user: { select: { displayName: true } }
        }
      })
    ]);

    if (investigation === null) {
      throw new AppError(404, "INVESTIGATION_NOT_FOUND", "No se encontró la investigación solicitada.");
    }

    return sortTimelineEvents([
      {
        id: `investigation:${investigation.id}:created`,
        type: "investigation",
        title: `${investigation.caseNumber} - ${investigation.title}`,
        description: `Investigación creada con prioridad ${investigation.priority}.`,
        occurredAt: investigation.createdAt,
        href: `/investigaciones/${investigation.id}`,
        actorName: investigation.leadFiscal.displayName
      },
      ...investigation.subjects.map<TimelineEvent>((item) => ({
        id: `subject:${item.subject.id}:${investigation.id}`,
        type: "investigation",
        title: `${item.subject.firstName} ${item.subject.lastName}`,
        description: `Sujeto vinculado como ${item.role}.`,
        occurredAt: item.subject.updatedAt,
        href: `/sujetos/${item.subject.id}`,
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
      ...warrants.map<TimelineEvent>((warrant) => ({
        id: `warrant:${warrant.id}`,
        type: "warrant",
        title: `${warrant.warrantNumber} - ${warrant.title}`,
        description: `Orden en estado ${warrant.status}.`,
        occurredAt: warrant.createdAt,
        href: `/ordenes/${warrant.id}`,
        actorName: warrant.requestedBy.displayName
      })),
      ...mapElements.map<TimelineEvent>((mapElement) => ({
        id: `map:${mapElement.id}`,
        type: "map",
        title: mapElement.label,
        description: `Punto de mapa: ${mapElement.type}.`,
        occurredAt: mapElement.updatedAt,
        href: `/mapa?investigationId=${investigation.id}`,
        actorName: mapElement.createdBy.displayName
      })),
      ...auditLogs.map<TimelineEvent>((auditLog) => ({
        id: `audit:${auditLog.id}`,
        type: "audit",
        title: auditLog.action,
        description: `Entidad: ${auditLog.entity}.`,
        occurredAt: auditLog.createdAt,
        href: null,
        actorName: auditLog.user.displayName
      }))
    ]).slice(0, 80);
  }

  private buildAccessWhere(requester: AuthenticatedUser, search: string | undefined): Prisma.InvestigationWhereInput[] | undefined {
    const searchWhere: Prisma.InvestigationWhereInput[] =
      search === undefined
        ? []
        : [
            { caseNumber: { contains: search, mode: "insensitive" } },
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } }
          ];

    if (hasPermission(requester.role, Permission.VIEW_ALL_INVESTIGATIONS)) {
      return searchWhere.length === 0 ? undefined : searchWhere;
    }

    const accessWhere: Prisma.InvestigationWhereInput[] = [
      { leadFiscalId: requester.id },
      { participants: { some: { userId: requester.id } } }
    ];

    if (searchWhere.length === 0) {
      return accessWhere;
    }

    return searchWhere.map((searchClause) => ({ AND: [{ OR: accessWhere }, searchClause] }));
  }

  private async ensureCanEdit(id: string, requester: AuthenticatedUser): Promise<void> {
    if (!hasPermission(requester.role, Permission.EDIT_INVESTIGATION)) {
      throw new AppError(403, "FORBIDDEN", "No tienes permisos para editar investigaciones.");
    }

    await this.ensureAccess(id, requester);
  }

  private async ensureAccess(id: string, requester: AuthenticatedUser): Promise<void> {
    const investigation = await this.prisma.investigation.findUnique({
      where: { id },
      include: { participants: { where: { userId: requester.id } } }
    });

    if (investigation === null) {
      throw new AppError(404, "INVESTIGATION_NOT_FOUND", "No se encontró la investigación solicitada.");
    }

    const canViewAll = hasPermission(requester.role, Permission.VIEW_ALL_INVESTIGATIONS);
    const isLead = investigation.leadFiscalId === requester.id;
    const isParticipant = investigation.participants.length > 0;

    if (!canViewAll && !isLead && !isParticipant) {
      throw new AppError(403, "INVESTIGATION_ACCESS_DENIED", "No tienes acceso a esta investigación.");
    }
  }
}
