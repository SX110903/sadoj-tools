import L from "leaflet";
import "leaflet-draw/dist/leaflet.draw.css";
import leafletDrawScript from "leaflet-draw/dist/leaflet.draw.js?raw";
import "leaflet/dist/leaflet.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GtaShape, MapStyle } from "gta-v-map";
import { Circle, Hexagon, MapPin, Spline } from "lucide-react";
import { useGtaMap } from "../../hooks/useGtaMap";
import type { MapDrawing, MapElement, MapElementType, Property } from "../../types/sadoj";
import { reportClientWarning } from "../../utils/clientDiagnostics";
import { geoJsonPolygonToPoints, parseGeoJson } from "../../utils/mapCoords";

const MAP_STYLES = [
  { value: "satellite", label: "Satélite" },
  { value: "atlas", label: "Atlas" },
  { value: "grid", label: "Cuadrícula" }
] satisfies ReadonlyArray<{ value: MapStyle; label: string }>;

const DRAW_TOOLS = [
  { type: "POINT", label: "Punto", tooltip: "Marcar un punto / propiedad", icon: <MapPin size={16} /> },
  { type: "CIRCLE", label: "Zona", tooltip: "Zona de radio operativa", icon: <Circle size={16} /> },
  { type: "POLYGON", label: "Territorio", tooltip: "Territorio delimitado", icon: <Hexagon size={16} /> },
  { type: "POLYLINE", label: "Ruta", tooltip: "Trazar una ruta de varios puntos", icon: <Spline size={16} /> }
] satisfies ReadonlyArray<{ type: MapElementType; label: string; tooltip: string; icon: JSX.Element }>;

const DEFAULT_CIRCLE_RADIUS = 80;
const MAX_CIRCLE_RADIUS = 2500;

type MapElementDraft = {
  type: MapElementType;
  geoJson: string;
  radius?: number;
};

interface LosSantosMapProps {
  mapElements?: MapElement[];
  activeOrgFilter?: string | null;
  highlightedElementId?: string | null;
  canManageIntel?: boolean;
  height?: string;
  clearPendingDraftSignal?: number;
  onElementDraft?: (draft: MapElementDraft) => void;
  onElementSelect?: (element: MapElement) => void;
  properties?: Property[];
  drawings?: MapDrawing[];
  showProperties?: boolean;
  showDrawings?: boolean;
  editable?: boolean;
  focusDrawingId?: string | null;
  onPropertySelect?: (property: Property) => void;
  onDrawingCreated?: (payload: { type: string; geoJson: string }) => void;
}

type GeoJsonLayer = L.Layer & {
  toGeoJSON: () => GeoJSON.Feature<GeoJSON.Geometry, Record<string, unknown>>;
};

type BoundsLayer = L.Layer & {
  getBounds: () => L.LatLngBounds;
};

type ElementFocusTarget =
  | { kind: "point"; latLng: L.LatLng }
  | { kind: "bounds"; bounds: L.LatLngBounds; center: L.LatLng };

type DrawHandler = {
  enable: () => void;
  disable: () => void;
  enabled: () => boolean;
};

type LeafletWithEdit = typeof L & {
  Edit?: Record<string, unknown>;
};

function hasLeafletDraw(): boolean {
  return typeof L.Draw?.Marker === "function";
}

function loadLeafletDraw(): void {
  if (hasLeafletDraw()) return;
  const initializeDraw = new Function("window", "document", "L", leafletDrawScript) as (
    windowValue: Window & typeof globalThis,
    documentValue: Document,
    leaflet: typeof L
  ) => void;
  initializeDraw(window, document, L);
}

function ensureLeafletEditNamespace(): void {
  const editableLeaflet = L as LeafletWithEdit;
  editableLeaflet.Edit = editableLeaflet.Edit ?? {};
}

function hasGeoJson(layer: L.Layer): layer is GeoJsonLayer {
  return typeof (layer as { toGeoJSON?: unknown }).toGeoJSON === "function";
}

function hasBounds(layer: L.Layer): layer is BoundsLayer {
  return typeof (layer as { getBounds?: unknown }).getBounds === "function";
}

