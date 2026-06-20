import "dotenv/config";
import { z } from "zod";

const BooleanEnvSchema = z.union([
  z.boolean(),
  z.string().trim().toLowerCase().transform((value) => value === "true" || value === "1")
]);

const ENV_SCHEMA = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  MINIO_ENDPOINT: z.string().min(1),
  MINIO_PORT: z.coerce.number().int().positive().default(9000),
  MINIO_ACCESS_KEY: z.string().min(1),
  MINIO_SECRET_KEY: z.string().min(1),
  MINIO_BUCKET: z.string().min(1),
  MINIO_USE_SSL: BooleanEnvSchema.default(false),
  CORS_ORIGIN: z.string().min(1),
  MAX_FILE_SIZE_MB: z.coerce.number().int().positive().default(10)
});

export const env = ENV_SCHEMA.parse(process.env);
export const IS_PRODUCTION = env.NODE_ENV === "production";
export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
