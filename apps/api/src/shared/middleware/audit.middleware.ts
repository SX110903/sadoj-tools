import type { FastifyReply, FastifyRequest } from "fastify";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const EXCLUDED_PREFIXES = ["/api/auth/me", "/api/chat"];

function shouldAudit(request: FastifyRequest): boolean {
  return MUTATING_METHODS.has(request.method) && !EXCLUDED_PREFIXES.some((prefix) => request.url.startsWith(prefix));
}

function pathnameFromRequestUrl(url: string): string {
  return new URL(url, "http://sadoj.local").pathname;
}

function semanticActionFor(method: string, pathname: string): string {
  const route = `${method} ${pathname}`;

  if (route === "POST /api/investigations") return "CREATE_INVESTIGATION";
  if (route === "POST /api/subjects") return "CREATE_SUBJECT";
  if (route === "POST /api/warrants") return "CREATE_WARRANT";
  if (route === "POST /api/organizations") return "CREATE_ORGANIZATION";
  if (route === "POST /api/sanctions") return "CREATE_SANCTION";
  if (route === "POST /api/documents") return "CREATE_DOCUMENT";
  if (route === "POST /api/users") return "CREATE_USER";
  if (route === "POST /api/map/elements") return "CREATE_MAP_ELEMENT";
  if (route === "POST /api/files") return "UPLOAD_FILE";
  if (method === "PUT" && pathname.startsWith("/api/properties/")) return "UPDATE_PROPERTY";
  if (method === "DELETE" && pathname.startsWith("/api/map/elements/")) return "DELETE_MAP_ELEMENT";
  if (method === "PATCH" && pathname.startsWith("/api/documents/") && pathname.endsWith("/sign")) return "SIGN_DOCUMENT";
  if (method === "PATCH" && pathname.startsWith("/api/documents/") && pathname.endsWith("/status")) return "UPDATE_DOCUMENT_STATUS";
  if ((method === "PATCH" || method === "PUT") && pathname.startsWith("/api/documents/")) return "UPDATE_DOCUMENT";
  if (method === "DELETE" && pathname.startsWith("/api/documents/")) return "DELETE_DOCUMENT";
  if (method === "PATCH" && pathname.includes("/photo")) return "UPDATE_SUBJECT_PHOTO";
  if (method === "PATCH" && pathname.includes("/avatar")) return "UPDATE_USER_AVATAR";

  return route;
}

export async function auditOnResponseHook(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  if (!shouldAudit(request) || request.user === undefined) {
    return;
  }

  const pathname = pathnameFromRequestUrl(request.url);

  await request.server.prisma.auditLog.create({
    data: {
      userId: request.user.id,
      action: semanticActionFor(request.method, pathname),
      entity: "HttpRequest",
      ip: request.ip,
      userAgent: request.headers["user-agent"] ?? null
    }
  });
}
