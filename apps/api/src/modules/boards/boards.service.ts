import { hasPermission, Permission } from "@sadoj/shared";
import { AppError } from "../../shared/errors/AppError";
import { BoardCardType, BoardScope, Prisma, type PrismaClient } from "../../shared/prisma";
import { withUniqueRetry } from "../../shared/utils/retry";
import type { AuthenticatedUser } from "../../types/fastify";
import { ensurePropertyAccess } from "../properties/property-access";
import type {
  BatchUpdateBoardCardsInput,
  BoardScopeParam,
  CreateBoardCardInput,
  CreateBoardConnectionInput,
  CreateGlobalBoardInput,
  CreateBoardStepInput,
  ReorderBoardStepsInput,
  UpdateBoardCardInput,
  UpdateBoardConnectionInput,
  UpdateBoardStepInput
} from "./boards.schema";

const PERSON_SELECT = {
  id: true,
  displayName: true,
  role: true,
  avatar: true
} satisfies Prisma.UserSelect;

const BOARD_INCLUDE = {
  owner: { select: PERSON_SELECT },
  cards: {
    include: {
      file: { include: { uploadedBy: { select: PERSON_SELECT } } },
      createdBy: { select: PERSON_SELECT }
    },
    orderBy: [{ zIndex: "asc" }, { createdAt: "asc" }]
  },
  steps: {
    include: {
      file: { include: { uploadedBy: { select: PERSON_SELECT } } },
      createdBy: { select: PERSON_SELECT }
    },
    orderBy: { order: "asc" }
  },
  connections: {
    orderBy: { createdAt: "asc" }
  }
} satisfies Prisma.EvidenceBoardInclude;

type BoardWithContent = Prisma.EvidenceBoardGetPayload<{ include: typeof BOARD_INCLUDE }>;

interface EntitySummary {
  title: string;
  description: string | null;
}

export class BoardsService {
  public constructor(private readonly prisma: PrismaClient) {}

  public async getScopedBoard(scopeParam: BoardScopeParam, targetId: string, requester: AuthenticatedUser): Promise<BoardWithContent> {
    const scope = this.toBoardScope(scopeParam);
    await this.ensureScopedAccess(scope, targetId, requester, "read");

    if (scope === BoardScope.SUBJECT) {
      const subject = await this.prisma.subject.findUnique({ where: { id: targetId }, select: { firstName: true, lastName: true } });

      if (subject === null) {
        throw new AppError(404, "SUBJECT_NOT_FOUND", "No se encontró el sujeto solicitado.");
      }

      return this.prisma.evidenceBoard.upsert({
        where: { subjectId: targetId },
        create: {
          scope,
          title: `Pizarra de ${subject.firstName} ${subject.lastName}`,
          ownerId: requester.id,
          subjectId: targetId
        },
        update: {},
        include: BOARD_INCLUDE
      });
    }

    const investigation = await this.prisma.investigation.findUnique({ where: { id: targetId }, select: { caseNumber: true, title: true } });

    if (investigation === null) {
      throw new AppError(404, "INVESTIGATION_NOT_FOUND", "No se encontró la investigación solicitada.");
    }

    return this.prisma.evidenceBoard.upsert({
      where: { investigationId: targetId },
      create: {
        scope,
        title: `Pizarra ${investigation.caseNumber}`,
        ownerId: requester.id,
        investigationId: targetId
      },
      update: {},
      include: BOARD_INCLUDE
    });
  }

  public async listGlobalBoards(requester: AuthenticatedUser): Promise<unknown[]> {
    this.ensureGlobalRead(requester);

    return this.prisma.evidenceBoard.findMany({
      where: { scope: BoardScope.GLOBAL, ownerId: requester.id },
      include: {
        owner: { select: PERSON_SELECT },
        _count: { select: { cards: true, steps: true, connections: true } }
      },
      orderBy: { updatedAt: "desc" }
    });
  }

  public async createGlobalBoard(data: CreateGlobalBoardInput, requester: AuthenticatedUser): Promise<BoardWithContent> {
    this.ensureGlobalRead(requester);

    return this.prisma.$transaction(async (transaction) => {
      const board = await transaction.evidenceBoard.create({
        data: {
          scope: BoardScope.GLOBAL,
          title: data.title,
          ownerId: requester.id
        },
        include: BOARD_INCLUDE
      });

      await this.createAuditLog(transaction, requester.id, "EVIDENCE_BOARD_CREATED", "EvidenceBoard", board.id, { scope: board.scope, title: board.title });
      return board;
    });
  }

