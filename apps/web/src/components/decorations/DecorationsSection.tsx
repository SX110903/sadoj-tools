import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../auth/auth-context";
import { useDecorationCatalog, useUserDecorations } from "../../hooks/useDecorations";
import { apiRequest } from "../../services/api";
import type { DecorationAward } from "../../types/sadoj";
import { formatHubDate } from "../../utils/labels";
import { EmptyState, SkeletonBlock } from "../ui";
import { DECORATION_TIER_LABELS, DecorationBadge } from "./DecorationBadge";

interface DecorationsSectionProps {
  userId: string;
}

export function DecorationsSection({ userId }: DecorationsSectionProps): JSX.Element {
  const { accessToken, hasPermission } = useAuth();
  const canManage = hasPermission("MANAGE_USERS");
  const { awards, refresh } = useUserDecorations(userId);
  const { catalog } = useDecorationCatalog(canManage);
  const [selectedDecorationId, setSelectedDecorationId] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAward = async (): Promise<void> => {
    if (selectedDecorationId === "") return;
    setIsSubmitting(true);
    const result = await apiRequest<DecorationAward>(
      `/api/users/${encodeURIComponent(userId)}/decorations`,
      { method: "POST", body: JSON.stringify({ decorationId: selectedDecorationId, reason: reason.trim() === "" ? undefined : reason.trim() }) },
      accessToken
    );
    setIsSubmitting(false);

    if (!result.error) {
      setSelectedDecorationId("");
      setReason("");
      await refresh();
    }
  };

  const handleRevoke = async (awardId: string): Promise<void> => {
    if (!window.confirm("¿Revocar esta condecoración?")) return;
    const result = await apiRequest<{ revoked: boolean }>(
      `/api/users/${encodeURIComponent(userId)}/decorations/${encodeURIComponent(awardId)}`,
      { method: "DELETE" },
      accessToken
    );

    if (!result.error) {
      await refresh();
    }
  };

  return (
    <section className="panel stack">
      <div>
        <p className="eyebrow">Reconocimientos</p>
        <h2>Condecoraciones</h2>
      </div>
      {canManage ? (
        <div className="decoration-award-form">
          <select value={selectedDecorationId} onChange={(event) => setSelectedDecorationId(event.target.value)} aria-label="Condecoración a otorgar">
            <option value="">Selecciona una condecoración…</option>
            {catalog.map((decoration) => (
              <option key={decoration.id} value={decoration.id}>{decoration.name} ({DECORATION_TIER_LABELS[decoration.tier]})</option>
            ))}
          </select>
          <input value={reason} placeholder="Motivo (opcional)" onChange={(event) => setReason(event.target.value)} />
          <button type="button" className="primary-button" disabled={selectedDecorationId === "" || isSubmitting} onClick={() => void handleAward()}>
            <Plus size={16} />
            Otorgar
          </button>
        </div>
      ) : null}
      {awards === null ? <SkeletonBlock height={120} /> : null}
      {awards !== null && awards.length === 0 ? <EmptyState title="Sin condecoraciones todavía." /> : null}
      {awards !== null && awards.length > 0 ? (
        <div className="decoration-gallery">
          {awards.map((award) => (
            <article className="decoration-card" key={award.id}>
              <DecorationBadge decoration={award.decoration} />
              <div className="decoration-card-body">
                <strong>{award.decoration.name}</strong>
                <span className="muted">{DECORATION_TIER_LABELS[award.decoration.tier]}</span>
                {award.reason !== null ? <p>{award.reason}</p> : null}
                <span className="muted">Otorgada por {award.awardedBy.displayName} · {formatHubDate(award.awardedAt)}</span>
              </div>
              {canManage ? (
                <button type="button" className="icon-button" aria-label="Revocar condecoración" onClick={() => void handleRevoke(award.id)}>
                  <Trash2 size={16} />
                </button>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
