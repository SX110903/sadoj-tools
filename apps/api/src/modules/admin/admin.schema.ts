import { z } from "zod";

export const AdminAuditQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(30),
  action: z.string().trim().min(1).max(120).optional(),
  entity: z.string().trim().min(1).max(120).optional(),
  userId: z.string().min(1).optional()
});

export type AdminAuditQueryInput = z.infer<typeof AdminAuditQuerySchema>;
