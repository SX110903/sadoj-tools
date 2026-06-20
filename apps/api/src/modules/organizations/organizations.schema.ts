import { OrgType } from "../../shared/prisma";
import { z } from "zod";

export const OrganizationParamsSchema = z.object({
  id: z.string().min(1)
});

export const OrganizationsQuerySchema = z.object({
  q: z.string().trim().optional(),
  active: z.coerce.boolean().optional()
});

export const CreateOrganizationSchema = z.object({
  name: z.string().trim().min(2).max(120),
  alias: z.string().trim().max(120).optional(),
  color: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/).default("#dc2626"),
  description: z.string().trim().max(4000).optional(),
  type: z.nativeEnum(OrgType).default(OrgType.GANG)
});

export const UpdateOrganizationSchema = CreateOrganizationSchema.partial().extend({
  active: z.coerce.boolean().optional()
});

export type OrganizationsQueryInput = z.infer<typeof OrganizationsQuerySchema>;
export type CreateOrganizationInput = z.infer<typeof CreateOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof UpdateOrganizationSchema>;
