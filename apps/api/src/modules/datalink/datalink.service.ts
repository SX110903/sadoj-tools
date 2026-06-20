import { Prisma, type PrismaClient } from "../../shared/prisma";
import type { DatalinkEdge, DatalinkGraph, DatalinkNode } from "../investigations/investigations.service";
import type { DatalinkQueryInput } from "./datalink.schema";

export class DatalinkService {
  public constructor(private readonly prisma: PrismaClient) {}

  public async getGlobalGraph(query: DatalinkQueryInput): Promise<DatalinkGraph> {
    const where = this.buildSubjectWhere(query);
    const subjects = await this.prisma.subject.findMany({
      where,
      take: query.organizationId === undefined && query.subjectId === undefined ? 75 : 150,
      orderBy: [{ updatedAt: "desc" }, { lastName: "asc" }],
      include: {
        criminalOrganization: true,
        properties: { include: { property: true } },
        vehicles: { include: { vehicle: true } },
        relationships: { include: { to: true } },
        relatedTo: { include: { from: true } },
        documents: true,
        mapElements: {
          include: {
            mapElement: {
              include: {
                organization: true,
                property: true
              }
            }
          }
        }
      }
    });

    const nodes = new Map<string, DatalinkNode>();
    const edges = new Map<string, DatalinkEdge>();
    const subjectIds = new Set(subjects.map((subject) => subject.id));
    const addNode = (node: DatalinkNode): void => {
      if (!nodes.has(node.id)) nodes.set(node.id, node);
    };
    const addEdge = (edge: Omit<DatalinkEdge, "id">): void => {
      const edgeId = `${edge.source}->${edge.target}:${edge.type}:${edge.label}`;
      if (!edges.has(edgeId)) edges.set(edgeId, { ...edge, id: edgeId });
    };

    for (const subject of subjects) {
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

      for (const document of subject.documents) {
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
        addEdge({ source: subjectNodeId, target: documentNodeId, type: "documented_in", label: "documentado en" });
      }

      for (const relationship of subject.relationships) {
        const targetNodeId = `subject:${relationship.toId}`;
        if (!subjectIds.has(relationship.toId)) {
          addNode({
            id: targetNodeId,
            type: "subject",
            label: `${relationship.to.firstName} ${relationship.to.lastName}`,
            href: `/sujetos/${relationship.to.id}`,
            meta: {
              alias: relationship.to.alias,
              dangerLevel: relationship.to.dangerLevel,
              status: relationship.to.status,
              photo: relationship.to.photo
            }
          });
        }
        addEdge({ source: subjectNodeId, target: targetNodeId, type: "related", label: relationship.type });
      }

      for (const relationship of subject.relatedTo) {
        const sourceNodeId = `subject:${relationship.fromId}`;
        if (!subjectIds.has(relationship.fromId)) {
          addNode({
            id: sourceNodeId,
            type: "subject",
            label: `${relationship.from.firstName} ${relationship.from.lastName}`,
            href: `/sujetos/${relationship.from.id}`,
            meta: {
              alias: relationship.from.alias,
              dangerLevel: relationship.from.dangerLevel,
              status: relationship.from.status,
              photo: relationship.from.photo
            }
          });
        }
        addEdge({ source: sourceNodeId, target: subjectNodeId, type: "related", label: relationship.type });
      }

      for (const mapLink of subject.mapElements) {
        const mapElement = mapLink.mapElement;
        const mapNodeId = `mapElement:${mapElement.id}`;
        addNode({
          id: mapNodeId,
          type: "mapElement",
          label: mapElement.label,
          href: mapElement.investigationId !== null ? `/mapa?investigationId=${mapElement.investigationId}` : "/mapa",
          meta: {
            legendNumber: mapElement.legendNumber,
            color: mapElement.color,
            elementType: mapElement.type,
            organizationId: mapElement.organizationId,
            propertyId: mapElement.propertyId
          }
        });
        addEdge({ source: mapNodeId, target: subjectNodeId, type: "mapped_in", label: mapLink.role ?? "ubicación vinculada" });

        if (mapElement.organizationId !== null) {
          addEdge({ source: mapNodeId, target: `organization:${mapElement.organizationId}`, type: "mapped_in", label: "ubicación vinculada" });
        }

        if (mapElement.propertyId !== null) {
          addEdge({ source: mapNodeId, target: `property:${mapElement.propertyId}`, type: "mapped_in", label: "ubicación vinculada" });
        }
      }
    }

    return {
      nodes: Array.from(nodes.values()),
      edges: Array.from(edges.values())
    };
  }

  private buildSubjectWhere(query: DatalinkQueryInput): Prisma.SubjectWhereInput {
    if (query.organizationId !== undefined) {
      return { organizationId: query.organizationId };
    }

    if (query.subjectId !== undefined) {
      return {
        OR: [
          { id: query.subjectId },
          { relationships: { some: { toId: query.subjectId } } },
          { relatedTo: { some: { fromId: query.subjectId } } }
        ]
      };
    }

    return {};
  }
}
