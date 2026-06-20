export const MAP_SIZE = 8192;
export const GTA_X_RANGE: readonly [number, number] = [-4000, 4500];
export const GTA_Y_RANGE: readonly [number, number] = [-4000, 8000];

export interface PropertyPopupSubject {
  id: string;
  name: string;
  alias: string | null;
  dangerLevel: string;
}

export interface PropertyPopupInput {
  address: string;
  type: string;
  zone?: string | null;
  warrantCount?: number;
  subjects?: readonly PropertyPopupSubject[];
}

export function gtaToLeaflet(gtaX: number, gtaY: number): [number, number] {
  return [gtaY, gtaX];
}

export function leafletToGta(lat: number, lng: number): [number, number] {
  return [lng, lat];
}

export function gtaToPreviewPercent(gtaX: number, gtaY: number): { left: string; top: string } {
  const xSpan = GTA_X_RANGE[1] - GTA_X_RANGE[0];
  const ySpan = GTA_Y_RANGE[1] - GTA_Y_RANGE[0];
  const left = ((gtaX - GTA_X_RANGE[0]) / xSpan) * 100;
  const top = 100 - ((gtaY - GTA_Y_RANGE[0]) / ySpan) * 100;

  return {
    left: `${Math.min(100, Math.max(0, left))}%`,
    top: `${Math.min(100, Math.max(0, top))}%`
  };
}

export function parseGeoJson(value: string | null | undefined): GeoJSON.GeoJsonObject | null {
  if (value === null || value === undefined) return null;

  try {
    const parsed = JSON.parse(value) as unknown;
    return isGeoJsonObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function geoJsonPolygonToPoints(value: string | null | undefined): [number, number][] {
  const geoJson = parseGeoJson(value);
  if (geoJson === null) return [];

  if (isGeoJsonFeature(geoJson)) {
    return geometryToPoints(geoJson.geometry);
  }

  if (isGeoJsonFeatureCollection(geoJson)) {
    return geoJson.features.flatMap((feature) => geometryToPoints(feature.geometry));
  }

  return isGeoJsonGeometry(geoJson) ? geometryToPoints(geoJson) : [];
}

export function buildPropertyPopup(property: PropertyPopupInput): string {
  const subjects = property.subjects ?? [];
  const subjectsHtml = subjects.length === 0
    ? "<li>Sin sujetos vinculados</li>"
    : subjects.map((subject) => {
      const alias = subject.alias === null ? "Sin alias" : escapeHtml(subject.alias);
      return `<li><a href="/sujetos/${encodeURIComponent(subject.id)}">${escapeHtml(subject.name)}</a><span>${alias} · ${escapeHtml(subject.dangerLevel)}</span></li>`;
    }).join("");

  return [
    "<section class=\"gta-property-popup\">",
    `<h3>${escapeHtml(property.address)}</h3>`,
    `<p>${escapeHtml(property.type)} · ${escapeHtml(property.zone ?? "Zona no registrada")}</p>`,
    `<p>Operaciones: ${property.warrantCount ?? 0}</p>`,
    "<ul>",
    subjectsHtml,
    "</ul>",
    "</section>"
  ].join("");
}

function geometryToPoints(geometry: GeoJSON.Geometry): [number, number][] {
  if (geometry.type === "Polygon") {
    return geometry.coordinates[0]?.filter(isPosition).map(positionToPoint) ?? [];
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.flatMap((polygon) => polygon[0]?.filter(isPosition).map(positionToPoint) ?? []);
  }

  if (geometry.type === "LineString") {
    return geometry.coordinates.filter(isPosition).map(positionToPoint);
  }

  if (geometry.type === "Point" && isPosition(geometry.coordinates)) {
    return [positionToPoint(geometry.coordinates)];
  }

  return [];
}

function isGeoJsonObject(value: unknown): value is GeoJSON.GeoJsonObject {
  return typeof value === "object" && value !== null && "type" in value;
}

function isGeoJsonFeature(value: GeoJSON.GeoJsonObject): value is GeoJSON.Feature<GeoJSON.Geometry> {
  return value.type === "Feature" && "geometry" in value;
}

function isGeoJsonFeatureCollection(value: GeoJSON.GeoJsonObject): value is GeoJSON.FeatureCollection<GeoJSON.Geometry> {
  return value.type === "FeatureCollection" && "features" in value && Array.isArray((value as { features?: unknown }).features);
}

function isGeoJsonGeometry(value: GeoJSON.GeoJsonObject): value is GeoJSON.Geometry {
  return value.type !== "Feature" && value.type !== "FeatureCollection";
}

function isPosition(value: unknown): value is GeoJSON.Position {
  return Array.isArray(value) && typeof value[0] === "number" && typeof value[1] === "number";
}

function positionToPoint(position: GeoJSON.Position): [number, number] {
  return [position[0] ?? 0, position[1] ?? 0];
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#039;");
}
