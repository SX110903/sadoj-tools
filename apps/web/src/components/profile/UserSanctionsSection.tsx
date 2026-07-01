import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/auth-context";
import { apiRequest } from "../../services/api";
import type { Sanction } from "../../types/sadoj";
import { formatHubDate } from "../../utils/labels";
import { SanctionBadge, SeverityDots } from "../../pages/admin/SanctionsPage";
import { EmptyState, SkeletonBlock } from "../ui";

interface UserSanctionsSectionProps {
  userId: string;
  onEmit?: () => void;
}

export function UserSanctionsSection({ userId, onEmit }: UserSanctionsSectionProps): JSX.Element {
  const { accessToken, hasPermission } = useAuth();
  const [sanctions, setSanctions] = useState<Sanction[] | null>(null);

  const load = useCallback(async (): Promise<void> => {
    const result = await apiRequest<Sanction[]>(`/api/sanctions/by-user/${encodeURIComponent(userId)}`, { suppressToast: true }, accessToken);
    setSanctions(result.error ? [] : result.data);
  }, [accessToken, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="panel stack">
      <div className="actions-row">
        <div>
          <p className="eyebrow">Historial disciplinario</p>
          <h2>Sanciones</h2>
        </div>
        {onEmit !== undefined ? (
          <button type="button" className="primary-link" onClick={onEmit}>Emitir sanción</button>
        ) : hasPermission("MANAGE_SANCTIONS") ? (
          <Link className="primary-link" to={`/admin/sanciones?userId=${encodeURIComponent(userId)}&new=1`}>Emitir desde aquí</Link>
        ) : null}
      </div>
      {sanctions === null ? <SkeletonBlock height={160} /> : null}
      {sanctions !== null && sanctions.length === 0 ? <EmptyState title="No hay sanciones registradas." /> : null}
      {sanctions !== null && sanctions.length > 0 ? (
        <div className="compact-list">
          {sanctions.map((sanction) => (
            <article className="compact-row" key={sanction.id}>
              <div className="actions-row">
                <SanctionBadge type={sanction.type} />
                <span className={sanction.active ? "badge status-active" : "badge status-inactive"}>{sanction.active ? "Activa" : "Resuelta"}</span>
              </div>
              <p>{sanction.description}</p>
              <div className="badge-row">
                <SeverityDots value={sanction.severity} />
                <span className="muted">Emitida por {sanction.issuedBy.displayName} · {formatHubDate(sanction.createdAt)}</span>
              </div>
              {sanction.resolvedNotes !== null ? <p className="muted">Resolución: {sanction.resolvedNotes}</p> : null}
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
