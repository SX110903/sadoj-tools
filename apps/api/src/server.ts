import { env } from "./config/env";
import { buildApp } from "./app";

async function start(): Promise<void> {
  const app = await buildApp();

  try {
    await app.listen({ port: env.PORT, host: "0.0.0.0" });
  } catch (error: unknown) {
    app.log.error(error);
    process.exit(1);
  }
}

void start();

