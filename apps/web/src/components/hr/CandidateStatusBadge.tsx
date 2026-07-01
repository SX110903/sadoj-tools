import type { CandidateStatus } from "../../types/sadoj";

const STATUS_LABELS: Readonly<Record<CandidateStatus, string>> = {
  PENDING: "Pendiente",
  INTERVIEWED: "Entrevistado",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado"
};

const STATUS_CLASSES: Readonly<Record<CandidateStatus, string>> = {
  PENDING: "priority-medium",
  INTERVIEWED: "priority-high",
  APPROVED: "status-active",
  REJECTED: "status-inactive"
};

export function CandidateStatusBadge({ status }: { status: CandidateStatus }): JSX.Element {
  return <span className={`badge ${STATUS_CLASSES[status]}`}>{STATUS_LABELS[status]}</span>;
}
