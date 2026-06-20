import { hasPermission, Permission, ROLE_LEVEL, RoleType } from "@sadoj/shared";
import { AppError } from "../../shared/errors/AppError";
import { MapDrawingType, MapElementType, Prisma, WarrantStatus, WarrantType, type PrismaClient } from "../../shared/prisma";
import type { AuthenticatedUser } from "../../types/fastify";
import type {
  CreateMapDrawingInput,
  CreateMapElementInput,
  LinkMapElementSubjectInput,
  MapElementsQueryInput,
  UpdateMapDrawingInput,
  UpdateMapElementInput
} from "./map.schema";

const SUBJECT_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  alias: true,
  status: true,
  dangerLevel: true
} satisfies Prisma.SubjectSelect;

const MAP_DRAWING_INCLUDE = {
  createdBy: { select: { id: true, displayName: true, role: true, avatar: true } }
} satisfies Prisma.MapDrawingInclude;

const MAP_ELEMENT_INCLUDE = {
  organization: true,
  property: {
    include: {
      subjects: {
        include: { subject: { select: SUBJECT_SELECT } }
      }
    }
  },
  linkedSubjects: {
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
          organization: true,
          organizationId: true
        }
      }
    }
  },
  createdBy: { select: { id: true, displayName: true, role: true, avatar: true } }
} satisfies Prisma.MapElementInclude;

type SubjectLink = {
  subjectId: string;
  role?: string | undefined;
};

export class MapService {
  public constructor(private readonly prisma: PrismaClient) {}

  public async findProperties(): Promise<unknown[]> {
    const properties = await this.prisma.property.findMany({
      where: {
        gtaX: { not: null },
        gtaY: { not: null }
      },
      orderBy: { address: "asc" },
      include: {
        subjects: {
          include: { subject: { select: SUBJECT_SELECT } }
        }
      }
    });

    return Promise.all(
      properties.map(async (property) => {
        const operationsCount = await this.prisma.warrant.count({
          where: {
            status: WarrantStatus.EXECUTED,
            type: { in: [WarrantType.ALLANAMIENTO, WarrantType.INCAUTACION] },
            investigation: {
              subjects: {
                some: {
                  subject: {
                    properties: {
                      some: { propertyId: property.id }
                    }
                  }
                }
              }
            }
          }
        });

        return { ...property, operationsCount };
      })
    );
  }

  public async findZones(): Promise<unknown[]> {
    return this.prisma.zone.findMany({
      where: { coordsJson: { not: null } },
      orderBy: [{ district: "asc" }, { name: "asc" }],
      include: {
        _count: { select: { subjects: true } },
        subjects: {
          include: {
            subject: { select: SUBJECT_SELECT }
          }
        }
      }
    });
  }

  public async findInvestigationMap(investigationId: string, requester: AuthenticatedUser): Promise<unknown> {
    await this.ensureInvestigationAccess(investigationId, requester);

    const [drawings, elements, properties] = await this.prisma.$transaction([
      this.prisma.mapDrawing.findMany({
        where: { investigationId },
        orderBy: { createdAt: "desc" },
        include: MAP_DRAWING_INCLUDE
      }),
      this.prisma.mapElement.findMany({
        where: { investigationId },
        orderBy: { legendNumber: "asc" },
        include: MAP_ELEMENT_INCLUDE
      }),
      this.prisma.property.findMany({
        where: {
          gtaX: { not: null },
          gtaY: { not: null },
          subjects: {
            some: {
              subject: {
                investigations: {
                  some: { investigationId }
                }
              }
            }
          }
        },
        orderBy: { address: "asc" },
        include: {
          subjects: {
            include: { subject: { select: SUBJECT_SELECT } }
          }
        }
      })
    ]);

    return { drawings, elements, properties };
  }

