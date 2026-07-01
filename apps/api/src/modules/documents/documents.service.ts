import { ROLE_LEVEL } from "@sadoj/shared";
import { AppError } from "../../shared/errors/AppError";
import { DocumentStatus, NotificationType, Prisma, type PrismaClient } from "../../shared/prisma";
import { buildPaginationMeta, getPagination, type PaginationMeta } from "../../shared/utils/pagination";
import { withUniqueRetry } from "../../shared/utils/retry";
import type { AuthenticatedUser } from "../../types/fastify";
import { NotificationsService } from "../notifications/notifications.service";
import type { CreateDocumentInput, DocumentsQueryInput, UpdateDocumentInput, UpdateDocumentStatusInput } from "./documents.schema";

const DOCUMENT_INCLUDE = {
  createdBy: { select: { id: true, displayName: true, role: true, avatar: true } },
  signedBy: { select: { id: true, displayName: true, role: true, avatar: true } },
  investigation: { select: { id: true, caseNumber: true, title: true, status: true } },
  subject: { select: { id: true, firstName: true, lastName: true, alias: true, status: true, dangerLevel: true } }
} satisfies Prisma.DocumentInclude;

type DocumentWithRelations = Prisma.DocumentGetPayload<{ include: typeof DOCUMENT_INCLUDE }>;

export interface PaginatedDocuments {
  data: DocumentWithRelations[];
  meta: PaginationMeta;
}

export class DocumentsService {
  public constructor(private readonly prisma: PrismaClient) {}

