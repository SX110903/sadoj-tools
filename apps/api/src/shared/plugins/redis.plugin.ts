import Redis from "ioredis";
import fp from "fastify-plugin";
import { env } from "../../config/env";

export const redisPlugin = fp(async (app) => {
  const redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: 2 });

  app.decorate("redis", redis);

  app.addHook("onClose", async () => {
    await redis.quit();
  });
});

