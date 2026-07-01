import { Award, Crown, Gavel, Medal, Shield, Star, Trophy, type LucideIcon } from "lucide-react";
import type { CSSProperties } from "react";
import type { Decoration, DecorationTier } from "../../types/sadoj";

const ICON_MAP: Record<string, LucideIcon> = {
  medal: Medal,
  award: Award,
  shield: Shield,
  star: Star,
  trophy: Trophy,
  crown: Crown,
  gavel: Gavel
};

export const DECORATION_ICON_KEYS = Object.keys(ICON_MAP);

export const DECORATION_TIER_LABELS: Record<DecorationTier, string> = {
  BRONZE: "Bronce",
  SILVER: "Plata",
  GOLD: "Oro",
  PLATINUM: "Platino"
};

const DEFAULT_DECORATION_COLOR = "#d4a843";

interface DecorationBadgeProps {
  decoration: Decoration;
  size?: number;
}

export function DecorationBadge({ decoration, size = 52 }: DecorationBadgeProps): JSX.Element {
  const Icon = decoration.icon !== null ? ICON_MAP[decoration.icon] ?? Medal : Medal;
  const color = decoration.color ?? DEFAULT_DECORATION_COLOR;
  const style = { "--decoration-color": color, width: size, height: size } as CSSProperties;

  return (
    <span
      className={`decoration-medal tier-${decoration.tier.toLowerCase()}`}
      style={style}
      title={`${decoration.name} · ${DECORATION_TIER_LABELS[decoration.tier]}`}
      aria-label={`${decoration.name} (${DECORATION_TIER_LABELS[decoration.tier]})`}
    >
      <Icon size={Math.round(size * 0.46)} />
    </span>
  );
}