function gtaPositionToLatLng(coords: GeoJSON.Position): L.LatLng {
  return L.latLng(coords[1] ?? 0, coords[0] ?? 0);
}

function createNumberBadge(num: number, color: string, highlighted: boolean): L.DivIcon {
  return L.divIcon({
    className: highlighted ? "intel-number-badge highlighted" : "intel-number-badge",
    html: `<div style="background:${color}">${num}</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  });
}

function createPropertyPointIcon(hasLinkedSubject: boolean, color: string): L.DivIcon {
  const ring = hasLinkedSubject ? `box-shadow:0 0 0 3px ${color};` : "";
  return L.divIcon({
    className: "intel-property-point",
    html: `<div style="background:#dc2626;border:2px solid #fff;border-radius:50%;width:12px;height:12px;cursor:pointer;${ring}"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  });
}

function mapDrawLayerType(layerType: string): MapElementType {
  if (layerType === "marker") return "POINT";
  if (layerType === "polyline") return "POLYLINE";
  return "POLYGON";
}

function buildCreatedGeoJson(layer: L.Layer): { geoJson: string } | null {
  if (!hasGeoJson(layer)) return null;
  return { geoJson: JSON.stringify(layer.toGeoJSON()) };
}

function buildCircleGeoJson(center: L.LatLng, radius: number): { geoJson: string; radius: number } {
  const safeRadius = normalizeCircleRadius(radius);

  return {
    geoJson: JSON.stringify({
      type: "Feature",
      geometry: { type: "Point", coordinates: [center.lng, center.lat] },
      properties: { shape: "circle", radius: safeRadius }
    }),
    radius: safeRadius
  };
}

function pointFromGeoJson(geoJson: GeoJSON.GeoJsonObject): L.LatLng | null {
  if (isPointFeature(geoJson)) {
    return gtaPositionToLatLng(geoJson.geometry.coordinates);
  }

  if (isPointGeometry(geoJson)) {
    return gtaPositionToLatLng(geoJson.coordinates);
  }

  return null;
}

function isPointFeature(value: GeoJSON.GeoJsonObject): value is GeoJSON.Feature<GeoJSON.Point> {
  if (value.type !== "Feature") return false;
  const feature = value as GeoJSON.Feature<GeoJSON.Geometry>;
  return feature.geometry.type === "Point";
}

function isPointGeometry(value: GeoJSON.GeoJsonObject): value is GeoJSON.Point {
  return value.type === "Point";
}

function renderGeoJson(layerGroup: L.LayerGroup, geoJson: GeoJSON.GeoJsonObject, color: string, opacity: number): L.Layer {
  const layer = L.geoJSON(geoJson, {
    coordsToLatLng: gtaPositionToLatLng,
    style: () => ({
      color,
      fillColor: color,
      fillOpacity: Math.min(0.22, opacity),
      opacity,
      weight: 3
    }),
    pointToLayer: (_feature, latLng) =>
      L.circleMarker(latLng, {
        radius: 5,
        color,
        fillColor: color,
        fillOpacity: opacity,
        opacity,
        weight: 2
      })
  });
  layer.addTo(layerGroup);
  return layer;
}

function layerBounds(layer: L.Layer): L.LatLngBounds | null {
  try {
    if (layer instanceof L.Marker) return L.latLngBounds([layer.getLatLng()]);
    if (layer instanceof L.Circle) return validBoundsOrNull(layer.getBounds());
    if (hasBounds(layer)) return validBoundsOrNull(layer.getBounds());
    return null;
  } catch (error) {
    reportClientWarning("No se pudieron calcular los límites del elemento del mapa.", error);
    return null;
  }
}

function elementColor(element: MapElement): string {
  return element.organization?.color ?? element.color;
}

function normalizeCircleRadius(radius: number | null | undefined): number {
  if (radius === null || radius === undefined || !Number.isFinite(radius) || radius <= 0) {
    return DEFAULT_CIRCLE_RADIUS;
  }

  return Math.min(radius, MAX_CIRCLE_RADIUS);
}

function gtaRadiusBetween(center: L.LatLng, edge: L.LatLng): number {
  return Math.hypot(edge.lng - center.lng, edge.lat - center.lat);
}

