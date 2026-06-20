import type React from "react";
import type { GtaMarker, GtaShape, GtaVMap, LatLngBoundsTuple, MapStyle } from "gta-v-map";

type GtaVMapElementProps = React.DetailedHTMLProps<React.HTMLAttributes<GtaVMap>, GtaVMap> & {
  "leaflet-css-url"?: string;
  "tile-base-url"?: string;
  "satellite-url"?: string;
  "atlas-url"?: string;
  "grid-url"?: string;
  "default-style"?: MapStyle;
  "min-zoom"?: number;
  "max-zoom"?: number;
  "max-bounds"?: LatLngBoundsTuple | null;
  "max-bounds-viscosity"?: number;
  "show-layer-control"?: boolean;
  "disable-clustering"?: boolean;
  "place-mode"?: boolean;
  "show-heatmap"?: boolean;
  "blips-url"?: string;
  zoom?: number;
  markers?: GtaMarker[];
  shapes?: GtaShape[];
};

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "gta-v-map": GtaVMapElementProps;
    }
  }
}

export {};
