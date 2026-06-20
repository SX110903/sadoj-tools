import { NotificationType } from "../../shared/prisma";
import { z } from "zod";

const ReadQuerySchema = z.preprocess((value) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}, z.boolean());

export const NotificationParamsSchema = z.object({
  id: z.string().min(1)
});

export const NotificationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  read: ReadQuerySchema.optional(),
  type: z.nativeEnum(NotificationType).optional()
});

export type NotificationsQueryInput = z.infer<typeof NotificationsQuerySchema>;
