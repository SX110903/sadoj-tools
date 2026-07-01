import { AppError } from "../../shared/errors/AppError";
import { NotificationType, Prisma, type PrismaClient } from "../../shared/prisma";
import type { AuthenticatedUser } from "../../types/fastify";
import { NotificationsService } from "../notifications/notifications.service";
import type { AwardDecorationInput, CreateDecorationInput, UpdateDecorationInput } from "./decorations.schema";

const AWARD_INCLUDE = {
  decoration: true,
  awardedBy: { select: { id: true, displayName: true, role: true, avatar: true } }
} satisfies Prisma.DecorationAwardInclude;

export class DecorationsService {
  public constructor(private readonly prisma: PrismaClient) {}

  public async listCatalog(): Promise<unknown[]> {
    return this.prisma.decoration.findMany({ orderBy: [{ tier: "desc" }, { name: "asc" }] });
  }

  public async createDecoration(data: CreateDecorationInput, actor: AuthenticatedUser): Promise<unknown> {
    const createData: Prisma.DecorationCreateInput = {
      name: data.name,
      description: data.description
    };
    if (data.icon !== undefined) createData.icon = data.icon;
    if (data.color !== undefined) createData.color = data.color;
    if (data.tier !== undefined) createData.tier = data.tier;

    return this.prisma.$transaction(async (transaction) => {
      const decoration = await transaction.decoration.create({ data: createData });

      await transaction.auditLog.create({
        data: {
          userId: actor.id,
          action: "CREATE_DECORATION",
          entity: "Decoration",
          entityId: decoration.id,
          meta: { name: decoration.name, tier: decoration.tier }
        }
      });

      return decoration;
    });
  }

  public async updateDecoration(id: string, data: UpdateDecorationInput, actor: AuthenticatedUser): Promise<unknown> {
    await this.findDecorationOrThrow(id);

    const updateData: Prisma.DecorationUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.tier !== undefined) updateData.tier = data.tier;

    return this.prisma.$transaction(async (transaction) => {
      const decoration = await transaction.decoration.update({ where: { id }, data: updateData });

      await transaction.auditLog.create({
        data: { userId: actor.id, action: "UPDATE_DECORATION", entity: "Decoration", entityId: id, meta: { name: decoration.name } }
      });

      return decoration;
    });
  }

  public async deleteDecoration(id: string, actor: AuthenticatedUser): Promise<void> {
    const decoration = await this.findDecorationOrThrow(id);

    await this.prisma.$transaction(async (transaction) => {
      await transaction.decoration.delete({ where: { id } });
      await transaction.auditLog.create({
        data: { userId: actor.id, action: "DELETE_DECORATION", entity: "Decoration", entityId: id, meta: { name: decoration.name } }
      });
    });
  }

  public async listUserAwards(userId: string): Promise<unknown[]> {
    await this.findUserOrThrow(userId);

    return this.prisma.decorationAward.findMany({
      where: { userId },
      orderBy: { awardedAt: "desc" },
      include: AWARD_INCLUDE
    });
  }

  public async award(userId: string, data: AwardDecorationInput, actor: AuthenticatedUser): Promise<unknown> {
    await this.findUserOrThrow(userId);
    const decoration = await this.findDecorationOrThrow(data.decorationId);

    const created = await this.prisma.$transaction(async (transaction) => {
      const awarded = await transaction.decorationAward.create({
        data: {
          decorationId: data.decorationId,
          userId,
          awardedById: actor.id,
          reason: data.reason ?? null
        },
        include: AWARD_INCLUDE
      });

      await transaction.auditLog.create({
        data: {
          userId: actor.id,
          action: "AWARD_DECORATION",
          entity: "DecorationAward",
          entityId: awarded.id,
          meta: { targetUserId: userId, decorationId: data.decorationId, name: decoration.name }
        }
      });

      return awarded;
    });

    await new NotificationsService(this.prisma).notify({
      recipientId: userId,
      actorId: actor.id,
      type: NotificationType.DECORATION_AWARDED,
      title: "Condecoración otorgada",
      message: `Has recibido la condecoración «${decoration.name}».`,
      link: "/perfil",
      meta: { awardId: created.id, decorationId: decoration.id, name: decoration.name }
    });

    return created;
  }

  public async revoke(userId: string, awardId: string, actor: AuthenticatedUser): Promise<void> {
    const award = await this.prisma.decorationAward.findFirst({
      where: { id: awardId, userId },
      include: { decoration: { select: { name: true } } }
    });

    if (award === null) {
      throw new AppError(404, "DECORATION_AWARD_NOT_FOUND", "No se encontró la condecoración otorgada.");
    }

    await this.prisma.$transaction(async (transaction) => {
      await transaction.decorationAward.delete({ where: { id: awardId } });
      await transaction.auditLog.create({
        data: {
          userId: actor.id,
          action: "REVOKE_DECORATION",
          entity: "DecorationAward",
          entityId: awardId,
          meta: { targetUserId: userId, name: award.decoration.name }
        }
      });
    });
  }

  private async findDecorationOrThrow(id: string): Promise<{ id: string; name: string }> {
    const decoration = await this.prisma.decoration.findUnique({ where: { id }, select: { id: true, name: true } });

    if (decoration === null) {
      throw new AppError(404, "DECORATION_NOT_FOUND", "No se encontró la condecoración solicitada.");
    }

    return decoration;
  }

  private async findUserOrThrow(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } });

    if (user === null) {
      throw new AppError(404, "USER_NOT_FOUND", "No se encontró el fiscal solicitado.");
    }
  }
}
