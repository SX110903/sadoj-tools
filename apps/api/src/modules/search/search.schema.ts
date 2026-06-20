import { z } from "zod";

export const SearchQuerySchema = z.object({
  q: z.string().trim().min(2).max(80)
});

export type SearchQueryInput = z.infer<typeof SearchQuerySchema>;
