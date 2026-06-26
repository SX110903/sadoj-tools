type ClientDiagnosticLevel = "error" | "warning";

interface ClientDiagnostic {
  readonly level: ClientDiagnosticLevel;
  readonly message: string;
  readonly detail: string | null;
  readonly recordedAt: string;
}

const MAX_DIAGNOSTICS = 50;
const diagnostics: ClientDiagnostic[] = [];

function normalizeDetail(detail: unknown): string | null {
  if (detail instanceof Error) return detail.stack ?? detail.message;
  if (detail === undefined || detail === null) return null;

  try {
    return typeof detail === "string" ? detail : JSON.stringify(detail);
  } catch {
    return String(detail);
  }
}

function recordClientDiagnostic(level: ClientDiagnosticLevel, message: string, detail?: unknown): void {
  diagnostics.unshift({
    level,
    message,
    detail: normalizeDetail(detail),
    recordedAt: new Date().toISOString()
  });

  if (diagnostics.length > MAX_DIAGNOSTICS) {
    diagnostics.length = MAX_DIAGNOSTICS;
  }
}

export function reportClientError(message: string, detail?: unknown): void {
  recordClientDiagnostic("error", message, detail);
}

export function reportClientWarning(message: string, detail?: unknown): void {
  recordClientDiagnostic("warning", message, detail);
}

export function getClientDiagnostics(): readonly ClientDiagnostic[] {
  return diagnostics;
}
