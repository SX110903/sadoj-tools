import multipart from "@fastify/multipart";
import fp from "fastify-plugin";
import { env } from "../../config/env";

export const multipartPlugin = fp(async (app) => {
  await app.register(multipart, {
    limits: {
      fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024,
      files: 1
    }
  });
});
