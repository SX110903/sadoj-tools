import { MapDrawingType, MapElementType } from "../../shared/prisma";
import { z } from "zod";

export const MapInvestigationParamsSchema = z.object({
  investigationId: z.string().min(1)
});

export const MapDrawingParamsSchema = z.object({
  id: z.string().min(1)
});

export const MapElementParamsSchema = z.object({
  id: z.string().min(1)
});

export const MapElementSubjectParamsSchema = z.object({
  id: z.string().min(1),
  subjectId: z.string().min(1)
});

export const MapElementsQuerySchema = z.object({
  investigationId: z.string().min(1).optional(),
  organizationId: z.string().min(1).optional()
});

const GeoJsonStringSchema = z.string().trim().min(2).refine(
  (value) => {
    try {
      const parsed = JSON.parse(value) as unknown;
      return typeof parsed === "object" && parsed !== null;
    } catch {
      return false;
    }
  },
  { message: "El GeoJSON no tiene un formato válido." }
);

const MapElementSubjectLinkSchema = z.object({
  subjectId: z.string().min(1),
  role: z.string().trim().max(120).optional()
});

export const CreateMapDrawingSchema = z.object({
  investigationId: z.string().min(1),
  type: z.nativeEnum(MapDrawingType),
  label: z.string().trim().min(1).max(120).optional(),
  geoJson: GeoJsonStringSchema,
  color: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  description: z.string().trim().max(500).optional()
});

export const UpdateMapDrawingSchema = z.object({
  label: z.string().trim().min(1).max(120).optional(),
  color: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  description: z.string().trim().max(500).optional()
});

export const CreateMapElementSchema = z.object({
  investigationId: z.string().min(1).optional(),
  type: z.nativeEnum(MapElementType),
  label: z.string().trim().min(1).max(160),
  description: z.string().trim().max(4000).optional(),
  color: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  geoJson: GeoJsonStringSchema,
  radius: z.coerce.number().positive().optional(),
  organizationId: z.string().min(1).nullable().optional(),
  propertyId: z.string().min(1).nullable().optional(),
  subjectIds: z.array(z.string().min(1)).max(50).optional(),
  linkedSubjects: z.array(MapElementSubjectLinkSchema).max(50).optional()
});

export const UpdateMapElementSchema = z.object({
  label: z.string().trim().min(1).max(160).optional(),
  description: z.string().trim().max(4000).nullable().optional(),
  color: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  organizationId: z.string().min(1).nullable().optional(),
  radius: z.coerce.number().positive().nullable().optional()
});

export const LinkMapElementSubjectSchema = z.object({
  subjectId: z.string().min(1),
  role: z.string().trim().max(120).optional()
});

export type CreateMapDrawingInput = z.infer<typeof CreateMapDrawingSchema>;
export type UpdateMapDrawingInput = z.infer<typeof UpdateMapDrawingSchema>;
export type MapElementsQueryInput = z.infer<typeof MapElementsQuerySchema>;
export type CreateMapElementInput = z.infer<typeof CreateMapElementSchema>;
export type UpdateMapElementInput = z.infer<typeof UpdateMapElementSchema>;
export type LinkMapElementSubjectInput = z.infer<typeof LinkMapElementSubjectSchema>;
