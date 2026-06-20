import { z } from "zod";

export const VehicleParamsSchema = z.object({
  id: z.string().min(1)
});

export const VehiclesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  plate: z.string().trim().optional()
});

export const CreateVehicleSchema = z.object({
  plate: z.string().trim().min(1),
  brand: z.string().trim().min(1),
  model: z.string().trim().min(1),
  color: z.string().trim().min(1),
  year: z.coerce.number().int().min(1900).max(2100).optional(),
  notes: z.string().trim().optional()
});

export const UpdateVehicleSchema = CreateVehicleSchema.partial();

export type VehiclesQueryInput = z.infer<typeof VehiclesQuerySchema>;
export type CreateVehicleInput = z.infer<typeof CreateVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof UpdateVehicleSchema>;

