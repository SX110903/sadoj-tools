import { isUniqueConstraintError } from "../prisma-errors";

const DEFAULT_RETRIES = 3;

/**
 * Retries an operation that can lose a unique-constraint race (Prisma P2002),
 * such as a correlative number computed with COUNT/MAX + 1 under concurrency.
 *
 * The operation MUST recompute the colliding value on each attempt, so pass the
 * whole "generate number + create" block — not just the create. Pass the unique
 * field(s) to retry only on the expected collision; omit to retry on any P2002.
 */
export async function withUniqueRetry<T>(
  operation: () => Promise<T>,
  fields: readonly string[] = [],
  retries = DEFAULT_RETRIES
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (isUniqueConstraintError(error, fields)) {
        lastError = error;
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}
