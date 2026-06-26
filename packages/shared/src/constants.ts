import { RoleType } from "./types";

export const API_URL = "/api";

export const ROLE_LABELS_ES: Readonly<Record<RoleType, string>> = {
  [RoleType.FISCAL_GENERAL]: "Attorney General",
  [RoleType.FISCAL_ADJUNTO]: "Deputy Attorney General",
  [RoleType.FISCAL_DIVISION]: "District Attorney",
  [RoleType.FISCAL_SUPERIOR]: "Senior Deputy District Attorney",
  [RoleType.FISCAL_JEFE]: "Deputy District Attorney",
  [RoleType.FISCAL]: "Senior Prosecutor",
  [RoleType.FISCAL_AUXILIAR]: "Prosecutor",
  [RoleType.INVESTIGADOR_SENIOR]: "Assistant Prosecutor",
  [RoleType.INVESTIGADOR_JUNIOR]: "Legal Staff",
  [RoleType.PASANTE]: "Legal Intern"
};

export const ROLE_LEVEL: Readonly<Record<RoleType, number>> = {
  [RoleType.FISCAL_GENERAL]: 10,
  [RoleType.FISCAL_ADJUNTO]: 9,
  [RoleType.FISCAL_DIVISION]: 8,
  [RoleType.FISCAL_SUPERIOR]: 7,
  [RoleType.FISCAL_JEFE]: 6,
  [RoleType.FISCAL]: 5,
  [RoleType.FISCAL_AUXILIAR]: 4,
  [RoleType.INVESTIGADOR_SENIOR]: 3,
  [RoleType.INVESTIGADOR_JUNIOR]: 2,
  [RoleType.PASANTE]: 1
};

export const SADOJ_THEME_COLORS = {
  sadoj950: "#0a0f1a",
  sadoj900: "#111827",
  sadoj800: "#1c2537",
  sadoj700: "#263044",
  sadoj600: "#374151",
  sadoj400: "#6b7a99",
  sadoj200: "#9ca3af",
  sadoj100: "#e2e8f0",
  accent: "#8b9db5",
  accentLight: "#b0bec5",
  accentDark: "#5c6e82"
} as const;

export const DANGER_COLORS: Readonly<Record<string, string>> = {
  LOW: "#16a34a",
  MEDIUM: "#ca8a04",
  HIGH: "#ea580c",
  EXTREME: "#dc2626"
};

export interface LosSantosDistrict {
  id: number;
  name: string;
  subZones: readonly string[];
}

export const LOS_SANTOS_DISTRICTS: readonly LosSantosDistrict[] = [
  { id: 1, name: "Los Santos Centro", subZones: ["Downtown LS", "Rockford Hills", "Vinewood", "Hawick", "Little Seoul"] },
  { id: 2, name: "South Los Santos", subZones: ["Strawberry", "Davis", "Chamberlain Hills", "Jamestown St", "Grove St"] },
  { id: 3, name: "LS County", subZones: ["East LS", "Cypress Flats", "La Mesa", "Puerto Del Sol", "El Burro Heights"] },
  { id: 4, name: "Blaine County", subZones: ["Sandy Shores", "Grand Senora Desert", "Grapeseed", "Alamo Sea", "Zancudo"] },
  { id: 5, name: "Paleto Bay", subZones: ["Paleto Bay", "Paleto Forest", "Chumash", "Pacific Bluffs", "Banham Canyon"] }
];
