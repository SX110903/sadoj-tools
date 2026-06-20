import type { PrismaClient } from "../prisma";

const CASE_NUMBER_PADDING = 4;

export async function generateCaseNumber(prisma: PrismaClient, now = new Date()): Promise<string> {
  const year = now.getUTCFullYear();
  const prefix = `SADOJ-${year}-`;
  const count = await prisma.investigation.count({
    where: {
      caseNumber: {
        startsWith: prefix
      }
    }
  });
  const sequence = String(count + 1).padStart(CASE_NUMBER_PADDING, "0");

  return `${prefix}${sequence}`;
}