  public async getBoard(boardId: string, requester: AuthenticatedUser): Promise<BoardWithContent> {
    await this.ensureBoardAccess(boardId, requester, "read");
    return this.findBoardById(boardId);
  }

  public async listSteps(boardId: string, requester: AuthenticatedUser): Promise<unknown[]> {
    await this.ensureBoardAccess(boardId, requester, "read");

    return this.prisma.boardStep.findMany({
      where: { boardId },
      include: {
        file: { include: { uploadedBy: { select: PERSON_SELECT } } },
        createdBy: { select: PERSON_SELECT }
      },
      orderBy: { order: "asc" }
    });
  }

  public async deleteGlobalBoard(boardId: string, requester: AuthenticatedUser): Promise<void> {
    const board = await this.ensureBoardAccess(boardId, requester, "write");

    if (board.scope !== BoardScope.GLOBAL) {
      throw new AppError(400, "INVALID_BOARD_SCOPE", "Solo se pueden eliminar pizarras globales desde este recurso.");
    }

    await this.prisma.$transaction(async (transaction) => {
      await transaction.evidenceBoard.delete({ where: { id: boardId } });
      await this.createAuditLog(transaction, requester.id, "EVIDENCE_BOARD_DELETED", "EvidenceBoard", boardId, { title: board.title });
    });
  }

  public async createCard(boardId: string, data: CreateBoardCardInput, requester: AuthenticatedUser): Promise<BoardWithContent> {
    const board = await this.ensureBoardAccess(boardId, requester, "write");
    await this.validateCardPayload(boardId, data);
    await this.ensureEntityAccess(data, requester);
    const title = await this.resolveCardTitle(data);
    const createData = this.buildCardCreateData(boardId, data, title, requester.id);

    await this.prisma.$transaction(async (transaction) => {
      const card = await transaction.boardCard.create({ data: createData });
      await this.createAuditLog(transaction, requester.id, "BOARD_CARD_CREATED", "BoardCard", card.id, this.boardAuditMeta(board));
    });

    return this.findBoardById(boardId);
  }

  public async updateCard(boardId: string, cardId: string, data: UpdateBoardCardInput, requester: AuthenticatedUser): Promise<BoardWithContent> {
    const board = await this.ensureBoardAccess(boardId, requester, "write");
    await this.ensureCardInBoard(boardId, cardId);
    await this.validateUpdatedFile(boardId, data.fileId);
    await this.ensureUpdatedEntityAccess(data, requester);
    const updateData = this.buildCardUpdateData(data);

    await this.prisma.$transaction(async (transaction) => {
      await transaction.boardCard.update({ where: { id: cardId }, data: updateData });
      await this.createAuditLog(transaction, requester.id, "BOARD_CARD_UPDATED", "BoardCard", cardId, this.boardAuditMeta(board));
    });

    return this.findBoardById(boardId);
  }

  public async batchUpdateCards(boardId: string, data: BatchUpdateBoardCardsInput, requester: AuthenticatedUser): Promise<BoardWithContent> {
    const board = await this.ensureBoardAccess(boardId, requester, "write");
    const cardIds = data.cards.map((card) => card.id);
    const count = await this.prisma.boardCard.count({ where: { boardId, id: { in: cardIds } } });

    if (count !== cardIds.length) {
      throw new AppError(404, "BOARD_CARD_NOT_FOUND", "Una o varias tarjetas no pertenecen a la pizarra.");
    }

    await this.prisma.$transaction(async (transaction) => {
      for (const card of data.cards) {
        const updateData: Prisma.BoardCardUncheckedUpdateInput = {};
        if (card.x !== undefined) updateData.x = card.x;
        if (card.y !== undefined) updateData.y = card.y;
        if (card.width !== undefined) updateData.width = card.width;
        if (card.height !== undefined) updateData.height = card.height;
        if (card.rotation !== undefined) updateData.rotation = card.rotation;
        if (card.zIndex !== undefined) updateData.zIndex = card.zIndex;
        await transaction.boardCard.update({ where: { id: card.id }, data: updateData });
      }

      await this.createAuditLog(transaction, requester.id, "BOARD_CARDS_POSITIONED", "EvidenceBoard", boardId, this.boardAuditMeta(board));
    });

    return this.findBoardById(boardId);
  }

