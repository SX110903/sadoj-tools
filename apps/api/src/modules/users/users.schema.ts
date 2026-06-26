import { RoleType } from "@sadoj/shared";
import { z } from "zod";

const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
const IMAGE_URL_REGEX = /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i;

export const ImageUrlSchema = z.string().trim().url().refine(
  (url) => IMAGE_URL_REGEX.test(url),
  { message: "Debe ser un enlace directo a una imagen (jpg, jpeg, png, webp o gif)." }
);

export const UserParamsSchema = z.object({
  id: z.string().min(1)
});

export const UsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  role: z.nativeEnum(RoleType).optional(),
  active: z.coerce.boolean().optional(),
  search: z.string().trim().min(1).optional()
});

export const MentionUsersQuerySchema = z.object({
  search: z.string().trim().min(1).max(80).optional(),
  limit: z.coerce.number().int().positive().max(20).default(8)
});

export const CreateUserSchema = z.object({
  username: z.string().trim().min(3),
  displayName: z.string().trim().min(2),
  password: z.string().regex(STRONG_PASSWORD_REGEX, "La contraseña debe tener mayúsculas, minúsculas, números y símbolos."),
  email: z.string().trim().email().optional(),
  avatarUrl: ImageUrlSchema.optional(),
  badgeNumber: z.string().trim().min(1).optional(),
  division: z.string().trim().min(1).optional(),
  bio: z.string().trim().optional(),
  role: z.nativeEnum(RoleType)
});

export const UpdateUserSchema = CreateUserSchema.omit({ username: true, password: true, role: true }).partial();

export const AssignRoleSchema = z.object({
  role: z.nativeEnum(RoleType)
});

export const UpdateAvatarSchema = z.object({
  avatarUrl: ImageUrlSchema
});

export type UsersQueryInput = z.infer<typeof UsersQuerySchema>;
export type MentionUsersQueryInput = z.infer<typeof MentionUsersQuerySchema>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type AssignRoleInput = z.infer<typeof AssignRoleSchema>;
export type UpdateAvatarInput = z.infer<typeof UpdateAvatarSchema>;
