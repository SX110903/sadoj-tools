import { z } from "zod";

export const DatalinkQuerySchema = z
  .object({
    organizationId: z.string().trim().min(1).optional(),
    subjectId: z.string().trim().min(1).optional(),
    scope: z.enum(["all"]).optional()
  })
  .refine((value) => value.organizationId === undefined || value.subjectId === undefined, {
    message: "Filtra por organización o sujeto, no por ambos."
  });

export type DatalinkQueryInput = z.infer<typeof DatalinkQuerySchema>;
