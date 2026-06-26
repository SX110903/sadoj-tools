import { Prisma } from "./prisma";

export function isUniqueConstraintError(error: unknown, fields: readonly string[]): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
    return false;
  }

  const target = error.meta?.target;

  if (typeof target === "string") {
    return fields.every((field) => target.includes(field));
  }

  if (!Array.isArray(target) || !target.every((field): field is string => typeof field === "string")) {
    return false;
  }

  return fields.every((field) => target.includes(field));
}
