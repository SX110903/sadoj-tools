import { AccessLevel, IncidentResult, PropertyIncidentType, PropertyType } from "../../shared/prisma";
import { z } from "zod";

export const PropertyParamsSchema = z.object({
  id: z.string().min(1)
});

export const PropertyIncidentParamsSchema = PropertyParamsSchema.extend({
  incidentId: z.string().min(1)
});

export const PropertyMemberParamsSchema = PropertyParamsSchema.extend({
  userId: z.string().min(1)
});

export const PropertiesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  q: z.string().trim().optional()
});

export const CreatePropertySchema = z.object({
  address: z.string().trim().min(3),
  type: z.nativeEnum(PropertyType),
  zone: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  gtaX: z.coerce.number().optional(),
  gtaY: z.coerce.number().optional()
});

export const UpdatePropertySchema = CreatePropertySchema.partial();

const NullableTextSchema = z.string().trim().optional().transform((value) => value === undefined || value.length === 0 ? undefined : value);

export const CreatePropertyIncidentSchema = z.object({
  type: z.nativeEnum(PropertyIncidentType),
  title: z.string().trim().min(3),
  description: z.string().trim().min(1),
  occurredAt: z.coerce.date(),
  result: z.nativeEnum(IncidentResult).optional(),
  participatingAgencies: NullableTextSchema,
  evidence: NullableTextSchema,
  personsPresent: NullableTextSchema,
  investigationId: NullableTextSchema
});

export const UpdatePropertyIncidentSchema = CreatePropertyIncidentSchema.partial();

export const UpsertPropertyMemberSchema = z.object({
  userId: z.string().min(1),
  accessLevel: z.nativeEnum(AccessLevel)
});

export const UpdatePropertyMemberSchema = z.object({
  accessLevel: z.nativeEnum(AccessLevel)
});

export type PropertiesQueryInput = z.infer<typeof PropertiesQuerySchema>;
export type CreatePropertyInput = z.infer<typeof CreatePropertySchema>;
export type UpdatePropertyInput = z.infer<typeof UpdatePropertySchema>;
export type CreatePropertyIncidentInput = z.infer<typeof CreatePropertyIncidentSchema>;
export type UpdatePropertyIncidentInput = z.infer<typeof UpdatePropertyIncidentSchema>;
export type UpsertPropertyMemberInput = z.infer<typeof UpsertPropertyMemberSchema>;
export type UpdatePropertyMemberInput = z.infer<typeof UpdatePropertyMemberSchema>;
