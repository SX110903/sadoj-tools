import { WarrantResult, WarrantStatus, WarrantType } from "../../shared/prisma";
import { z } from "zod";

export const WarrantParamsSchema = z.object({
  id: z.string().min(1)
});

export const WarrantsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.nativeEnum(WarrantStatus).optional(),
  type: z.nativeEnum(WarrantType).optional(),
  investigationId: z.string().min(1).optional()
});

export const CreateWarrantSchema = z.object({
  investigationId: z.string().min(1),
  type: z.nativeEnum(WarrantType),
  title: z.string().trim().min(3).max(180),
  description: z.string().trim().min(10),
  location: z.string().trim().min(3).max(240),
  justification: z.string().trim().min(10),
  legalBasis: z.string().trim().min(3),
  propertyId: z.string().trim().min(1).nullable().optional()
});

export const RejectWarrantSchema = z.object({
  reason: z.string().trim().min(10)
});

export const ExecuteWarrantSchema = z.object({
  executionNotes: z.string().trim().min(2)
});

export const CreateWarrantReportSchema = z.object({
  result: z.nativeEnum(WarrantResult),
  findings: z.string().trim().min(10),
  evidence: z.string().trim().max(2000).optional(),
  persons: z.string().trim().max(2000).optional(),
  participatingAgencies: z.string().trim().max(1000).optional(),
  notes: z.string().trim().max(2000).optional()
});

export type WarrantsQueryInput = z.infer<typeof WarrantsQuerySchema>;
export type CreateWarrantInput = z.infer<typeof CreateWarrantSchema>;
export type RejectWarrantInput = z.infer<typeof RejectWarrantSchema>;
export type ExecuteWarrantInput = z.infer<typeof ExecuteWarrantSchema>;
export type CreateWarrantReportInput = z.infer<typeof CreateWarrantReportSchema>;
