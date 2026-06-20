import cors from "@fastify/cors";
import fp from "fastify-plugin";
import { env } from "../../config/env";

export const corsPlugin = fp(async (app) => {
  const allowedOrigins = env.CORS_ORIGIN.split(",").map((origin) => origin.trim());

  await app.register(cors, {
    credentials: true,
    origin: (origin, callback) => {
      if (origin === undefined || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origen no permitido"), false);
    }
  });
});

