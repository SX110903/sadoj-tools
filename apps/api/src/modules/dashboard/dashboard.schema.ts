import { z } from "zod";

export const DashboardQuerySchema = z.object({}).strict();

export type DashboardQueryInput = z.infer<typeof DashboardQuerySchema>;
