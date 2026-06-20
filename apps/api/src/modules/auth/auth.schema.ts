import { z } from "zod";

export const LoginSchema = z.object({
  username: z.string().trim().min(3),
  password: z.string().min(8)
});

export const RefreshSchema = z.object({}).strict();
export const EmptySchema = z.object({}).strict();

export type LoginInput = z.infer<typeof LoginSchema>;

