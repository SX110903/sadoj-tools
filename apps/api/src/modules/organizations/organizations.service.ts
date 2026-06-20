import { AppError } from "../../shared/errors/AppError";
import { Prisma, type PrismaClient } from "../../shared/prisma";
import type { AuthenticatedUser } from "../../types/fastify";
import type { CreateOrganizationInput, OrganizationsQueryInput, UpdateOrganizationInput } from "./organizations.schema";

const ORGANIZATION_INCLUDE = {
  _count: { select: { members: true, mapElements: true } }
} satisfies Prisma.CriminalOrganizationInclude;

const ORGANIZATION_DETAIL_INCLUDE = {
  _count: { select: { members: true, mapElements: true } },
  members: {
    orderBy: [{ dangerLevel: "desc" }, { lastName: "asc" }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      alias: true,
      photo: true,
      dangerLevel: true,
      status: true,
      organization: true,
      organizationId: true
    }
  },
  mapElements: {
    orderBy: { legendNumber: "asc" },
    include: {
      property: true,
      linkedSubjects: {
        include: {
          subject: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              alias: true,
              photo: true,
              dangerLevel: true,
              status: true
            }
          }
        }
      }
    }
  }
} satisfies Prisma.CriminalOrganizationInclude;

export class OrganizationsService {
  public constructor(private readonly prisma: PrismaClient) {}

  public async findAll(query: OrganizationsQueryInput): Promise<unknown[]> {
    const where: Prisma.CriminalOrganizationWhereInput = {};

    if (query.active !== undefined) where.active = query.active;
    if (query.q !== undefined) {
      where.OR = [
        { name: { contains: query.q, mode: "insensitive" } },
        { alias: { contains: query.q, mode: "insensitive" } }
      ];
    }

    return this.prisma.criminalOrganization.findMany({
      where,
      orderBy: [{ active: "desc" }, { name: "asc" }],
      include: ORGANIZATION_INCLUDE
    });
  }

  public async findById(id: string): Promise<unknown> {
    const organization = await this.prisma.criminalOrganization.findUnique({
      where: { id },
      include: ORGANIZATION_DETAIL_INCLUDE
    });

    if (organization === null) {
      throw new AppError(404, "ORGANIZATION_NOT_FOUND", "No se encontró la organización solicitada.");
    }

    return organization;
  }

  public async create(data: CreateOrganizationInput, requester: AuthenticatedUser): Promise<unknown> {
    return this.prisma.criminalOrganization.create({
      data: {
        name: data.name,
        alias: data.alias ?? null,
        color: data.color,
        description: data.description ?? null,
        type: data.type,
        createdById: requester.id
      },
      include: ORGANIZATION_INCLUDE
    });
  }

  public async update(id: string, data: UpdateOrganizationInput): Promise<unknown> {
    await this.ensureOrganization(id);
    const updateData: Prisma.CriminalOrganizationUpdateInput = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.alias !== undefined) updateData.alias = data.alias;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.active !== undefined) updateData.active = data.active;

    return this.prisma.criminalOrganization.update({
      where: { id },
      data: updateData,
      include: ORGANIZATION_INCLUDE
    });
  }

  public async delete(id: string): Promise<void> {
    await this.ensureOrganization(id);
    await this.prisma.criminalOrganization.update({
      where: { id },
      data: { active: false }
    });
  }

  private async ensureOrganization(id: string): Promise<void> {
    const organization = await this.prisma.criminalOrganization.findUnique({ where: { id }, select: { id: true } });

    if (organization === null) {
      throw new AppError(404, "ORGANIZATION_NOT_FOUND", "No se encontró la organización solicitada.");
    }
  }
}
