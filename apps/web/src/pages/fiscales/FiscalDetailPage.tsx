import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useAuth, type UserSession } from "../../auth/auth-context";
import { ImageUrlInput } from "../../components/common/ImageUrlInput";
import { EmptyState, RoleBadge, SkeletonBlock } from "../../components/ui";
import { apiRequest } from "../../services/api";
import type { Sanction } from "../../types/sadoj";
import { SanctionBadge, SeverityDots } from "../admin/SanctionsPage";
import { formatHubDate } from "../../utils/labels";

const FISCAL_TABS = ["Perfil", "Investigaciones", "Notas", "Sanciones"] as const;
type FiscalTab = (typeof FISCAL_TABS)[number];

export function FiscalDetailPage(): JSX.Element {
  const { id } = useParams();
  const { accessToken, hasPermission, user, refreshUser } = useAuth();
  const [fiscal, setFiscal] = useState<UserSession | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [activeTab, setActiveTab] = useState<FiscalTab>("Perfil");
  const [sanctions, setSanctions] = useState<Sanction[] | null>(null);

  const loadFiscal = async (): Promise<void> => {
    if (id === undefined) return;
    const result = await apiRequest<UserSession>(`/api/users/${id}`, {}, accessToken);

    if (result.error) {
      setErrorMessage(result.message);
    } else {
      setFiscal(result.data);
    }
  };

  useEffect(() => {
    void loadFiscal();
  }, [accessToken, id]);

  useEffect(() => {
    const loadSanctions = async (): Promise<void> => {
      if (id === undefined || activeTab !== "Sanciones") return;
      const result = await apiRequest<Sanction[]>(`/api/sanctions/by-user/${id}`, {}, accessToken);
      setSanctions(result.error ? [] : result.data);
    };

    void loadSanctions();
  }, [accessToken, activeTab, id]);

  if (errorMessage !== null) return <EmptyState title={errorMessage} />;
  if (fiscal === null) return <div className="page"><SkeletonBlock height={320} /></div>;
  const canEditAvatar = user?.id === fiscal.id || hasPermission("MANAGE_USERS");

  const openAvatarDialog = (): void => {
    setAvatarUrl(fiscal.avatar ?? "");
    setAvatarDialogOpen(true);
  };

  const handleAvatarSubmit = async (): Promise<void> => {
    const result = await apiRequest<UserSession>(
      `/api/users/${fiscal.id}/avatar`,
      { method: "PATCH", body: JSON.stringify({ avatarUrl }) },
      accessToken
    );

    setMessage(result.error ? result.message : "Avatar actualizado correctamente.");
    if (!result.error) {
      setAvatarDialogOpen(false);
      await loadFiscal();
      if (user?.id === fiscal.id) await refreshUser();
    }
  };

  return (
    <div className="page">
      <div className="detail-header">
        <button type="button" className="editable-photo" disabled={!canEditAvatar} onClick={openAvatarDialog} aria-label="Cambiar foto">
          {fiscal.avatar !== null ? <img className="avatar-preview" src={fiscal.avatar} alt="" /> : <div className="avatar large">{fiscal.displayName.slice(0, 1)}</div>}
          {canEditAvatar ? <span><Pencil size={16} /> Cambiar foto</span> : null}
        </button>
        <div>
          <p className="eyebrow">Perfil fiscal</p>
          <h1>{fiscal.displayName}</h1>
          <RoleBadge role={fiscal.role} />
          {message !== null ? <p className="hint">{message}</p> : null}
        </div>
      </div>
      <section className="tabs-shell">
        <div className="tab-list">
          {FISCAL_TABS.map((tab) => (
            <button key={tab} type="button" className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)}>{tab}</button>
          ))}
        </div>
        {activeTab === "Perfil" ? (
        <div className="panel">
          <dl className="details-grid">
            <div><dt>Usuario</dt><dd>{fiscal.username}</dd></div>
            <div><dt>Nº Placa</dt><dd className="case-number">{fiscal.badgeNumber ?? "Sin placa"}</dd></div>
            <div><dt>Email</dt><dd>{fiscal.email ?? "Sin email"}</dd></div>
            <div><dt>División</dt><dd>{fiscal.division ?? "Sin división"}</dd></div>
            <div><dt>Última conexión</dt><dd>{formatHubDate(fiscal.lastLoginAt)}</dd></div>
            <div><dt>Bio</dt><dd>{fiscal.bio ?? "Sin biografía"}</dd></div>
          </dl>
          {hasPermission("MANAGE_USERS") ? (
            <div className="actions-row">
              <Link className="secondary-link" to="/fiscales">Volver a fiscales</Link>
              <button type="button" className="danger-button">Desactivar cuenta</button>
            </div>
          ) : null}
        </div>
        ) : null}
        {activeTab === "Sanciones" ? (
          <section className="panel stack">
            <div className="actions-row">
              <div>
                <p className="eyebrow">Historial disciplinario</p>
                <h2>Sanciones</h2>
              </div>
              {hasPermission("MANAGE_SANCTIONS") ? <Link className="primary-link" to={`/admin/sanciones?userId=${fiscal.id}&new=1`}>Emitir desde aquí</Link> : null}
            </div>
            {sanctions === null ? <SkeletonBlock height={160} /> : null}
            {sanctions !== null && sanctions.length === 0 ? <EmptyState title="No hay sanciones registradas para este fiscal." /> : null}
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
        ) : null}
      </section>
      {avatarDialogOpen ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <section className="modal-panel image-url-dialog">
            <div className="actions-row">
              <div>
                <p className="eyebrow">Foto de perfil</p>
                <h2>Modificar avatar</h2>
              </div>
              <button type="button" className="secondary-link compact-button" onClick={() => setAvatarDialogOpen(false)}>Cerrar</button>
            </div>
            <ImageUrlInput value={avatarUrl} onChange={setAvatarUrl} shape="circle" label="URL del avatar" />
            <div className="actions-row">
              <button type="button" className="secondary-link" onClick={() => setAvatarDialogOpen(false)}>Cancelar</button>
              <button type="button" className="primary-button" onClick={() => void handleAvatarSubmit()}>Guardar foto</button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
