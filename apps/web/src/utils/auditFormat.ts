export type AuditCategory = "case" | "map" | "subject" | "warrant" | "organization" | "sanction" | "user" | "property" | "file" | "system";

type AuditMeta = Record<string, unknown> | null;

export interface AuditFormatInput {
  action: string;
  meta?: AuditMeta;
}

export interface FormattedAuditAction {
  label: string;
  category: AuditCategory;
}

type AuditFormatter = (meta: AuditMeta) => FormattedAuditAction;

const SEMANTIC_ACTION_LABELS: Readonly<Record<string, AuditFormatter>> = {
  CREATE_INVESTIGATION: (meta) => ({ label: withSuffix("creó la investigación", metaValue(meta, "caseNumber")), category: "case" }),
  CREATE_MAP_ELEMENT: () => ({ label: "creó un elemento en el mapa", category: "map" }),
  DELETE_MAP_ELEMENT: () => ({ label: "eliminó un elemento del mapa", category: "map" }),
  CREATE_SUBJECT: (meta) => ({ label: withSuffix("registró al sujeto", metaValue(meta, "name")), category: "subject" }),
  CREATE_WARRANT: (meta) => ({ label: withSuffix("solicitó la orden", metaValue(meta, "warrantNumber")), category: "warrant" }),
  CREATE_ORGANIZATION: (meta) => ({ label: withSuffix("creó la organización", metaValue(meta, "name")), category: "organization" }),
  CREATE_SANCTION: () => ({ label: "emitió una sanción interna", category: "sanction" }),
  RESOLVE_SANCTION: () => ({ label: "resolvió una sanción interna", category: "sanction" }),
  UPDATE_PROPERTY: () => ({ label: "actualizó una propiedad", category: "property" }),
  CREATE_USER: (meta) => ({ label: withSuffix("dio de alta al fiscal", metaValue(meta, "name")), category: "user" }),
  UPDATE_USER_AVATAR: () => ({ label: "actualizó una foto de perfil", category: "user" }),
  UPDATE_SUBJECT_PHOTO: () => ({ label: "actualizó la foto de un sujeto", category: "subject" }),
  UPLOAD_FILE: () => ({ label: "subió un archivo de evidencia", category: "file" }),
  CREATE_DOCUMENT: (meta) => ({ label: withSuffix("generó el documento", metaValue(meta, "documentNumber")), category: "file" }),
  SIGN_DOCUMENT: (meta) => ({ label: withSuffix("firmó el documento", metaValue(meta, "documentNumber")), category: "file" }),
  UPDATE_DOCUMENT_STATUS: (meta) => ({ label: withSuffix("actualizó el estado del documento", metaValue(meta, "documentNumber")), category: "file" })
};

const ROUTE_ACTION_LABELS: Readonly<Record<string, AuditFormatter>> = {
  "POST /api/map/elements": () => ({ label: "creó un elemento en el mapa", category: "map" }),
  "DELETE /api/map/elements": () => ({ label: "eliminó un elemento del mapa", category: "map" }),
  "POST /api/investigations": (meta) => ({ label: withSuffix("creó la investigación", metaValue(meta, "caseNumber")), category: "case" }),
  "POST /api/subjects": (meta) => ({ label: withSuffix("registró al sujeto", metaValue(meta, "name")), category: "subject" }),
  "POST /api/warrants": (meta) => ({ label: withSuffix("solicitó la orden", metaValue(meta, "warrantNumber")), category: "warrant" }),
  "POST /api/organizations": (meta) => ({ label: withSuffix("creó la organización", metaValue(meta, "name")), category: "organization" }),
  "POST /api/sanctions": () => ({ label: "emitió una sanción interna", category: "sanction" }),
  "PUT /api/properties": () => ({ label: "actualizó una propiedad", category: "property" }),
  "POST /api/users": (meta) => ({ label: withSuffix("dio de alta al fiscal", metaValue(meta, "name")), category: "user" })
};

export function formatAuditAction(log: AuditFormatInput): FormattedAuditAction {
  const semanticFormatter = SEMANTIC_ACTION_LABELS[log.action];
  if (semanticFormatter !== undefined) return semanticFormatter(log.meta ?? null);

  const routeFormatter = ROUTE_ACTION_LABELS[normalizeRouteAction(log.action)];
  if (routeFormatter !== undefined) return routeFormatter(log.meta ?? null);

  return { label: "registró una actualización del sistema", category: "system" };
}

function normalizeRouteAction(action: string): string {
  const [method, path] = action.split(" ");
  if (method === undefined || path === undefined) return action;

  const normalizedPath = path
    .replace(/\?.*$/, "")
    .replace(/\/[a-z0-9]{16,}$/i, "");

  return `${method} ${normalizedPath}`;
}

function metaValue(meta: AuditMeta, key: string): string | null {
  const value = meta?.[key];
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function withSuffix(prefix: string, suffix: string | null): string {
  return suffix === null ? prefix : `${prefix} ${suffix}`;
}
