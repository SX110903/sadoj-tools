import { DocumentStatus } from "../../shared/prisma";
import { z } from "zod";

export const DocumentTemplateTypeSchema = z.enum([
  "allanamiento",
  "busca-captura",
  "registro-telefonico",
  "interrogatorio",
  "acusacion",
  "orden-arresto",
  "solicitud-informacion",
  "plea-bargain",
  "acta-interrogatorio",
  "acta-allanamiento",
  "acta-registro-movil",
  "acta-registro-telefonico",
  "acta-solicitud-informacion",
  "reconocimiento-facial",
  "citacion-fiscal",
  "extraccion-telefonica"
]);

export const DocumentFormDataSchema = z.record(z.unknown());

export const DocumentParamsSchema = z.object({
  id: z.string().min(1)
});

export const DocumentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  type: DocumentTemplateTypeSchema.optional(),
  status: z.nativeEnum(DocumentStatus).optional(),
  authorId: z.string().min(1).optional(),
  investigationId: z.string().min(1).optional(),
  subjectId: z.string().min(1).optional(),
  search: z.string().trim().min(1).max(120).optional()
});

export const CreateDocumentSchema = z.object({
  type: DocumentTemplateTypeSchema,
  title: z.string().trim().min(3).max(180),
  formData: DocumentFormDataSchema,
  investigationId: z.string().min(1).optional(),
  subjectId: z.string().min(1).optional()
});

export const UpdateDocumentSchema = z.object({
  type: DocumentTemplateTypeSchema.optional(),
  title: z.string().trim().min(3).max(180).optional(),
  formData: DocumentFormDataSchema.optional(),
  investigationId: z.string().min(1).nullable().optional(),
  subjectId: z.string().min(1).nullable().optional()
});

export const UpdateDocumentStatusSchema = z.object({
  status: z.nativeEnum(DocumentStatus)
});

export type DocumentTemplateType = z.infer<typeof DocumentTemplateTypeSchema>;
export type DocumentsQueryInput = z.infer<typeof DocumentsQuerySchema>;
export type CreateDocumentInput = z.infer<typeof CreateDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof UpdateDocumentSchema>;
export type UpdateDocumentStatusInput = z.infer<typeof UpdateDocumentStatusSchema>;
