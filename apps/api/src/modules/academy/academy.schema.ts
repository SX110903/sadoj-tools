import { z } from "zod";
import { AcademyContentType } from "../../shared/prisma";

const OptionalTextSchema = z.string().trim().max(10000).nullable().optional();
const OptionalDateSchema = z.string().datetime().nullable().optional();
const OptionalIdSchema = z.string().min(1).max(100).nullable().optional();
const HttpUrlSchema = z.string().trim().url().max(2000).refine((value) => {
  const protocol = new URL(value).protocol;
  return protocol === "http:" || protocol === "https:";
}, "El enlace debe usar HTTP o HTTPS.");

export const AcademyContentParamsSchema = z.object({ id: z.string().cuid() });
export const AcademyClassParamsSchema = z.object({ id: z.string().min(1).max(100) });
export const AcademyUserParamsSchema = z.object({ id: z.string().cuid() });

export const AcademyContentQuerySchema = z.object({
  type: z.nativeEnum(AcademyContentType).optional(),
  classId: z.string().min(1).max(100).optional()
});

export const CreateAcademyContentSchema = z.object({
  type: z.nativeEnum(AcademyContentType),
  title: z.string().trim().min(3).max(200),
  body: OptionalTextSchema,
  videoUrl: HttpUrlSchema.nullable().optional(),
  fileId: z.string().cuid().nullable().optional(),
  classId: OptionalIdSchema
}).superRefine(validateContentFields);

export const UpdateAcademyContentSchema = z.object({
  type: z.nativeEnum(AcademyContentType).optional(),
  title: z.string().trim().min(3).max(200).optional(),
  body: OptionalTextSchema,
  videoUrl: HttpUrlSchema.nullable().optional(),
  fileId: z.string().cuid().nullable().optional(),
  classId: OptionalIdSchema
}).refine((value) => Object.values(value).some((field) => field !== undefined), {
  message: "Debes indicar al menos un campo para actualizar."
});

export const CreateAcademyClassSchema = z.object({
  number: z.number().int().min(1).max(5),
  title: z.string().trim().min(3).max(160),
  description: OptionalTextSchema,
  scheduledAt: OptionalDateSchema,
  instructorId: OptionalIdSchema
});

export const UpdateAcademyClassSchema = CreateAcademyClassSchema.partial().refine(
  (value) => Object.values(value).some((field) => field !== undefined),
  { message: "Debes indicar al menos un campo para actualizar." }
);

const AttendanceEntrySchema = z.object({
  userId: z.string().cuid(),
  present: z.boolean()
});

export const MarkAttendanceSchema = z.union([
  AttendanceEntrySchema,
  z.object({ entries: z.array(AttendanceEntrySchema).min(1).max(200) })
]).transform((value) => "entries" in value ? value.entries : [value]);

function validateContentFields(value: {
  type: AcademyContentType;
  body?: string | null | undefined;
  videoUrl?: string | null | undefined;
}, context: z.RefinementCtx): void {
  if ((value.type === AcademyContentType.NOTE || value.type === AcademyContentType.REGULATION) && (value.body === undefined || value.body === null || value.body === "")) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["body"], message: "Este tipo de contenido requiere texto." });
  }
  if (value.type === AcademyContentType.VIDEO && (value.videoUrl === undefined || value.videoUrl === null)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["videoUrl"], message: "El vídeo requiere un enlace válido." });
  }
}

export type AcademyContentQueryInput = z.infer<typeof AcademyContentQuerySchema>;
export type CreateAcademyContentInput = z.infer<typeof CreateAcademyContentSchema>;
export type UpdateAcademyContentInput = z.infer<typeof UpdateAcademyContentSchema>;
export type CreateAcademyClassInput = z.infer<typeof CreateAcademyClassSchema>;
export type UpdateAcademyClassInput = z.infer<typeof UpdateAcademyClassSchema>;
export type MarkAttendanceInput = z.infer<typeof MarkAttendanceSchema>;
