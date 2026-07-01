import { z } from "zod";

export const FileTargetTypeSchema = z.enum(["investigation", "subject", "warrant", "note", "warrantReport", "propertyIncident", "evidenceBoard", "academyContent"]);

export const FileUploadQuerySchema = z.object({
  targetType: FileTargetTypeSchema,
  targetId: z.string().min(1)
});

export const FilesQuerySchema = FileUploadQuerySchema;

export const FileParamsSchema = z.object({
  id: z.string().min(1)
});

export type FileTargetType = z.infer<typeof FileTargetTypeSchema>;
export type FileUploadQueryInput = z.infer<typeof FileUploadQuerySchema>;
export type FilesQueryInput = z.infer<typeof FilesQuerySchema>;