  public async findElements(query: MapElementsQueryInput, requester: AuthenticatedUser): Promise<unknown[]> {
    const where: Prisma.MapElementWhereInput = {};

    if (query.investigationId !== undefined) {
      await this.ensureInvestigationAccess(query.investigationId, requester);
      where.investigationId = query.investigationId;
    } else {
      where.investigationId = null;
    }

    if (query.organizationId !== undefined) {
      where.organizationId = query.organizationId;
    }

    return this.prisma.mapElement.findMany({
      where,
      orderBy: { legendNumber: "asc" },
      include: MAP_ELEMENT_INCLUDE
    });
  }

  public async createElement(data: CreateMapElementInput, requester: AuthenticatedUser): Promise<unknown> {
    if (data.investigationId !== undefined) {
      await this.ensureInvestigationAccess(data.investigationId, requester);
    }

    const scopeWhere: Prisma.MapElementWhereInput = data.investigationId === undefined
      ? { investigationId: null }
      : { investigationId: data.investigationId };
    const subjectLinks = this.normalizeSubjectLinks(data.subjectIds, data.linkedSubjects);

    return this.prisma.$transaction(async (transaction) => {
      const lastElement = await transaction.mapElement.findFirst({
        where: scopeWhere,
        orderBy: { legendNumber: "desc" },
        select: { legendNumber: true }
      });
      const legendNumber = (lastElement?.legendNumber ?? 0) + 1;

      return transaction.mapElement.create({
        data: {
          investigationId: data.investigationId ?? null,
          legendNumber,
          type: data.type as MapElementType,
          label: data.label,
          description: data.description ?? null,
          color: data.color ?? "#dc2626",
          geoJson: data.geoJson,
          radius: data.radius ?? null,
          organizationId: data.organizationId ?? null,
          propertyId: data.propertyId ?? null,
          createdById: requester.id,
          linkedSubjects: {
            create: subjectLinks.map((link) => ({
              subjectId: link.subjectId,
              role: link.role ?? null
            }))
          }
        },
        include: MAP_ELEMENT_INCLUDE
      });
    });
  }

  public async updateElement(id: string, data: UpdateMapElementInput, requester: AuthenticatedUser): Promise<unknown> {
    const element = await this.ensureCanMutateElement(id, requester);
    const updateData: Prisma.MapElementUpdateInput = {};

    if (data.label !== undefined) updateData.label = data.label;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.radius !== undefined) updateData.radius = data.radius;
    if (data.organizationId !== undefined) {
      updateData.organization = data.organizationId === null ? { disconnect: true } : { connect: { id: data.organizationId } };
    }

