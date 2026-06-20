import { useCallback, useLayoutEffect, useRef } from "react";
import type { GtaVMap, MapClickDetail, MapReadyDetail } from "gta-v-map";
import "gta-v-map";
import type { Map as LeafletMap } from "leaflet";
import type { MutableRefObject } from "react";

type MapReadyHandler = (map: LeafletMap) => void;
type MapClickHandler = (x: number, y: number) => void;

export function useGtaMap(): {
  componentRef: MutableRefObject<GtaVMap | null>;
  leafletMapRef: MutableRefObject<LeafletMap | null>;
  onMapReady: (handler: MapReadyHandler) => void;
  onMapClick: (handler: MapClickHandler | null) => void;
} {
  const componentRef = useRef<GtaVMap | null>(null);
  const leafletMapRef = useRef<LeafletMap | null>(null);
  const readyHandlerRef = useRef<MapReadyHandler | null>(null);
  const clickHandlerRef = useRef<MapClickHandler | null>(null);

  const handleMapReady = useCallback((event: Event): void => {
    const detail = (event as CustomEvent<MapReadyDetail>).detail;
    leafletMapRef.current = detail.map;
    readyHandlerRef.current?.(detail.map);
  }, []);

  const handleMapClick = useCallback((event: Event): void => {
    const detail = (event as CustomEvent<MapClickDetail>).detail;
    clickHandlerRef.current?.(detail.x, detail.y);
  }, []);

  useLayoutEffect(() => {
    const element = componentRef.current;
    if (element === null) return undefined;

    element.addEventListener("map-ready", handleMapReady);
    element.addEventListener("map-click", handleMapClick);

    return () => {
      element.removeEventListener("map-ready", handleMapReady);
      element.removeEventListener("map-click", handleMapClick);
    };
  }, [handleMapClick, handleMapReady]);

  const onMapReady = useCallback((handler: MapReadyHandler): void => {
    readyHandlerRef.current = handler;
    if (leafletMapRef.current !== null) {
      handler(leafletMapRef.current);
    }
  }, []);

  const onMapClick = useCallback((handler: MapClickHandler | null): void => {
    clickHandlerRef.current = handler;
  }, []);

  return { componentRef, leafletMapRef, onMapReady, onMapClick };
}