function circlePoints(center: L.LatLng, radius: number): [number, number][] {
  const points: [number, number][] = [];
  const steps = 72;

  for (let index = 0; index < steps; index += 1) {
    const angle = (Math.PI * 2 * index) / steps;
    points.push([center.lng + Math.cos(angle) * radius, center.lat + Math.sin(angle) * radius]);
  }

  return points;
}

function pointsBounds(points: readonly [number, number][]): L.LatLngBounds | null {
  if (points.length === 0) return null;
  return validBoundsOrNull(L.latLngBounds(points.map(([x, y]) => L.latLng(y, x))));
}

function buildElementShape(
  element: MapElement,
  geoJson: GeoJSON.GeoJsonObject,
  color: string,
  opacity: number,
  highlighted: boolean
): { shape: GtaShape; bounds: L.LatLngBounds; center: L.LatLng } | null {
  const points = element.type === "CIRCLE"
    ? buildCirclePoints(geoJson, element.radius)
    : geoJsonPolygonToPoints(JSON.stringify(geoJson));

  const minPoints = element.type === "POLYLINE" ? 2 : 3;
  if (points.length < minPoints) return null;

  const bounds = pointsBounds(points);
  if (bounds === null) return null;

  const isLine = element.type === "POLYLINE";
  return {
    bounds,
    center: bounds.getCenter(),
    shape: {
      id: element.id,
      type: isLine ? "polyline" : "polygon",
      points,
      color,
      fillColor: color,
      weight: highlighted ? 5 : isLine ? 4 : 3,
      opacity,
      fillOpacity: isLine ? 0 : Math.min(0.2, opacity),
      popup: element.label
    }
  };
}

function buildCirclePoints(geoJson: GeoJSON.GeoJsonObject, radius: number | null): [number, number][] {
  const center = pointFromGeoJson(geoJson);
  if (center === null) return [];
  return circlePoints(center, normalizeCircleRadius(radius));
}

function isFiniteLatLng(latLng: L.LatLng): boolean {
  return Number.isFinite(latLng.lat) && Number.isFinite(latLng.lng);
}

