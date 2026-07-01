import { CalendarClock } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/auth-context";
import { apiRequest } from "../../services/api";
import type { InvestigationPriority, InvestigationStatus, InvestigationType } from "../../types/sadoj";
import { relativeDate } from "../../utils/labels";
import { StatusBadge } from "../StatusBadge";
import { EmptyState, SkeletonBlock } from "../ui";

interface UserInvestigation {
  id: string;
  caseNumber: string;
  title: string;
  status: InvestigationStatus;
  priority: InvestigationPriority;
  type: InvestigationType;
  leadFiscalId: string;
  updatedAt: string;
  _count: { participants: number; subjects: number };
}

interface UserInvestigationsSectionProps {
  userId: string;
}

export function UserInvestigationsSection({ userId }: UserInvestigationsSectionProps): JSX.Element {
  const { accessToken } = useAuth();
  const [investigations, setInvestigations] = useState<UserInvestigation[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    const result = await apiRequest<UserInvestigation[]>(`/api/users/${encodeURIComponent(userId)}/investigations`, { suppressToast: true }, accessToken);

    if (result.error) {
      setInvestigations([]);
      setErrorMessage(result.message);
      return;
    }

    setInvestigations(result.data);
    setErrorMessage(null);
  }, [accessToken, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="panel stack">
      <div>
        <p className="eyebrow">Expedientes</p>
        <h2>Investigaciones participadas</h2>
      </div>
      {investigations === null ? <SkeletonBlock height={140} /> : null}
      {investigations !== null && investigations.length === 0 ? (
        <EmptyState title={errorMessage ?? "Sin investigaciones participadas."} />
      ) : null}
      {investigations !== null && investigations.length > 0 ? (
        <div className="compact-list">
          {investigations.map((investigation) => (
            <Link key={investigation.id} className="compact-row" to={`/investigaciones/${investigation.id}`}>
              <div className="actions-row">
                <span className="case-number">{investigation.caseNumber}</span>
                <StatusBadge value={investigation.status} />
                <span className="badge">{investigation.leadFiscalId === userId ? "Líder" : "Participante"}</span>
              </div>
              <strong>{investigation.title}</strong>
              <span className="muted">
                <CalendarClock size={14} /> {relativeDate(investigation.updatedAt)} · {investigation._count.participants} fiscales · {investigation._count.subjects} sujetos
              </span>
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}