  public async deleteCard(boardId: string, cardId: string, requester: AuthenticatedUser): Promise<BoardWithContent> {
    const board = await this.ensureBoardAccess(boardId, requester, "write");
    await this.ensureCardInBoard(boardId, cardId);

    await this.prisma.$transaction(async (transaction) => {
      await transaction.boardCard.delete({ where: { id: cardId } });
      await this.createAuditLog(transaction, requester.id, "BOARD_CARD_DELETED", "BoardCard", cardId, this.boardAuditMeta(board));
    });

    return this.findBoardById(boardId);
  }

  public async createStep(boardId: string, data: CreateBoardStepInput, requester: AuthenticatedUser): Promise<BoardWithContent> {
    const board = await this.ensureBoardAccess(boardId, requester, "write");
    await this.validateUpdatedFile(boardId, data.fileId);

    await withUniqueRetry(async () => {
      await this.prisma.$transaction(async (transaction) => {
        const aggregate = await transaction.boardStep.aggregate({
          where: { boardId },
          _max: { order: true }
        });
        const order = (aggregate._max.order ?? 0) + 1;
        const step = await transaction.boardStep.create({
          data: {
            boardId,
            order,
            title: data.title,
            description: data.description ?? null,
            status: data.status ?? "PENDING",
            fileId: data.fileId ?? null,
            imageUrl: data.imageUrl ?? null,
            createdById: requester.id
          }
        });

        await this.createAuditLog(transaction, requester.id, "BOARD_STEP_CREATED", "BoardStep", step.id, {
          ...this.boardAuditMeta(board),
          order
        });
      });
    }, ["boardId", "order"]);

    return this.findBoardById(boardId);
  }

  public async updateStep(boardId: string, stepId: string, data: UpdateBoardStepInput, requester: AuthenticatedUser): Promise<BoardWithContent> {
    const board = await this.ensureBoardAccess(boardId, requester, "write");
    await this.ensureStepInBoard(boardId, stepId);
    await this.validateUpdatedFile(boardId, data.fileId);
    const updateData: Prisma.BoardStepUncheckedUpdateInput = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.fileId !== undefined) updateData.fileId = data.fileId;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;

    await this.prisma.$transaction(async (transaction) => {
      await transaction.boardStep.update({ where: { id: stepId }, data: updateData });
      await this.createAuditLog(transaction, requester.id, "BOARD_STEP_UPDATED", "BoardStep", stepId, this.boardAuditMeta(board));
    });

