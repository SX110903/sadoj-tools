import { AlertTriangle, Check, CheckCheck, Clock, X } from "lucide-react";
import { DANGER_LABELS, PRIORITY_LABELS, STATUS_LABELS, TYPE_LABELS } from "../utils/labels";

interface BadgeProps {
  value: string;
  kind?: "status" | "priority" | "type" | "danger" | "plain";
}

const WARRANT_ICONS: Readonly<Record<string, JSX.Element>> = {
  PENDING: <Clock size={13} />,
  APPROVED: <Check size={13} />,
  REJECTED: <X size={13} />,
  EXECUTED: <CheckCheck size={13} />,
  EXPIRED: <AlertTriangle size={13} />
};

export function StatusBadge({ value, kind = "status" }: BadgeProps): JSX.Element {
  const label = labelFor(value, kind);
  const icon = WARRANT_ICONS[value] ?? null;

  return (
    <span className={`badge badge-${kind} badge-${value.toLowerCase().replaceAll("_", "-")}`}>
      {icon}
      {label}
    </span>
  );
}

function labelFor(value: string, kind: BadgeProps["kind"]): string {
  if (kind === "priority") return PRIORITY_LABELS[value] ?? value;
  if (kind === "type") return TYPE_LABELS[value] ?? value;
  if (kind === "danger") return DANGER_LABELS[value] ?? value;
  return STATUS_LABELS[value] ?? value;
}