    return this.prisma.mapElement.update({
      where: { id: element.id },
      data: updateData,
      include: MAP_ELEMENT_INCLUDE
    });
  }

  public async deleteElement(id: string, requester: AuthenticatedUser): Promise<void> {
    const element = await this.ensureCanMutateElement(id, requester);
    // Legend numbers are stable HUMINT references; deleting an element intentionally leaves gaps.
    await this.prisma.mapElement.delete({ where: { id: element.id } });
  }

  public async linkElementSubject(id: string, data: LinkMapElementSubjectInput, requester: AuthenticatedUser): Promise<unknown> {
    await this.ensureCanMutateElement(id, requester);

    return this.prisma.mapElementSubject.upsert({
      where: { mapElementId_subjectId: { mapElementId: id, subjectId: data.subjectId } },
      update: { role: data.role ?? null },
      create: { mapElementId: id, subjectId: data.subjectId, role: data.role ?? null },
      include: {
        subject: { select: SUBJECT_SELECT }
      }
    });
  }

  public async unlinkElementSubject(id: string, subjectId: string, requester: AuthenticatedUser): Promise<void> {
    await this.ensureCanMutateElement(id, requester);
    await this.prisma.mapElementSubject.delete({ where: { mapElementId_subjectId: { mapElementId: id, subjectId } } });
  }

  public async createDrawing(data: CreateMapDrawingInput, requester: AuthenticatedUser): Promise<unknown> {
    await this.ensureCanEditInvestigation(data.investigationId, requester);

    return this.prisma.mapDrawing.create({
      data: {
        investigationId: data.investigationId,
        type: data.type as MapDrawingType,
        label: data.label ?? null,
        geoJson: data.geoJson,
        color: data.color ?? "#2f80ed",
        description: data.description ?? null,
        createdById: requester.id
      },
      include: MAP_DRAWING_INCLUDE
    });
  }

  public async updateDrawing(id: string, data: UpdateMapDrawingInput, requester: AuthenticatedUser): Promise<unknown> {
    const drawing = await this.ensureCanMutateDrawing(id, requester);
    const updateData: Prisma.MapDrawingUpdateInput = {};

    if (data.label !== undefined) updateData.label = data.label;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.description !== undefined) updateData.description = data.description;

    return this.prisma.mapDrawing.update({
      where: { id: drawing.id },
      data: updateData,
      include: MAP_DRAWING_INCLUDE
    });
  }

  public async deleteDrawing(id: string, requester: AuthenticatedUser): Promise<void> {
    const drawing = await this.ensureCanMutateDrawing(id, requester);
    await this.prisma.mapDrawing.delete({ where: { id: drawing.id } });
  }

  private async ensureCanMutateDrawing(id: string, requester: AuthenticatedUser): Promise<{ id: string; investigationId: string; createdById: string }> {
    const drawing = await this.prisma.mapDrawing.findUnique({
      where: { id },
      select: { id: true, investigationId: true, createdById: true }
    });

    if (drawing === null) {
      throw new AppError(404, "MAP_DRAWING_NOT_FOUND", "No se encontró el dibujo solicitado.");
    }

    await this.ensureInvestigationAccess(drawing.investigationId, requester);

    const isCreator = drawing.createdById === requester.id;
    const isSenior = ROLE_LEVEL[requester.role] >= ROLE_LEVEL[RoleType.FISCAL_DIVISION];

    if (!isCreator && !isSenior && !hasPermission(requester.role, Permission.EDIT_INVESTIGATION)) {
      throw new AppError(403, "FORBIDDEN", "No tienes permisos para modificar este dibujo.");
    }

    return drawing;
  }

  private async ensureCanMutateElement(id: string, requester: AuthenticatedUser): Promise<{ id: string; investigationId: string | null; createdById: string }> {
    const element = await this.prisma.mapElement.findUnique({
      where: { id },
      select: { id: true, investigationId: true, createdById: true }
    });

    if (element === null) {
      throw new AppError(404, "MAP_ELEMENT_NOT_FOUND", "No se encontró el elemento de inteligencia solicitado.");
    }

    if (element.investigationId !== null) {
      await this.ensureInvestigationAccess(element.investigationId, requester);
    }

    const isCreator = element.createdById === requester.id;
    const isSenior = ROLE_LEVEL[requester.role] >= ROLE_LEVEL[RoleType.FISCAL_DIVISION];

    if (!isCreator && !isSenior) {
      throw new AppError(403, "FORBIDDEN", "No tienes permisos para modificar este elemento de inteligencia.");
    }

    return element;
  }

  private normalizeSubjectLinks(subjectIds: readonly string[] | undefined, linkedSubjects: readonly SubjectLink[] | undefined): SubjectLink[] {
    const links = new Map<string, SubjectLink>();

    for (const subjectId of subjectIds ?? []) {
      links.set(subjectId, { subjectId });
    }

    for (const link of linkedSubjects ?? []) {
      links.set(link.subjectId, link);
    }

    return Array.from(links.values());
  }

  private async ensureCanEditInvestigation(investigationId: string, requester: AuthenticatedUser): Promise<void> {
    if (!hasPermission(requester.role, Permission.EDIT_INVESTIGATION)) {
      throw new AppError(403, "FORBIDDEN", "No tienes permisos para editar investigaciones.");
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
}