    return this.findBoardById(boardId);
  }

  public async reorderSteps(boardId: string, data: ReorderBoardStepsInput, requester: AuthenticatedUser): Promise<BoardWithContent> {
    const board = await this.ensureBoardAccess(boardId, requester, "write");

    await this.prisma.$transaction(async (transaction) => {
      const existingSteps = await transaction.boardStep.findMany({
        where: { boardId },
        select: { id: true }
      });
      const requestedIds = new Set(data.orderedStepIds);

      if (existingSteps.length !== data.orderedStepIds.length || existingSteps.some((step) => !requestedIds.has(step.id))) {
        throw new AppError(400, "INVALID_BOARD_STEP_ORDER", "La lista debe incluir todos los pasos de la pizarra.");
      }

      await this.writeStepOrder(transaction, data.orderedStepIds);
      await this.createAuditLog(transaction, requester.id, "BOARD_STEPS_REORDERED", "EvidenceBoard", boardId, this.boardAuditMeta(board));
    });

    return this.findBoardById(boardId);
  }

  public async deleteStep(boardId: string, stepId: string, requester: AuthenticatedUser): Promise<BoardWithContent> {
    const board = await this.ensureBoardAccess(boardId, requester, "write");
    await this.ensureStepInBoard(boardId, stepId);

    await this.prisma.$transaction(async (transaction) => {
      await transaction.boardStep.delete({ where: { id: stepId } });
      const remainingSteps = await transaction.boardStep.findMany({
        where: { boardId },
        select: { id: true },
        orderBy: { order: "asc" }
      });
      await this.writeStepOrder(transaction, remainingSteps.map((step) => step.id));
      await this.createAuditLog(transaction, requester.id, "BOARD_STEP_DELETED", "BoardStep", stepId, this.boardAuditMeta(board));
    });

    return this.findBoardById(boardId);
  }

  public async createConnection(boardId: string, data: CreateBoardConnectionInput, requester: AuthenticatedUser): Promise<BoardWithContent> {
    const board = await this.ensureBoardAccess(boardId, requester, "write");

    if (data.fromCardId === data.toCardId) {
      throw new AppError(400, "INVALID_BOARD_CONNECTION", "La conexión debe unir dos tarjetas distintas.");
    }

    await this.ensureCardsInBoard(boardId, [data.fromCardId, data.toCardId]);

    await this.prisma.$transaction(async (transaction) => {
      const connection = await transaction.boardConnection.upsert({
        where: { boardId_fromCardId_toCardId: { boardId, fromCardId: data.fromCardId, toCardId: data.toCardId } },
        create: {
          boardId,
          fromCardId: data.fromCardId,
          toCardId: data.toCardId,
          label: data.label ?? null,
          color: data.color ?? "#dc2626"
        },
        update: {
          label: data.label ?? null,
          color: data.color ?? "#dc2626"
        }
      });
      await this.createAuditLog(transaction, requester.id, "BOARD_CONNECTION_CREATED", "BoardConnection", connection.id, this.boardAuditMeta(board));
    });

    return this.findBoardById(boardId);
  }

  public async updateConnection(boardId: string, connectionId: string, data: UpdateBoardConnectionInput, requester: AuthenticatedUser): Promise<BoardWithContent> {
    const board = await this.ensureBoardAccess(boardId, requester, "write");
    await this.ensureConnectionInBoard(boardId, connectionId);
    const updateData: Prisma.BoardConnectionUncheckedUpdateInput = {};

    if (data.label !== undefined) updateData.label = data.label;
    if (data.color !== undefined) updateData.color = data.color;

    await this.prisma.$transaction(async (transaction) => {
      await transaction.boardConnection.update({ where: { id: connectionId }, data: updateData });
      await this.createAuditLog(transaction, requester.id, "BOARD_CONNECTION_UPDATED", "BoardConnection", connectionId, this.boardAuditMeta(board));
    });

    return this.findBoardById(boardId);
  }

  public async deleteConnection(boardId: string, connectionId: string, requester: AuthenticatedUser): Promise<BoardWithContent> {
    const board = await this.ensureBoardAccess(boardId, requester, "write");
    await this.ensureConnectionInBoard(boardId, connectionId);

    await this.prisma.$transaction(async (transaction) => {
      await transaction.boardConnection.delete({ where: { id: connectionId } });
      await this.createAuditLog(transaction, requester.id, "BOARD_CONNECTION_DELETED", "BoardConnection", connectionId, this.boardAuditMeta(board));
    });

    return this.findBoardById(boardId);
  }

  private async findBoardById(boardId: string): Promise<BoardWithContent> {
    const board = await this.prisma.evidenceBoard.findUnique({ where: { id: boardId }, include: BOARD_INCLUDE });

    if (board === null) {
      throw new AppError(404, "EVIDENCE_BOARD_NOT_FOUND", "No se encontró la pizarra solicitada.");
    }

    return board;
  }

  private async validateCardPayload(boardId: string, data: CreateBoardCardInput): Promise<void> {
    if (data.type === "EVIDENCE" && data.fileId === undefined && data.imageUrl === undefined) {
      throw new AppError(400, "EVIDENCE_REQUIRED", "La tarjeta de evidencia necesita un archivo o una URL de imagen.");
    }

    if (data.type === "ENTITY" && (data.entityType === undefined || data.entityType === null || data.entityId === undefined || data.entityId === null)) {
      throw new AppError(400, "ENTITY_REQUIRED", "La tarjeta de entidad necesita tipo e identificador.");
    }

    await this.validateUpdatedFile(boardId, data.fileId);
  }

  private async validateUpdatedFile(boardId: string, fileId: string | null | undefined): Promise<void> {
    if (fileId === undefined || fileId === null) {
      return;
    }

    const file = await this.prisma.file.findUnique({ where: { id: fileId }, select: { evidenceBoardId: true } });

    if (file === null || file.evidenceBoardId !== boardId) {
      throw new AppError(400, "INVALID_BOARD_FILE", "El archivo no pertenece a esta pizarra.");
    }
  }

  private async resolveCardTitle(data: CreateBoardCardInput): Promise<string> {
    if (data.title !== undefined && data.title.trim().length > 0) {
      return data.title.trim();
    }

    if (data.type === "NOTE") {
      return "Nota";
    }

    if (data.type === "EVIDENCE") {
      if (data.fileId !== undefined && data.fileId !== null) {
        const file = await this.prisma.file.findUnique({ where: { id: data.fileId }, select: { originalName: true } });
        return file?.originalName ?? "Evidencia";
      }

      return "Evidencia";
    }

    if (data.entityType !== undefined && data.entityType !== null && data.entityId !== undefined && data.entityId !== null) {
      const summary = await this.resolveEntitySummary(data.entityType, data.entityId);
      return summary.title;
    }

    return "Entidad vinculada";
  }

  private async resolveEntitySummary(entityType: string, entityId: string): Promise<EntitySummary> {
    if (entityType === "subject") {
      const subject = await this.prisma.subject.findUnique({ where: { id: entityId }, select: { firstName: true, lastName: true, alias: true } });

      if (subject === null) throw new AppError(404, "SUBJECT_NOT_FOUND", "No se encontró el sujeto solicitado.");
      return { title: `${subject.firstName} ${subject.lastName}`, description: subject.alias };
    }

    if (entityType === "investigation") {
      const investigation = await this.prisma.investigation.findUnique({ where: { id: entityId }, select: { caseNumber: true, title: true } });

      if (investigation === null) throw new AppError(404, "INVESTIGATION_NOT_FOUND", "No se encontró la investigación solicitada.");
      return { title: `${investigation.caseNumber} - ${investigation.title}`, description: null };
    }

    if (entityType === "property") {
      const property = await this.prisma.property.findUnique({ where: { id: entityId }, select: { address: true, zone: true } });

      if (property === null) throw new AppError(404, "PROPERTY_NOT_FOUND", "No se encontró la propiedad solicitada.");
      return { title: property.address, description: property.zone };
    }

    if (entityType === "organization") {
      const organization = await this.prisma.criminalOrganization.findUnique({ where: { id: entityId }, select: { name: true, alias: true } });

      if (organization === null) throw new AppError(404, "ORGANIZATION_NOT_FOUND", "No se encontró la organización solicitada.");
      return { title: organization.name, description: organization.alias };
    }

    const document = await this.prisma.document.findUnique({ where: { id: entityId }, select: { documentNumber: true, title: true } });

    if (document === null) throw new AppError(404, "DOCUMENT_NOT_FOUND", "No se encontró el documento solicitado.");
    return { title: `${document.documentNumber} - ${document.title}`, description: null };
  }

  private buildCardCreateData(boardId: string, data: CreateBoardCardInput, title: string, createdById: string): Prisma.BoardCardUncheckedCreateInput {
    const createData: Prisma.BoardCardUncheckedCreateInput = {
      boardId,
      type: this.toCardType(data.type),
      title,
      createdById
    };

    if (data.text !== undefined) createData.text = data.text;
    if (data.color !== undefined) createData.color = data.color;
    if (data.x !== undefined) createData.x = data.x;
    if (data.y !== undefined) createData.y = data.y;
    if (data.width !== undefined) createData.width = data.width;
    if (data.height !== undefined) createData.height = data.height;
    if (data.rotation !== undefined) createData.rotation = data.rotation;
    if (data.zIndex !== undefined) createData.zIndex = data.zIndex;
    if (data.fileId !== undefined) createData.fileId = data.fileId;
    if (data.imageUrl !== undefined) createData.imageUrl = data.imageUrl;
    if (data.eventDate !== undefined) createData.eventDate = data.eventDate === null ? null : new Date(data.eventDate);
    if (data.entityType !== undefined) createData.entityType = data.entityType;
    if (data.entityId !== undefined) createData.entityId = data.entityId;

    return createData;
  }

  private buildCardUpdateData(data: UpdateBoardCardInput): Prisma.BoardCardUncheckedUpdateInput {
    const updateData: Prisma.BoardCardUncheckedUpdateInput = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.text !== undefined) updateData.text = data.text;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.x !== undefined) updateData.x = data.x;
    if (data.y !== undefined) updateData.y = data.y;
    if (data.width !== undefined) updateData.width = data.width;
    if (data.height !== undefined) updateData.height = data.height;
    if (data.rotation !== undefined) updateData.rotation = data.rotation;
    if (data.zIndex !== undefined) updateData.zIndex = data.zIndex;
    if (data.fileId !== undefined) updateData.fileId = data.fileId;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.eventDate !== undefined) updateData.eventDate = data.eventDate === null ? null : new Date(data.eventDate);
    if (data.entityType !== undefined) updateData.entityType = data.entityType;
    if (data.entityId !== undefined) updateData.entityId = data.entityId;

    return updateData;
  }

  private async ensureCardInBoard(boardId: string, cardId: string): Promise<void> {
    const card = await this.prisma.boardCard.findFirst({ where: { id: cardId, boardId }, select: { id: true } });

    if (card === null) {
      throw new AppError(404, "BOARD_CARD_NOT_FOUND", "No se encontró la tarjeta solicitada.");
    }
  }

  private async ensureStepInBoard(boardId: string, stepId: string): Promise<void> {
    const step = await this.prisma.boardStep.findFirst({ where: { id: stepId, boardId }, select: { id: true } });

    if (step === null) {
      throw new AppError(404, "BOARD_STEP_NOT_FOUND", "No se encontró el paso solicitado.");
    }
  }

  private async writeStepOrder(transaction: Prisma.TransactionClient, orderedStepIds: readonly string[]): Promise<void> {
    for (const [index, stepId] of orderedStepIds.entries()) {
      await transaction.boardStep.update({ where: { id: stepId }, data: { order: -(index + 1) } });
    }

    for (const [index, stepId] of orderedStepIds.entries()) {
      await transaction.boardStep.update({ where: { id: stepId }, data: { order: index + 1 } });
    }
  }

  private async ensureCardsInBoard(boardId: string, cardIds: readonly string[]): Promise<void> {
    const count = await this.prisma.boardCard.count({ where: { boardId, id: { in: [...cardIds] } } });

    if (count !== cardIds.length) {
      throw new AppError(404, "BOARD_CARD_NOT_FOUND", "Una o varias tarjetas no pertenecen a la pizarra.");
    }
  }

  private async ensureConnectionInBoard(boardId: string, connectionId: string): Promise<void> {
    const connection = await this.prisma.boardConnection.findFirst({ where: { id: connectionId, boardId }, select: { id: true } });

    if (connection === null) {
      throw new AppError(404, "BOARD_CONNECTION_NOT_FOUND", "No se encontró la conexión solicitada.");
    }
  }

  private async ensureBoardAccess(boardId: string, requester: AuthenticatedUser, access: "read" | "write") {
    const board = await this.prisma.evidenceBoard.findUnique({
      where: { id: boardId },
      include: { investigation: { include: { participants: { where: { userId: requester.id } } } } }
    });

    if (board === null) {
      throw new AppError(404, "EVIDENCE_BOARD_NOT_FOUND", "No se encontró la pizarra solicitada.");
    }

    if (board.scope === BoardScope.GLOBAL) {
      if (board.ownerId !== requester.id) {
        throw new AppError(403, "FORBIDDEN", "No tienes permisos sobre esta pizarra global.");
      }

      return board;
    }

    if (board.scope === BoardScope.SUBJECT) {
      if (board.subjectId === null) {
        throw new AppError(404, "SUBJECT_NOT_FOUND", "No se encontró el sujeto asociado a la pizarra.");
      }

      await this.ensureScopedAccess(BoardScope.SUBJECT, board.subjectId, requester, access);
      return board;
    }

    if (board.investigationId === null) {
      throw new AppError(404, "INVESTIGATION_NOT_FOUND", "No se encontró la investigación asociada a la pizarra.");
    }

    await this.ensureScopedAccess(BoardScope.INVESTIGATION, board.investigationId, requester, access);
    return board;
  }

  private async ensureScopedAccess(scope: BoardScope, targetId: string, requester: AuthenticatedUser, access: "read" | "write"): Promise<void> {
    if (scope === BoardScope.SUBJECT) {
      const subject = await this.prisma.subject.findUnique({ where: { id: targetId }, select: { id: true } });

      if (subject === null) {
        throw new AppError(404, "SUBJECT_NOT_FOUND", "No se encontró el sujeto solicitado.");
      }

      if (!hasPermission(requester.role, Permission.VIEW_SUBJECTS) || (access === "write" && !hasPermission(requester.role, Permission.MANAGE_SUBJECTS))) {
        throw new AppError(403, "FORBIDDEN", "No tienes permisos sobre la pizarra del sujeto.");
      }

      return;
    }

    const investigation = await this.prisma.investigation.findUnique({
      where: { id: targetId },
      include: { participants: { where: { userId: requester.id } } }
    });

    if (investigation === null) {
      throw new AppError(404, "INVESTIGATION_NOT_FOUND", "No se encontró la investigación solicitada.");
    }

    const canRead = hasPermission(requester.role, Permission.VIEW_ALL_INVESTIGATIONS) || investigation.leadFiscalId === requester.id || investigation.participants.length > 0;
    const canWrite = canRead && hasPermission(requester.role, Permission.EDIT_INVESTIGATION);

    if (!canRead || (access === "write" && !canWrite)) {
      throw new AppError(403, "FORBIDDEN", "No tienes permisos sobre la pizarra de la investigación.");
    }
  }

  private async ensureEntityAccess(data: CreateBoardCardInput, requester: AuthenticatedUser): Promise<void> {
    if (data.entityType === undefined || data.entityType === null || data.entityId === undefined || data.entityId === null) {
      return;
    }

    if (data.entityType === "subject" || data.entityType === "organization") {
      if (!hasPermission(requester.role, Permission.VIEW_SUBJECTS)) {
        throw new AppError(403, "FORBIDDEN", "No tienes permisos para vincular esta entidad.");
      }
      return;
    }

    if (data.entityType === "investigation") {
      await this.ensureScopedAccess(BoardScope.INVESTIGATION, data.entityId, requester, "read");
      return;
    }

    if (data.entityType === "property") {
      await ensurePropertyAccess(this.prisma, requester, data.entityId, "read");
      return;
    }

    const document = await this.prisma.document.findUnique({ where: { id: data.entityId }, select: { id: true, investigationId: true } });

    if (document === null) {
      throw new AppError(404, "DOCUMENT_NOT_FOUND", "No se encontró el documento solicitado.");
    }

    if (document.investigationId !== null) {
      await this.ensureScopedAccess(BoardScope.INVESTIGATION, document.investigationId, requester, "read");
      return;
    }

    if (!hasPermission(requester.role, Permission.VIEW_SUBJECTS)) {
      throw new AppError(403, "FORBIDDEN", "No tienes permisos para vincular este documento.");
    }
  }

  private async ensureUpdatedEntityAccess(data: UpdateBoardCardInput, requester: AuthenticatedUser): Promise<void> {
    if (data.entityType === undefined || data.entityType === null || data.entityId === undefined || data.entityId === null) {
      return;
    }

    await this.ensureEntityAccess(
      {
        type: "ENTITY",
        entityType: data.entityType,
        entityId: data.entityId
      },
      requester
    );
  }

  private ensureGlobalRead(requester: AuthenticatedUser): void {
    if (!hasPermission(requester.role, Permission.VIEW_ALL_INVESTIGATIONS)) {
      throw new AppError(403, "FORBIDDEN", "No tienes permisos para ver pizarras globales.");
    }
  }

  private toBoardScope(scope: BoardScopeParam): BoardScope {
    return scope === "subject" ? BoardScope.SUBJECT : BoardScope.INVESTIGATION;
  }

  private toCardType(type: CreateBoardCardInput["type"]): BoardCardType {
    if (type === "EVIDENCE") return BoardCardType.EVIDENCE;
    if (type === "NOTE") return BoardCardType.NOTE;
    return BoardCardType.ENTITY;
  }

  private boardAuditMeta(board: { scope: BoardScope; title: string; subjectId: string | null; investigationId: string | null }): Prisma.InputJsonObject {
    return {
      scope: board.scope,
      title: board.title,
      subjectId: board.subjectId,
      investigationId: board.investigationId
    };
  }

  private async createAuditLog(
    transaction: Prisma.TransactionClient,
    userId: string,
    action: string,
    entity: string,
    entityId: string,
    meta: Prisma.InputJsonObject
  ): Promise<void> {
    const investigationId = typeof meta.investigationId === "string" ? meta.investigationId : undefined;
    const data: Prisma.AuditLogUncheckedCreateInput = {
      userId,
      action,
      entity,
      entityId,
      meta
    };

    if (investigationId !== undefined) {
      data.investigationId = investigationId;
    }

    await transaction.auditLog.create({
      data
    });
  }
}
