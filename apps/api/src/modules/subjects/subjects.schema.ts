import { DangerLevel, RelationshipType, SubjectStatus } from "../../shared/prisma";
import { z } from "zod";

const IMAGE_URL_REGEX = /\.(jpg|jpeg|png|webp|gif)$/i;

export const ImageUrlSchema = z.string().trim().url().refine(
  (url) => IMAGE_URL_REGEX.test(url) || url.includes("imgur.com"),
  { message: "Debe ser un enlace directo a una imagen (Imgur, etc.)." }
);

export const SubjectParamsSchema = z.object({
  id: z.string().min(1)
});

export const SubjectVehicleParamsSchema = z.object({
  id: z.string().min(1),
  vehicleId: z.string().min(1)
});

export const SubjectPropertyParamsSchema = z.object({
  id: z.string().min(1),
  propertyId: z.string().min(1)
});

export const SubjectRelationshipParamsSchema = z.object({
  id: z.string().min(1),
  relationshipId: z.string().min(1)
});

export const SubjectZoneParamsSchema = z.object({
  id: z.string().min(1),
  zoneId: z.string().min(1)
});

export const SubjectsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  q: z.string().trim().optional(),
  status: z.nativeEnum(SubjectStatus).optional(),
  dangerLevel: z.nativeEnum(DangerLevel).optional(),
  organization: z.string().trim().optional(),
  organizationId: z.string().min(1).optional(),
  hasVehicles: z.coerce.boolean().optional()
});

export const CreateSubjectSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  alias: z.string().trim().optional(),
  dateOfBirth: z.coerce.date().optional(),
  nationality: z.string().trim().optional(),
  occupation: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
  photoUrl: ImageUrlSchema.optional(),
  dangerLevel: z.nativeEnum(DangerLevel).default(DangerLevel.LOW),
  status: z.nativeEnum(SubjectStatus).default(SubjectStatus.FREE),
  isOrganized: z.coerce.boolean().default(false),
  organization: z.string().trim().optional(),
  organizationId: z.string().min(1).optional()
});

export const UpdateSubjectSchema = CreateSubjectSchema.partial();

export const LinkVehicleSchema = z.object({
  vehicleId: z.string().min(1),
  relation: z.string().trim().min(1)
});

export const LinkPropertySchema = z.object({
  propertyId: z.string().min(1),
  relation: z.string().trim().min(1)
});

export const CreateRelationshipSchema = z.object({
  toSubjectId: z.string().min(1),
  type: z.nativeEnum(RelationshipType),
  description: z.string().trim().optional(),
  strength: z.coerce.number().int().min(1).max(5).default(1)
});

export const AssignZoneSchema = z.object({
  zoneId: z.string().min(1),
  frequency: z.string().trim().optional(),
  lastSeenAt: z.coerce.date().optional()
});

export const UpdateSubjectPhotoSchema = z.object({
  photoUrl: ImageUrlSchema
});

export type SubjectsQueryInput = z.infer<typeof SubjectsQuerySchema>;
export type CreateSubjectInput = z.infer<typeof CreateSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof UpdateSubjectSchema>;
export type LinkVehicleInput = z.infer<typeof LinkVehicleSchema>;
export type LinkPropertyInput = z.infer<typeof LinkPropertySchema>;
export type CreateRelationshipInput = z.infer<typeof CreateRelationshipSchema>;
export type AssignZoneInput = z.infer<typeof AssignZoneSchema>;
export type UpdateSubjectPhotoInput = z.infer<typeof UpdateSubjectPhotoSchema>;
