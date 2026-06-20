import { z } from "zod";

export const NoteParamsSchema = z.object({
  id: z.string().min(1)
});

export const ParentNoteParamsSchema = z.object({
  id: z.string().min(1)
});

export const CreateNoteSchema = z.object({
  content: z.string().trim().min(2).max(10000),
  isConfidential: z.boolean().default(false),
  mentions: z.array(z.string().min(1)).default([])
});

export const UpdateNoteSchema = z.object({
  content: z.string().trim().min(2).max(10000).optional(),
  isConfidential: z.boolean().optional()
});

export const PinNoteSchema = z.object({
  isPinned: z.boolean()
});

export type CreateNoteInput = z.infer<typeof CreateNoteSchema>;
export type UpdateNoteInput = z.infer<typeof UpdateNoteSchema>;
export type PinNoteInput = z.infer<typeof PinNoteSchema>;
