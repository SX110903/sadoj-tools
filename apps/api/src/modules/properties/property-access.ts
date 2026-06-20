import { hasPermission, Permission, ROLE_LEVEL, RoleType } from "@sadoj/shared";
import { AccessLevel, type PrismaClient, Prisma } from "../../shared/prisma";
import { AppError } from "../../shared/errors/AppError";
import type { AuthenticatedUser } from "../../types/fastify";

export type PropertyAccessRequirement = "read" | "write" | "admin";

type PropertyAccessClient = Pick<PrismaClient, "propertyMember"> | Pick<Prisma.TransactionClient, "propertyMember">;

const ACCESS_LEVEL_RANK: Readonly<Record<AccessLevel, number>> = {
  [AccessLevel.READ]: 1,
  [AccessLevel.WRITE]: 2,
  [AccessLevel.ADMIN]: 3
};

const REQUIRED_ACCESS_RANK: Readonly<Record<PropertyAccessRequirement, number>> = {
  read: ACCESS_LEVEL_RANK[AccessLevel.READ],
  write: ACCESS_LEVEL_RANK[AccessLevel.WRITE],
  admin: ACCESS_LEVEL_RANK[AccessLevel.ADMIN]
};

export function hasGlobalPropertyAccess(requester: AuthenticatedUser): boolean {
  return ROLE_LEVEL[requester.role] >= ROLE_LEVEL[RoleType.FISCAL_DIVISION] || hasPermission(requester.role, Permission.MANAGE_SUBJECTS);
}

export async function canAccessProperty(
  prisma: PropertyAccessClient,
  requester: AuthenticatedUser,
  propertyId: string,
  required: PropertyAccessRequirement
): Promise<boolean> {
  if (hasGlobalPropertyAccess(requester)) {
    return true;
  }

  const member = await prisma.propertyMember.findUnique({
    where: { propertyId_userId: { propertyId, userId: requester.id } },
    select: { accessLevel: true }
  });

  return member !== null && ACCESS_LEVEL_RANK[member.accessLevel] >= REQUIRED_ACCESS_RANK[required];
}

export async function ensurePropertyAccess(
  prisma: PropertyAccessClient,
  requester: AuthenticatedUser,
  propertyId: string,
  required: PropertyAccessRequirement
): Promise<void> {
  const allowed = await canAccessProperty(prisma, requester, propertyId, required);

  if (!allowed) {
    throw new AppError(403, "PROPERTY_ACCESS_DENIED", "No tienes acceso suficiente al expediente de esta propiedad.");
  }
}
