import { z } from "zod";
import { CandidateStatus, InterviewResult } from "../../shared/prisma";

const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
const USERNAME_REGEX = /^[A-Za-z0-9._-]+$/;
const OptionalTextSchema = z.string().trim().max(5000).nullable().optional();
const OptionalDateSchema = z.string().datetime().nullable().optional();

export const CandidateParamsSchema = z.object({
  id: z.string().cuid()
});

export const CandidatesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.nativeEnum(CandidateStatus).optional(),
  search: z.string().trim().min(1).max(160).optional()
});

export const CreateCandidateSchema = z.object({
  fullName: z.string().trim().min(2).max(160),
  contact: z.string().trim().max(240).nullable().optional(),
  notes: OptionalTextSchema
});

export const UpdateCandidateSchema = CreateCandidateSchema.partial().extend({
  status: z.nativeEnum(CandidateStatus).optional()
});

const InterviewFieldsSchema = z.object({
  interviewerId: z.string().cuid().optional(),
  scheduledAt: OptionalDateSchema,
  conductedAt: OptionalDateSchema,
  score: z.number().int().min(0).max(100).nullable().optional(),
  result: z.nativeEnum(InterviewResult).optional(),
  feedback: OptionalTextSchema
});

export const CreateInterviewSchema = InterviewFieldsSchema;
export const UpdateInterviewSchema = InterviewFieldsSchema.refine(
  (value) => Object.values(value).some((field) => field !== undefined),
  { message: "Debes indicar al menos un campo para actualizar." }
);

export const ApproveCandidateSchema = z.object({
  username: z.string().trim().min(3).max(40).regex(USERNAME_REGEX, "El usuario contiene caracteres no permitidos."),
  password: z.string().max(128).regex(STRONG_PASSWORD_REGEX, "La contraseña debe tener mayúsculas, minúsculas, números y símbolos."),
  email: z.string().trim().email().nullable().optional(),
  badgeNumber: z.string().trim().min(1).max(40).nullable().optional()
});

export const RejectCandidateSchema = z.object({
  reason: z.string().trim().min(3).max(1000).optional()
});

export type CandidatesQueryInput = z.infer<typeof CandidatesQuerySchema>;
export type CreateCandidateInput = z.infer<typeof CreateCandidateSchema>;
export type UpdateCandidateInput = z.infer<typeof UpdateCandidateSchema>;
export type CreateInterviewInput = z.infer<typeof CreateInterviewSchema>;
export type UpdateInterviewInput = z.infer<typeof UpdateInterviewSchema>;
export type ApproveCandidateInput = z.infer<typeof ApproveCandidateSchema>;
export type RejectCandidateInput = z.infer<typeof RejectCandidateSchema>;
