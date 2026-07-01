import { z } from "zod";
import { isSafeHttpUrl } from "../../shared/utils/url";

export const ChatRoomParamsSchema = z.object({
  roomId: z.string().min(1)
});

export const ChatMessagesQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(50),
  before: z.string().min(1).optional()
});

export const SendMessageSchema = z.object({
  content: z.string().trim().min(1).max(2000),
  fileUrl: z.string().trim().refine(isSafeHttpUrl, {
    message: "El enlace del archivo debe usar HTTP(S)."
  }).optional(),
  fileId: z.string().min(1).optional(),
  fileName: z.string().trim().min(1).max(240).optional(),
  mentions: z.array(z.string().min(1)).default([])
});

export const ChatRoomEventSchema = z.object({
  roomId: z.string().min(1)
});

export const TypingEventSchema = ChatRoomEventSchema;

export const SocketSendMessageSchema = ChatRoomEventSchema.merge(SendMessageSchema);

export type ChatMessagesQueryInput = z.infer<typeof ChatMessagesQuerySchema>;
export type SendMessageInput = z.infer<typeof SendMessageSchema>;
export type SocketSendMessageInput = z.infer<typeof SocketSendMessageSchema>;