  public async findAll(requester: AuthenticatedUser, query: DocumentsQueryInput): Promise<PaginatedDocuments> {
    const pagination = getPagination(query);
    const filters: Prisma.DocumentWhereInput[] = [this.buildVisibilityWhere(requester)];

    if (query.type !== undefined) filters.push({ type: query.type });
    if (query.status !== undefined) filters.push({ status: query.status });
    if (query.authorId !== undefined) filters.push({ createdById: query.authorId });
    if (query.investigationId !== undefined) filters.push({ investigationId: query.investigationId });
    if (query.subjectId !== undefined) filters.push({ subjectId: query.subjectId });
    if (query.search !== undefined) {
      filters.push({
        OR: [
          { documentNumber: { contains: query.search, mode: "insensitive" } },
          { title: { contains: query.search, mode: "insensitive" } }
        ]
      });
    }

    const where: Prisma.DocumentWhereInput = { AND: filters };
    const [total, documents] = await this.prisma.$transaction([
      this.prisma.document.count({ where }),
      this.prisma.document.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: "desc" },
        include: DOCUMENT_INCLUDE
      })
    ]);

    return {
      data: documents,
      meta: buildPaginationMeta(total, pagination.page, pagination.limit)
    };
  }

  public async findById(id: string, requester: AuthenticatedUser): Promise<DocumentWithRelations> {
    return this.getVisibleDocument(id, requester);
  }

  public async create(data: CreateDocumentInput, requester: AuthenticatedUser): Promise<DocumentWithRelations> {
    if (data.investigationId !== undefined) {
      await this.ensureInvestigationAccess(data.investigationId, requester);
    }
    if (data.subjectId !== undefined) {
      await this.ensureSubjectExists(data.subjectId);
    }

    const document = await withUniqueRetry(() => this.prisma.$transaction(async (transaction) => {
      const documentNumber = await this.generateDocumentNumber(transaction);
      const document = await transaction.document.create({
        data: {
          documentNumber,
          type: data.type,
          title: data.title,
          formData: this.toPrismaJsonObject(data.formData),
          investigationId: data.investigationId ?? null,
          subjectId: data.subjectId ?? null,
          createdById: requester.id,
          authorRole: requester.role
        },
        include: DOCUMENT_INCLUDE
      });

      await transaction.auditLog.create({
        data: {
          userId: requester.id,
          action: "CREATE_DOCUMENT",
          entity: "Document",
          entityId: document.id,
          investigationId: data.investigationId ?? null,
          meta: { documentNumber, type: data.type, status: document.status, subjectId: data.subjectId ?? null }
        }
      });

      return document;
    }), ["documentNumber"]);

    if (this.requiresSignature(data.type)) {
      const signers = await this.prisma.user.findMany({
        where: { active: true },
        select: { id: true, role: true }
      });
      const recipientIds = signers.filter((signer) => ROLE_LEVEL[signer.role] >= 7).map((signer) => signer.id);
      await new NotificationsService(this.prisma).notifyMany(recipientIds, {
        actorId: requester.id,
        type: NotificationType.DOCUMENT_TO_SIGN,
        title: "Documento pendiente de firma",
        message: `${document.documentNumber} requiere firma.`,
        link: `/documentos/${document.id}`,
        meta: { documentId: document.id, documentNumber: document.documentNumber, type: document.type }
      });
    }

    return document;
  }

  public async update(id: string, data: UpdateDocumentInput, requester: AuthenticatedUser): Promise<DocumentWithRelations> {
    const current = await this.getVisibleDocument(id, requester);
    this.ensureCanEdit(current, requester);

    if (data.investigationId !== undefined && data.investigationId !== null) {
      await this.ensureInvestigationAccess(data.investigationId, requester);
    }
    if (data.subjectId !== undefined && data.subjectId !== null) {
      await this.ensureSubjectExists(data.subjectId);
    }

    return this.prisma.$transaction(async (transaction) => {
      const updateData: Prisma.DocumentUncheckedUpdateInput = {};
      if (data.type !== undefined) updateData.type = data.type;
      if (data.title !== undefined) updateData.title = data.title;
      if (data.formData !== undefined) updateData.formData = this.toPrismaJsonObject(data.formData);
      if (data.investigationId !== undefined) updateData.investigationId = data.investigationId;
      if (data.subjectId !== undefined) updateData.subjectId = data.subjectId;

      const document = await transaction.document.update({
        where: { id },
        data: updateData,
        include: DOCUMENT_INCLUDE
      });

      await transaction.auditLog.create({
        data: {
          userId: requester.id,
          action: "UPDATE_DOCUMENT",
          entity: "Document",
          entityId: id,
          investigationId: document.investigationId,
          meta: { documentNumber: document.documentNumber, status: document.status, subjectId: document.subjectId }
        }
      });

      return document;
    });
  }

  public async updateStatus(id: string, data: UpdateDocumentStatusInput, requester: AuthenticatedUser): Promise<DocumentWithRelations> {
    const current = await this.getVisibleDocument(id, requester);

    if (data.status === DocumentStatus.SIGNED) {
      throw new AppError(400, "SIGN_ENDPOINT_REQUIRED", "Usa la accion de firma para firmar documentos.");
    }

    if (data.status === DocumentStatus.ARCHIVED && ROLE_LEVEL[requester.role] < 8) {
      throw new AppError(403, "ROLE_LEVEL_TOO_LOW", "Solo un rango superior puede archivar documentos.");
    }

    if (data.status !== DocumentStatus.ARCHIVED) {
      this.ensureCanEdit(current, requester);
    }

    const document = await this.prisma.$transaction(async (transaction) => {
      const document = await transaction.document.update({
        where: { id },
        data: { status: data.status },
        include: DOCUMENT_INCLUDE
      });

      await transaction.auditLog.create({
        data: {
          userId: requester.id,
          action: "UPDATE_DOCUMENT_STATUS",
          entity: "Document",
          entityId: id,
          investigationId: document.investigationId,
          meta: { documentNumber: document.documentNumber, previousStatus: current.status, status: data.status }
        }
      });

      return document;
    });

    await new NotificationsService(this.prisma).notify({
      recipientId: document.createdById,
      actorId: requester.id,
      type: NotificationType.DOCUMENT_SIGNED,
      title: "Documento firmado",
      message: `${document.documentNumber} fue firmado por ${document.signedBy?.displayName ?? "un fiscal"}.`,
      link: `/documentos/${document.id}`,
      meta: { documentId: document.id, documentNumber: document.documentNumber }
    });

    return document;
  }

  public async sign(id: string, requester: AuthenticatedUser): Promise<DocumentWithRelations> {
    const current = await this.getVisibleDocument(id, requester);

    if (ROLE_LEVEL[requester.role] < 7) {
      throw new AppError(403, "ROLE_LEVEL_TOO_LOW", "Tu rango no permite firmar documentos oficiales.");
    }

    if (current.status !== DocumentStatus.ISSUED) {
      throw new AppError(409, "DOCUMENT_NOT_ISSUED", "Solo puedes firmar documentos emitidos.");
    }

    return this.prisma.$transaction(async (transaction) => {
      const document = await transaction.document.update({
        where: { id },
        data: {
          status: DocumentStatus.SIGNED,
          signedById: requester.id,
          signedAt: new Date()
        },
        include: DOCUMENT_INCLUDE
      });

      await transaction.auditLog.create({
        data: {
          userId: requester.id,
          action: "SIGN_DOCUMENT",
          entity: "Document",
          entityId: id,
          investigationId: document.investigationId,
          meta: { documentNumber: document.documentNumber }
        }
      });

      return document;
    });
  }

  public async delete(id: string, requester: AuthenticatedUser): Promise<void> {
    const current = await this.getVisibleDocument(id, requester);
    const canDeleteDraft = current.createdById === requester.id && current.status === DocumentStatus.DRAFT;

    if (!canDeleteDraft && ROLE_LEVEL[requester.role] < 9) {
      throw new AppError(403, "FORBIDDEN", "No tienes permisos para eliminar este documento.");
    }

    await this.prisma.$transaction(async (transaction) => {
      await transaction.document.delete({ where: { id } });
      await transaction.auditLog.create({
        data: {
          userId: requester.id,
          action: "DELETE_DOCUMENT",
          entity: "Document",
          entityId: id,
          investigationId: current.investigationId,
          meta: { documentNumber: current.documentNumber, status: current.status }
        }
      });
    });
  }

  private buildVisibilityWhere(requester: AuthenticatedUser): Prisma.DocumentWhereInput {
    if (ROLE_LEVEL[requester.role] >= 8) {
      return {};
    }

    return {
      OR: [
        { createdById: requester.id },
        { investigation: { leadFiscalId: requester.id } },
        { investigation: { participants: { some: { userId: requester.id } } } }
      ]
    };
  }

  private async getVisibleDocument(id: string, requester: AuthenticatedUser): Promise<DocumentWithRelations> {
    const document = await this.prisma.document.findFirst({
      where: { id, AND: [this.buildVisibilityWhere(requester)] },
      include: DOCUMENT_INCLUDE
    });

    if (document === null) {
      throw new AppError(404, "DOCUMENT_NOT_FOUND", "No se encontro el documento solicitado.");
    }

    return document;
  }

  private ensureCanEdit(document: DocumentWithRelations, requester: AuthenticatedUser): void {
    if (ROLE_LEVEL[requester.role] >= 8) {
      return;
    }

    if (document.createdById === requester.id && document.status === DocumentStatus.DRAFT) {
      return;
    }

    throw new AppError(403, "FORBIDDEN", "Solo el autor puede editar borradores.");
  }

  private async ensureInvestigationAccess(investigationId: string, requester: AuthenticatedUser): Promise<void> {
    const where: Prisma.InvestigationWhereInput =
      ROLE_LEVEL[requester.role] >= 8
        ? { id: investigationId }
        : {
            id: investigationId,
            OR: [{ leadFiscalId: requester.id }, { participants: { some: { userId: requester.id } } }]
          };

    const investigation = await this.prisma.investigation.findFirst({ where, select: { id: true } });

    if (investigation === null) {
      throw new AppError(404, "INVESTIGATION_NOT_FOUND", "No se encontro una investigacion accesible para vincular.");
    }
  }

  private async ensureSubjectExists(subjectId: string): Promise<void> {
    const subject = await this.prisma.subject.findUnique({ where: { id: subjectId }, select: { id: true } });

    if (subject === null) {
      throw new AppError(404, "SUBJECT_NOT_FOUND", "No se encontro el sujeto indicado.");
    }
  }

  private toPrismaJsonObject(value: Record<string, unknown>): Prisma.InputJsonObject {
    return value as Prisma.InputJsonObject;
  }

  private async generateDocumentNumber(transaction: Prisma.TransactionClient): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `DOC-SADOJ-${year}-`;
    const lastDocument = await transaction.document.findFirst({
      where: { documentNumber: { startsWith: prefix } },
      orderBy: { documentNumber: "desc" },
      select: { documentNumber: true }
    });

    const lastSequence = lastDocument === null ? 0 : Number.parseInt(lastDocument.documentNumber.slice(prefix.length), 10);
    const nextSequence = Number.isNaN(lastSequence) ? 1 : lastSequence + 1;

    return `${prefix}${nextSequence.toString().padStart(4, "0")}`;
  }

  private requiresSignature(type: string): boolean {
    return new Set([
      "acusacion",
      "allanamiento",
      "busca-captura",
      "interrogatorio",
      "orden-arresto",
      "registro-telefonico",
      "solicitud-informacion",
      "extraccion-telefonica"
    ]).has(type);
  }
}