function validBoundsOrNull(bounds: L.LatLngBounds | null | undefined): L.LatLngBounds | null {
  return bounds !== null &&
    bounds !== undefined &&
    bounds.isValid() &&
    isFiniteLatLng(bounds.getNorthEast()) &&
    isFiniteLatLng(bounds.getSouthWest()) &&
    isFiniteLatLng(bounds.getCenter())
    ? bounds
    : null;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function safeFocusMap(map: L.Map, target: ElementFocusTarget): void {
  if (target.kind === "point") {
    map.setView(target.latLng, Math.max(map.getZoom(), 5));
    return;
  }

  if (!isFiniteLatLng(target.center)) return;

  try {
    const bounds = validBoundsOrNull(target.bounds);
    if (bounds !== null) {
      map.fitBounds(bounds.pad(0.35), { padding: [40, 40], maxZoom: 5 });
      return;
    }
  } catch (error) {
    if (!errorMessage(error).includes("Bounds are not valid")) {
      reportClientWarning("No se pudo centrar el mapa en el elemento.", error);
    }
  }

  map.setView(target.center, Math.max(map.getZoom(), 5));
}

export function LosSantosMap({
  mapElements = [],
  activeOrgFilter = null,
  highlightedElementId = null,
  canManageIntel = false,
  height,
  clearPendingDraftSignal = 0,
  onElementDraft,
  onElementSelect,
  properties = [],
  showProperties = false,
  onPropertySelect
}: LosSantosMapProps): JSX.Element {
  const { componentRef, onMapReady } = useGtaMap();
  const [mapStyle, setMapStyle] = useState<MapStyle>("satellite");
  const [mapReadyVersion, setMapReadyVersion] = useState(0);
  const [activeDrawTool, setActiveDrawTool] = useState<MapElementType | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const elementLayerRef = useRef<L.LayerGroup | null>(null);
  const propertyLayerRef = useRef<L.LayerGroup | null>(null);
  const pendingDraftLayerRef = useRef<L.Layer | null>(null);
  const elementFocusRef = useRef<ReadonlyMap<string, ElementFocusTarget>>(new Map());
  const activeDrawerRef = useRef<DrawHandler | null>(null);
  const onElementDraftRef = useRef<typeof onElementDraft>(onElementDraft);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const containerStyle = useMemo(() => (height === undefined ? undefined : { minHeight: height }), [height]);

  useEffect(() => {
    onElementDraftRef.current = onElementDraft;
  }, [onElementDraft]);

  useEffect(() => {
    const element = componentRef.current;
    if (element === null) return;

    element.tileBaseUrl = "/mapStyles";
    element.defaultStyle = mapStyle;
    element.minZoom = 1;
    element.maxZoom = 5;
    element.zoom = 3;
    element.showLayerControl = false;
    element.disableClustering = true;
    element.classList.add("gta-map-component");
  }, [componentRef, mapStyle]);

  const setupMap = useCallback((map: L.Map): void => {
    if (mapRef.current === map) return;

    mapRef.current = map;
    elementLayerRef.current = L.layerGroup().addTo(map);
    propertyLayerRef.current = L.layerGroup().addTo(map);
    window.setTimeout(() => map.invalidateSize(), 100);
    setMapReadyVersion((current) => current + 1);
  }, []);

  useEffect(() => {
    onMapReady(setupMap);
  }, [onMapReady, setupMap]);

  useEffect(() => {
    const map = mapRef.current;
    if (map === null || !canManageIntel) return undefined;

    try {
      loadLeafletDraw();
      ensureLeafletEditNamespace();
    } catch {
      return undefined;
    }

    if (!hasLeafletDraw()) return undefined;

    const handleCreated = (event: L.LeafletEvent): void => {
      const createdEvent = event as L.DrawEvents.Created;
      const payload = buildCreatedGeoJson(createdEvent.layer);
      disableActiveDrawer();
      setActiveDrawTool(null);

      if (payload !== null) {
        removePendingDraftLayer();
        if (createdEvent.layerType === "marker") {
          createdEvent.layer.addTo(map);
          pendingDraftLayerRef.current = createdEvent.layer;
        }
        onElementDraftRef.current?.({
          type: mapDrawLayerType(createdEvent.layerType),
          geoJson: payload.geoJson
        });
      }
    };

    map.on(L.Draw.Event.CREATED, handleCreated);
    return () => {
      map.off(L.Draw.Event.CREATED, handleCreated);
      disableActiveDrawer();
      removePendingDraftLayer();
    };
  }, [canManageIntel, mapReadyVersion]);

  useEffect(() => {
    const map = mapRef.current;
    const container = containerRef.current;
    if (map === null || container === null) return undefined;

    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);
    return () => observer.disconnect();
  }, [mapReadyVersion]);

  useEffect(() => {
    removePendingDraftLayer();
    disableActiveDrawer();
    setActiveDrawTool(null);
  }, [clearPendingDraftSignal]);

  useEffect(() => {
    const layer = elementLayerRef.current;
    const mapComponent = componentRef.current;
    if (layer === null) return;
    layer.clearLayers();
    mapComponent?.clearShapes();
    const focusMap = new Map<string, ElementFocusTarget>();

    mapElements.forEach((element) => {
      const geoJson = parseGeoJson(element.geoJson);
      if (geoJson === null) return;

      const color = elementColor(element);
      const isDimmed = activeOrgFilter !== null && element.organizationId !== activeOrgFilter;
      const opacity = isDimmed ? 0.2 : 0.95;
      const highlighted = highlightedElementId === element.id;
      let renderedLayer: L.Layer | null = null;
      let center: L.LatLng | null = null;
      let bounds: L.LatLngBounds | null = null;
      let focusTarget: ElementFocusTarget | null = null;

      if (element.type === "POINT") {
        center = pointFromGeoJson(geoJson);
        if (center !== null) {
          focusTarget = { kind: "point", latLng: center };
          renderedLayer = L.marker(center, {
            icon: createPropertyPointIcon(element.linkedSubjects.length > 0, color),
            opacity
          }).bindTooltip(element.property?.address ?? element.label);
          renderedLayer.on("click", () => onElementSelect?.(element));
          renderedLayer.addTo(layer);
        }
      } else {
        const shape = buildElementShape(element, geoJson, color, opacity, highlighted);
        if (shape !== null) {
          mapComponent?.addShape(shape.shape);
          bounds = shape.bounds;
          center = shape.center;
          focusTarget = { kind: "bounds", bounds, center: shape.center };
        }
      }

      if (renderedLayer !== null) {
        bounds = layerBounds(renderedLayer);
      }

      if (bounds !== null) {
        center = center ?? bounds.getCenter();
      }

      if (focusTarget !== null) {
        focusMap.set(element.id, focusTarget);
      }

      if (center !== null) {
        const badge = L.marker(center, {
          icon: createNumberBadge(element.legendNumber, color, highlighted),
          opacity: isDimmed ? 0.35 : 1
        }).on("click", () => onElementSelect?.(element));
        badge.addTo(layer);
      }
    });

    elementFocusRef.current = focusMap;
  }, [activeOrgFilter, highlightedElementId, mapElements, mapReadyVersion, onElementSelect]);

  useEffect(() => {
    const layer = propertyLayerRef.current;
    if (layer === null) return;
    layer.clearLayers();
    if (!showProperties) return;

    properties.forEach((property) => {
      if (property.gtaX === null || property.gtaY === null) return;
      const marker = L.marker([property.gtaY, property.gtaX], {
        icon: createPropertyPointIcon((property.subjects ?? []).length > 0, "#9ca3af")
      })
        .bindTooltip(property.address)
        .on("click", () => onPropertySelect?.(property));
      marker.addTo(layer);
    });
  }, [mapReadyVersion, onPropertySelect, properties, showProperties]);

  useEffect(() => {
    const map = mapRef.current;
    if (map === null || highlightedElementId === null) return;

    const target = elementFocusRef.current.get(highlightedElementId);
    if (target !== undefined) {
      safeFocusMap(map, target);
    }
  }, [highlightedElementId]);

  const startDrawing = (type: MapElementType): void => {
    const map = mapRef.current;
    if (map === null || !canManageIntel) return;

    if (activeDrawTool === type) {
      disableActiveDrawer();
      setActiveDrawTool(null);
      return;
    }

    try {
      loadLeafletDraw();
      ensureLeafletEditNamespace();
    } catch {
      return;
    }

    disableActiveDrawer();

    if (type === "CIRCLE") {
      const drawer = createCircleDrawer(map);
      drawer.enable();
      activeDrawerRef.current = drawer;
      setActiveDrawTool(type);
      return;
    }

    if (!hasLeafletDraw()) return;

    const drawer = createDrawer(type, map);
    drawer.enable();
    activeDrawerRef.current = drawer;
    setActiveDrawTool(type);
  };

  return (
    <div ref={containerRef} className="los-santos-map" style={containerStyle} aria-label="Mapa de Los Santos">
      <div className="map-style-control" role="group" aria-label="Estilo del mapa">
        {MAP_STYLES.map((style) => (
          <button
            key={style.value}
            type="button"
            className={style.value === mapStyle ? "active" : undefined}
            onClick={() => setMapStyle(style.value)}
          >
            {style.label}
          </button>
        ))}
      </div>
      {canManageIntel ? (
        <div className="intel-map-toolbar" role="toolbar" aria-label="Herramientas de inteligencia">
          {DRAW_TOOLS.map((tool) => (
            <button
              key={tool.type}
              type="button"
              className={activeDrawTool === tool.type ? "active" : undefined}
              title={tool.tooltip}
              aria-label={tool.tooltip}
              onClick={() => startDrawing(tool.type)}
            >
              {tool.icon}
              <span>{tool.label}</span>
            </button>
          ))}
        </div>
      ) : null}
      <gta-v-map
        ref={componentRef}
        className="gta-map-component"
        tile-base-url="/mapStyles"
        default-style={mapStyle}
        min-zoom={1}
        max-zoom={5}
        zoom={3}
      />
    </div>
  );

  function createDrawer(type: MapElementType, map: L.Map): DrawHandler {
    if (type === "POINT") return new L.Draw.Marker(map as L.DrawMap, {}) as DrawHandler;
    if (type === "POLYGON") {
      return new L.Draw.Polygon(map as L.DrawMap, {
        shapeOptions: { color: "#8b5cf6", fillOpacity: 0.15, weight: 2 },
        allowIntersection: false,
        showArea: false
      }) as DrawHandler;
    }
    return new L.Draw.Polyline(map as L.DrawMap, {
      shapeOptions: { color: "#3b82f6", weight: 4 }
    }) as DrawHandler;
  }

  function createCircleDrawer(map: L.Map): DrawHandler {
    let enabled = false;
    let center: L.LatLng | null = null;
    let previewEl: HTMLDivElement | null = null;
    const container = map.getContainer();
    const previousCursor = container.style.cursor;

    function buildPreview(): HTMLDivElement {
      const div = document.createElement("div");
      div.style.position = "absolute";
      div.style.pointerEvents = "none";
      div.style.border = "2px solid #dc2626";
      div.style.background = "rgba(220, 38, 38, 0.15)";
      div.style.borderRadius = "50%";
      div.style.boxSizing = "border-box";
      div.style.zIndex = "400";
      div.style.left = "0";
      div.style.top = "0";
      div.style.width = "0";
      div.style.height = "0";
      container.appendChild(div);
      return div;
    }

    function updatePreview(currentLatLng: L.LatLng): void {
      if (center === null || previewEl === null) return;
      const centerPoint = map.latLngToContainerPoint(center);
      const edgePoint = map.latLngToContainerPoint(currentLatLng);
      const pixelRadius = centerPoint.distanceTo(edgePoint);
      const diameter = pixelRadius * 2;
      previewEl.style.left = `${centerPoint.x - pixelRadius}px`;
      previewEl.style.top = `${centerPoint.y - pixelRadius}px`;
      previewEl.style.width = `${diameter}px`;
      previewEl.style.height = `${diameter}px`;
    }

    function clearPreview(): void {
      if (previewEl !== null && previewEl.parentNode !== null) {
        previewEl.parentNode.removeChild(previewEl);
      }
      previewEl = null;
    }

    function onMouseDown(event: L.LeafletMouseEvent): void {
      if (!enabled) return;
      center = event.latlng;
      clearPreview();
      previewEl = buildPreview();
      map.on("mousemove", onMouseMove);
      map.on("mouseup", onMouseUp);
      L.DomEvent.preventDefault(event.originalEvent);
    }

    function onMouseMove(event: L.LeafletMouseEvent): void {
      if (center === null) return;
      updatePreview(event.latlng);
    }

    function onMouseUp(event: L.LeafletMouseEvent): void {
      map.off("mousemove", onMouseMove);
      map.off("mouseup", onMouseUp);
      if (center === null) return;

      const radius = gtaRadiusBetween(center, event.latlng);
      const finalCenter = center;
      center = null;
      clearPreview();

      if (radius < 1) {
        setActiveDrawTool(null);
        disableActiveDrawer();
        return;
      }

      removePendingDraftLayer();

      const { geoJson, radius: storedRadius } = buildCircleGeoJson(finalCenter, radius);
      onElementDraftRef.current?.({ type: "CIRCLE", geoJson, radius: storedRadius });

      setActiveDrawTool(null);
      disableActiveDrawer();
    }

    return {
      enable(): void {
        enabled = true;
        container.style.cursor = "crosshair";
        map.dragging.disable();
        map.on("mousedown", onMouseDown);
      },
      disable(): void {
        enabled = false;
        container.style.cursor = previousCursor;
        map.dragging.enable();
        map.off("mousedown", onMouseDown);
        map.off("mousemove", onMouseMove);
        map.off("mouseup", onMouseUp);
        clearPreview();
        center = null;
      },
      enabled(): boolean {
        return enabled;
      }
    };
  }

  function disableActiveDrawer(): void {
    const drawer = activeDrawerRef.current;
    if (drawer !== null) {
      if (drawer.enabled()) drawer.disable();
      activeDrawerRef.current = null;
    }
  }

  function removePendingDraftLayer(): void {
    const map = mapRef.current;
    const layer = pendingDraftLayerRef.current;
    if (map !== null && layer !== null) {
      map.removeLayer(layer);
    }
    pendingDraftLayerRef.current = null;
  }
}
