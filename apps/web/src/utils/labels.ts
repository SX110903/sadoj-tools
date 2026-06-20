export const ROLE_LABELS: Readonly<Record<string, string>> = {
  FISCAL_GENERAL: "Fiscal General",
  FISCAL_ADJUNTO: "Fiscal General Adjunto",
  FISCAL_DIVISION: "Fiscal de División",
  FISCAL_SUPERIOR: "Fiscal Superior",
  FISCAL_JEFE: "Fiscal Jefe",
  FISCAL: "Fiscal",
  FISCAL_AUXILIAR: "Fiscal Auxiliar",
  INVESTIGADOR_SENIOR: "Investigador Senior",
  INVESTIGADOR_JUNIOR: "Investigador Junior",
  PASANTE: "Pasante"
};

export const ROLE_BADGE_CLASS: Readonly<Record<string, string>> = {
  FISCAL_GENERAL: "badge role-general",
  FISCAL_ADJUNTO: "badge role-adjunto",
  FISCAL_DIVISION: "badge role-division",
  FISCAL_SUPERIOR: "badge role-superior",
  FISCAL_JEFE: "badge role-jefe",
  FISCAL: "badge role-fiscal",
  FISCAL_AUXILIAR: "badge role-auxiliar",
  INVESTIGADOR_SENIOR: "badge role-investigador-senior",
  INVESTIGADOR_JUNIOR: "badge role-investigador-junior",
  PASANTE: "badge role-pasante"
};

export function roleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role;
}

export function roleBadgeClass(role: string): string {
  return ROLE_BADGE_CLASS[role] ?? "badge role-pasante";
}

export function formatHubDate(value: string | null): string {
  if (value === null) {
    return "Sin registro";
  }

  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value)) + " HUB";
}

export function shortDateTime(value: string | null): string {
  if (value === null) return "Sin fecha";

  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function relativeDate(value: string): string {
  const formatter = new Intl.RelativeTimeFormat("es", { numeric: "auto" });
  const diffMs = new Date(value).getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60000);

  if (Math.abs(diffMinutes) < 60) return formatter.format(diffMinutes, "minute");

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) return formatter.format(diffHours, "hour");

  return formatter.format(Math.round(diffHours / 24), "day");
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const STATUS_LABELS: Readonly<Record<string, string>> = {
  OPEN: "Abierta",
  ACTIVE: "Activa",
  SUSPENDED: "Suspendida",
  CLOSED_SUCCESSFUL: "Cerrada con éxito",
  CLOSED_DISMISSED: "Archivada",
  FREE: "Libre",
  WANTED: "Buscado",
  UNDER_SURVEILLANCE: "Vigilado",
  ARRESTED: "Arrestado",
  INDICTED: "Acusado",
  CONVICTED: "Condenado",
  PENDING: "Pendiente",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
  EXECUTED: "Ejecutada",
  EXPIRED: "Expirada",
  POSITIVE: "Positivo",
  NEGATIVE: "Negativo",
  PARTIAL: "Parcial",
  MANUAL: "Manual",
  WARRANT: "Orden",
  DRAFT: "Borrador",
  ISSUED: "Emitido",
  SIGNED: "Firmado",
  ARCHIVED: "Archivado"
};

export const PRIORITY_LABELS: Readonly<Record<string, string>> = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
  CRITICAL: "Crítica"
};

export const TYPE_LABELS: Readonly<Record<string, string>> = {
  CRIMINAL: "Penal",
  FINANCIAL: "Financiera",
  CORRUPTION: "Corrupción",
  ORGANIZED_CRIME: "Crimen organizado",
  NARCOTICS: "Narcóticos",
  WEAPONS: "Armas",
  CIVIL: "Civil",
  MIXED: "Mixta",
  ALLANAMIENTO: "Allanamiento",
  DETENCION: "Detención",
  INTERCEPCION: "Intercepción",
  INCAUTACION: "Incautación",
  RAID: "Allanamiento",
  SEIZURE: "Incautación",
  SURVEILLANCE: "Vigilancia",
  SIGHTING: "Avistamiento",
  INTERVENTION: "Intervención",
  INSPECTION: "Inspección",
  GANG: "Pandilla",
  CARTEL: "Cártel",
  MAFIA: "Mafia",
  BIKER: "Club de moteros",
  CORPORATE: "Cuello blanco",
  OTHER: "Otra",
  RESIDENCE: "Residencia",
  BUSINESS: "Negocio",
  WAREHOUSE: "Almacén",
  HIDEOUT: "Casa franca",
  UNKNOWN: "Desconocido",
  RESOLUTION: "Resolución",
  SUMMONS: "Citación",
  REPORT: "Informe",
  OFFICIAL_LETTER: "Oficio",
  INDICTMENT: "Acusación",
  DECREE: "Decreto",
  INTERNAL_MEMO: "Memorando interno",
  allanamiento: "Solicitud de allanamiento",
  "busca-captura": "Busca y captura",
  "registro-telefonico": "Registro telefónico",
  interrogatorio: "Interrogatorio",
  acusacion: "Acusación",
  "orden-arresto": "Orden de arresto",
  "solicitud-informacion": "Solicitud de información",
  "plea-bargain": "Acuerdo de conformidad",
  "acta-interrogatorio": "Acta de interrogatorio",
  "acta-allanamiento": "Acta de allanamiento",
  "acta-registro-movil": "Acta de registro móvil",
  "acta-registro-telefonico": "Acta de registro telefónico",
  "acta-solicitud-informacion": "Acta de solicitud de información",
  "reconocimiento-facial": "Reconocimiento facial",
  "citacion-fiscal": "Citación fiscal",
  "extraccion-telefonica": "Extracción telefónica"
};

export const DANGER_LABELS: Readonly<Record<string, string>> = {
  LOW: "Bajo",
  MEDIUM: "Medio",
  HIGH: "Alto",
  EXTREME: "Extremo"
};

export const ACCESS_LABELS: Readonly<Record<string, string>> = {
  READ: "Lectura",
  WRITE: "Escritura",
  ADMIN: "Admin"
};
