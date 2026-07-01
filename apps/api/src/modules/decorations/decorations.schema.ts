import { DecorationTier } from "../../shared/prisma";
import { z } from "zod";

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

export const DecorationParamsSchema = z.object({
  id: z.string().min(1)
});

export const UserDecorationsParamsSchema = z.object({
  id: z.string().min(1)
});

export const UserDecorationAwardParamsSchema = z.object({
  id: z.string().min(1),
  awardId: z.string().min(1)
});

export const CreateDecorationSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().min(2).max(500),
  icon: z.string().trim().min(1).max(60).nullable().optional(),
  color: z.string().trim().regex(HEX_COLOR_REGEX, "El color debe ser un valor hexadecimal (#rrggbb).").optional(),
  tier: z.nativeEnum(DecorationTier).optional()
});

export const UpdateDecorationSchema = CreateDecorationSchema.partial();

export const AwardDecorationSchema = z.object({
  decorationId: z.string().min(1),
  reason: z.string().trim().max(500).optional()
});

export type CreateDecorationInput = z.infer<typeof CreateDecorationSchema>;
export type UpdateDecorationInput = z.infer<typeof UpdateDecorationSchema>;
export type AwardDecorationInput = z.infer<typeof AwardDecorationSchema>;
