import { SanctionType } from "../../shared/prisma";
import { z } from "zod";

export const SanctionParamsSchema = z.object({
  id: z.string().min(1)
});

export const UserSanctionsParamsSchema = z.object({
  userId: z.string().min(1)
});

export const SanctionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  userId: z.string().min(1).optional(),
  type: z.nativeEnum(SanctionType).optional(),
  active: z.coerce.boolean().optional()
});

export const CreateSanctionSchema = z.object({
  userId: z.string().min(1),
  type: z.nativeEnum(SanctionType),
  description: z.string().trim().min(20),
  severity: z.coerce.number().int().min(1).max(5)
});

export const ResolveSanctionSchema = z.object({
  resolvedNotes: z.string().trim().min(5).optional()
});

export type SanctionsQueryInput = z.infer<typeof SanctionsQuerySchema>;
export type CreateSanctionInput = z.infer<typeof CreateSanctionSchema>;
export type ResolveSanctionInput = z.infer<typeof ResolveSanctionSchema>;
