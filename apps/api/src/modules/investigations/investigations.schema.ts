import { AccessLevel, InvestigationPriority, InvestigationStatus, InvestigationType } from "../../shared/prisma";
import { z } from "zod";

export const InvestigationParamsSchema = z.object({
  id: z.string().min(1)
});

export const InvestigationSubjectParamsSchema = z.object({
  id: z.string().min(1),
  subjectId: z.string().min(1)
});

export const InvestigationParticipantParamsSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1)
});

export const InvestigationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.nativeEnum(InvestigationStatus).optional(),
  type: z.nativeEnum(InvestigationType).optional(),
  priority: z.nativeEnum(InvestigationPriority).optional(),
  search: z.string().trim().min(1).optional()
});

export const CreateInvestigationSchema = z.object({
  title: z.string().trim().min(3),
  description: z.string().trim().min(10),
  type: z.nativeEnum(InvestigationType),
  priority: z.nativeEnum(InvestigationPriority).default(InvestigationPriority.MEDIUM),
  legalBasis: z.string().trim().optional()
});

export const UpdateInvestigationSchema = CreateInvestigationSchema.partial().extend({
  status: z.nativeEnum(InvestigationStatus).optional()
});

export const ChangeStatusSchema = z.object({
  status: z.nativeEnum(InvestigationStatus)
});

export const ShareInvestigationSchema = z.object({
  userId: z.string().min(1),
  accessLevel: z.nativeEnum(AccessLevel)
});

export const LinkSubjectSchema = z.object({
  subjectId: z.string().min(1),
  role: z.string().trim().min(2),
  notes: z.string().trim().optional()
});

export type InvestigationsQueryInput = z.infer<typeof InvestigationsQuerySchema>;
export type CreateInvestigationInput = z.infer<typeof CreateInvestigationSchema>;
export type UpdateInvestigationInput = z.infer<typeof UpdateInvestigationSchema>;
export type ShareInvestigationInput = z.infer<typeof ShareInvestigationSchema>;
export type LinkSubjectInput = z.infer<typeof LinkSubjectSchema>;

