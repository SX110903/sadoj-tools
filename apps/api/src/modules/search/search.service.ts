import { hasPermission, Permission, ROLE_LEVEL } from "@sadoj/shared";
import { Prisma, type PrismaClient } from "../../shared/prisma";
import type { AuthenticatedUser } from "../../types/fastify";
import { hasGlobalPropertyAccess } from "../properties/property-access";
import type { SearchQueryInput } from "./search.schema";

export interface SearchResultItem {
  id: string;
  type: "investigation" | "subject" | "organization" | "document" | "property";
  label: string;
  description: string;
  href: string;
}

export interface SearchResults {
  investigations: SearchResultItem[];
  subjects: SearchResultItem[];
  organizations: SearchResultItem[];
  documents: SearchResultItem[];
  properties: SearchResultItem[];
}

export class SearchService {
  public constructor(private readonly prisma: PrismaClient) {}

  public async search(requester: AuthenticatedUser, query: SearchQueryInput): Promise<SearchResults> {
    const term = query.q;
    const canViewSubjects = hasPermission(requester.role, Permission.VIEW_SUBJECTS);
    const [investigations, subjects, organizations, documents, properties] = await Promise.all([
      this.searchInvestigations(requester, term),
      canViewSubjects ? this.searchSubjects(term) : Promise.resolve([]),
      canViewSubjects ? this.searchOrganizations(term) : Promise.resolve([]),
      canViewSubjects ? this.searchDocuments(requester, term) : Promise.resolve([]),
      canViewSubjects ? this.searchProperties(requester, term) : Promise.resolve([])
    ]);

    return { investigations, subjects, organizations, documents, properties };
  }

  private async searchInvestigations(requester: AuthenticatedUser, term: string): Promise<SearchResultItem[]> {
    const searchWhere: Prisma.InvestigationWhereInput = {
      OR: [
        { caseNumber: { contains: term, mode: "insensitive" } },
        { title: { contains: term, mode: "insensitive" } },
        { description: { contains: term, mode: "insensitive" } }
      ]
    };
    const accessWhere: Prisma.InvestigationWhereInput = hasPermission(requester.role, Permission.VIEW_ALL_INVESTIGATIONS)
      ? {}
      : { OR: [{ leadFiscalId: requester.id }, { participants: { some: { userId: requester.id } } }] };

    const rows = await this.prisma.investigation.findMany({
      where: { AND: [searchWhere, accessWhere] },
      take: 5,
      orderBy: { updatedAt: "desc" },
      select: { id: true, caseNumber: true, title: true, status: true }
    });

    return rows.map((row) => ({
      id: row.id,
      type: "investigation",
      label: `${row.caseNumber} - ${row.title}`,
      description: row.status,
      href: `/investigaciones/${row.id}`
    }));
  }

  private async searchSubjects(term: string): Promise<SearchResultItem[]> {
    const rows = await this.prisma.subject.findMany({
      where: {
        OR: [
          { firstName: { contains: term, mode: "insensitive" } },
          { lastName: { contains: term, mode: "insensitive" } },
          { alias: { contains: term, mode: "insensitive" } }
        ]
      },
      take: 5,
      orderBy: { updatedAt: "desc" },
      select: { id: true, firstName: true, lastName: true, alias: true, status: true }
    });

    return rows.map((row) => ({
      id: row.id,
      type: "subject",
      label: `${row.firstName} ${row.lastName}`,
      description: row.alias ?? row.status,
      href: `/sujetos/${row.id}`
    }));
  }

  private async searchOrganizations(term: string): Promise<SearchResultItem[]> {
    const rows = await this.prisma.criminalOrganization.findMany({
      where: {
        OR: [
          { name: { contains: term, mode: "insensitive" } },
          { alias: { contains: term, mode: "insensitive" } }
        ]
      },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, alias: true, type: true }
    });

    return rows.map((row) => ({
      id: row.id,
      type: "organization",
      label: row.name,
      description: row.alias ?? row.type,
      href: `/organizaciones/${row.id}`
    }));
  }

  private async searchDocuments(requester: AuthenticatedUser, term: string): Promise<SearchResultItem[]> {
    const visibilityWhere: Prisma.DocumentWhereInput =
      ROLE_LEVEL[requester.role] >= 8
        ? {}
        : {
            OR: [
              { createdById: requester.id },
              { investigation: { leadFiscalId: requester.id } },
              { investigation: { participants: { some: { userId: requester.id } } } }
            ]
          };
    const rows = await this.prisma.document.findMany({
      where: {
        AND: [
          visibilityWhere,
          { OR: [{ documentNumber: { contains: term, mode: "insensitive" } }, { title: { contains: term, mode: "insensitive" } }] }
        ]
      },
      take: 5,
      orderBy: { updatedAt: "desc" },
      select: { id: true, documentNumber: true, title: true, status: true }
    });

    return rows.map((row) => ({
      id: row.id,
      type: "document",
      label: `${row.documentNumber} - ${row.title}`,
      description: row.status,
      href: `/documentos/${row.id}`
    }));
  }

  private async searchProperties(requester: AuthenticatedUser, term: string): Promise<SearchResultItem[]> {
    const where: Prisma.PropertyWhereInput = { address: { contains: term, mode: "insensitive" } };

    if (!hasGlobalPropertyAccess(requester)) {
      where.members = { some: { userId: requester.id } };
    }

    const rows = await this.prisma.property.findMany({
      where,
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, address: true, type: true, zone: true }
    });

    return rows.map((row) => ({
      id: row.id,
      type: "property",
      label: row.address,
      description: row.zone ?? row.type,
      href: `/propiedades/${row.id}`
    }));
  }
}
