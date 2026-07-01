import cookie from "@fastify/cookie";
import helmet from "@fastify/helmet";
import Fastify, { type FastifyInstance } from "fastify";
import { adminRoutes } from "./modules/admin/admin.routes";
import { academyRoutes, academyUserRecordRoutes } from "./modules/academy/academy.routes";
import { authRoutes } from "./modules/auth/auth.routes";
import { boardsRoutes } from "./modules/boards/boards.routes";
import { setupChatGateway } from "./modules/chat/chat.gateway";
import { chatRoutes } from "./modules/chat/chat.routes";
import { dashboardRoutes } from "./modules/dashboard/dashboard.routes";
import { decorationsRoutes } from "./modules/decorations/decorations.routes";
import { datalinkRoutes } from "./modules/datalink/datalink.routes";
import { documentsRoutes } from "./modules/documents/documents.routes";
import { examsRoutes } from "./modules/exams/exams.routes";
import { filesRoutes } from "./modules/files/files.routes";
import { investigationsRoutes } from "./modules/investigations/investigations.routes";
import { hrRoutes } from "./modules/hr/hr.routes";
import { mapRoutes } from "./modules/map/map.routes";
import { notesRoutes } from "./modules/notes/notes.routes";
import { notificationsRoutes } from "./modules/notifications/notifications.routes";
import { organizationsRoutes } from "./modules/organizations/organizations.routes";
import { propertiesRoutes } from "./modules/properties/properties.routes";
import { sanctionsRoutes } from "./modules/sanctions/sanctions.routes";
import { searchRoutes } from "./modules/search/search.routes";
import { subjectsRoutes } from "./modules/subjects/subjects.routes";
import { tasksRoutes } from "./modules/tasks/tasks.routes";
import { usersRoutes } from "./modules/users/users.routes";
import { vehiclesRoutes } from "./modules/vehicles/vehicles.routes";
import { warrantsRoutes } from "./modules/warrants/warrants.routes";
import { zonesRoutes } from "./modules/zones/zones.routes";
import { registerErrorHandler } from "./shared/errors/error-handler";
import { auditOnResponseHook } from "./shared/middleware/audit.middleware";
import { authPlugin } from "./shared/plugins/auth.plugin";
import { corsPlugin } from "./shared/plugins/cors.plugin";
import { databasePlugin } from "./shared/plugins/database.plugin";
import { multipartPlugin } from "./shared/plugins/multipart.plugin";
import { rateLimitPlugin } from "./shared/plugins/ratelimit.plugin";
import { redisPlugin } from "./shared/plugins/redis.plugin";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });

  await app.register(helmet);
  await app.register(corsPlugin);
  await app.register(rateLimitPlugin);
  await app.register(databasePlugin);
  await app.register(redisPlugin);
  await app.register(cookie);
  await app.register(multipartPlugin);
  await app.register(authPlugin);

  app.addHook("onRequest", async (request) => {
    request.log.info({ ip: request.ip, userAgent: request.headers["user-agent"] }, "solicitud entrante");
  });

  app.addHook("onResponse", auditOnResponseHook);

  app.get("/health", async () => ({ status: "ok", timestamp: new Date().toISOString() }));
  await app.register(authRoutes, { prefix: "/api/auth" });
  await app.register(academyRoutes, { prefix: "/api/academy" });
  await app.register(academyUserRecordRoutes, { prefix: "/api/users" });
  await app.register(adminRoutes, { prefix: "/api/admin" });
  await app.register(boardsRoutes, { prefix: "/api/boards" });
  await app.register(dashboardRoutes, { prefix: "/api/dashboard" });
  await app.register(decorationsRoutes, { prefix: "/api/decorations" });
  await app.register(datalinkRoutes, { prefix: "/api/datalink" });
  await app.register(usersRoutes, { prefix: "/api/users" });
  await app.register(hrRoutes, { prefix: "/api/candidates" });
  await app.register(investigationsRoutes, { prefix: "/api/investigations" });
  await app.register(subjectsRoutes, { prefix: "/api/subjects" });
  await app.register(tasksRoutes, { prefix: "/api/tasks" });
  await app.register(vehiclesRoutes, { prefix: "/api/vehicles" });
  await app.register(propertiesRoutes, { prefix: "/api/properties" });
  await app.register(organizationsRoutes, { prefix: "/api/organizations" });
  await app.register(warrantsRoutes, { prefix: "/api/warrants" });
  await app.register(mapRoutes, { prefix: "/api/map" });
  await app.register(notesRoutes, { prefix: "/api/notes" });
  await app.register(notificationsRoutes, { prefix: "/api/notifications" });
  await app.register(sanctionsRoutes, { prefix: "/api/sanctions" });
  await app.register(searchRoutes, { prefix: "/api/search" });
  await app.register(documentsRoutes, { prefix: "/api/documents" });
  await app.register(examsRoutes, { prefix: "/api/exams" });
  await app.register(filesRoutes, { prefix: "/api/files" });
  await app.register(chatRoutes, { prefix: "/api/chat" });
  await app.register(zonesRoutes, { prefix: "/api/zones" });

  setupChatGateway(app);

  registerErrorHandler(app);
  return app;
}
