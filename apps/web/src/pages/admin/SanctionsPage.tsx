import { Check, Plus, Search } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/auth-context";
import { DecorationsSection } from "../../components/decorations/DecorationsSection";
import { UserSanctionsSection } from "../../components/profile/UserSanctionsSection";
import { apiRequest, type PaginationMeta } from "../../services/api";
import type { PersonRef, Sanction, SanctionType } from "../../types/sadoj";
import { roleLabel, shortDateTime } from "../../utils/labels";
import { EmptyState, RetryButton, SkeletonBlock } from "../../components/ui";

const MANAGE_TABS = ["Sanciones", "Condecoraciones"] as const;
type ManageTab = (typeof MANAGE_TABS)[number];

const SANCTION_TYPES = ["REPRIMAND", "WARNING", "SUSPENSION", "DEMOTION", "DISMISSAL"] as const;
const SEVERITY_VALUES = [1, 2, 3, 4, 5] as const;

const SANCTION_LABELS: Readonly<Record<SanctionType, string>> = {
  REPRIMAND: "Amonestación",
  WARNING: "Advertencia",
  SUSPENSION: "Suspensión",
  DEMOTION: "Degradación",
  DISMISSAL: "Cese"
};

interface EligibleUser extends PersonRef {
  username: string;
  badgeNumber: string | null;
}

interface SanctionFormState {
  userId: string;
  type: SanctionType;
  severity: number;
  description: string;
}

export function SanctionsPage(): JSX.Element {
  const { accessToken } = useAuth();
  const [searchParams] = useSearchParams();
  const initialUserId = searchParams.get("userId") ?? "";
  const [sanctions, setSanctions] = useState<Sanction[] | null>(null);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [eligibleUsers, setEligibleUsers] = useState<EligibleUser[]>([]);
  const [filterUserId, setFilterUserId] = useState(initialUserId);
  const [filterType, setFilterType] = useState("");
  const [filterActive, setFilterActive] = useState("");
  const [dialogOpen, setDialogOpen] = useState(searchParams.get("new") === "1");
  const [resolveTarget, setResolveTarget] = useState<Sanction | null>(null);
  const [resolvedNotes, setResolvedNotes] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [form, setForm] = useState<SanctionFormState>({ userId: initialUserId, type: "WARNING", severity: 1, description: "" });
  const [message, setMessage] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [manageSearch, setManageSearch] = useState("");
  const [manageQuery, setManageQuery] = useState("");
  const [selectedFiscal, setSelectedFiscal] = useState<EligibleUser | null>(null);
  const [manageTab, setManageTab] = useState<ManageTab>("Sanciones");
  const [sanctionsRefreshKey, setSanctionsRefreshKey] = useState(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => setManageQuery(manageSearch.trim().toLowerCase()), 250);
    return () => window.clearTimeout(timeout);
  }, [manageSearch]);

  const manageResults = useMemo(() => {
    if (manageQuery.length === 0) return [];
    return eligibleUsers
      .filter((user) => `${user.displayName} ${user.username} ${user.badgeNumber ?? ""} ${roleLabel(user.role)}`.toLowerCase().includes(manageQuery))
      .slice(0, 8);
  }, [eligibleUsers, manageQuery]);

  const openEmitFor = (fiscal: EligibleUser): void => {
    setForm((current) => ({ ...current, userId: fiscal.id }));
    setUserSearch("");
    setDialogOpen(true);
  };

  const load = async (): Promise<void> => {
    setLoadError(null);
    const query = new URLSearchParams();
    if (filterUserId.length > 0) query.set("userId", filterUserId);
    if (filterType.length > 0) query.set("type", filterType);
    if (filterActive.length > 0) query.set("active", filterActive);
    const suffix = query.size > 0 ? `?${query.toString()}` : "";

    const [sanctionsResult, usersResult] = await Promise.all([
      apiRequest<Sanction[]>(`/api/sanctions${suffix}`, {}, accessToken),
      apiRequest<EligibleUser[]>("/api/sanctions/eligible-users", {}, accessToken)
    ]);

    if (sanctionsResult.error) {
      setMessage(sanctionsResult.message);
      setLoadError(sanctionsResult.message);
    } else {
      setSanctions(sanctionsResult.data);
      setMeta(sanctionsResult.meta ?? null);
      setLoadError(null);
    }

    if (!usersResult.error) setEligibleUsers(usersResult.data);
  };

  useEffect(() => {
    void load();
  }, [accessToken, filterActive, filterType, filterUserId]);

  const filteredEligibleUsers = useMemo(() => {
    const normalized = userSearch.trim().toLowerCase();
    if (normalized.length === 0) return eligibleUsers;
    return eligibleUsers.filter((user) =>
      `${user.displayName} ${user.username} ${user.badgeNumber ?? ""}`.toLowerCase().includes(normalized)
    );
  }, [eligibleUsers, userSearch]);

  const validationMessage = validateSanctionForm(form);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (validationMessage !== null) return;

    const result = await apiRequest<Sanction>(
      "/api/sanctions",
      { method: "POST", body: JSON.stringify(form) },
      accessToken
    );

    setMessage(result.error ? result.message : "Sanción emitida correctamente.");
    if (!result.error) {
      setDialogOpen(false);
      setForm({ userId: "", type: "WARNING", severity: 1, description: "" });
      setSanctionsRefreshKey((current) => current + 1);
      await load();
    }
  };

  const handleResolve = async (): Promise<void> => {
    if (resolveTarget === null) return;
    const result = await apiRequest<Sanction>(
      `/api/sanctions/${resolveTarget.id}/resolve`,
      { method: "PATCH", body: JSON.stringify({ resolvedNotes: resolvedNotes.length > 0 ? resolvedNotes : undefined }) },
      accessToken
    );

    setMessage(result.error ? result.message : "Sanción resuelta correctamente.");
    if (!result.error) {
      setResolveTarget(null);
      setResolvedNotes("");
      await load();
    }
  };

  if (loadError !== null && sanctions === null) {
    return <div className="page"><EmptyState title={loadError} action={<RetryButton onRetry={() => void load()} />} /></div>;
  }

  if (sanctions === null) return <div className="page"><SkeletonBlock height={420} /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Disciplina interna</p>
          <h1>Sanciones</h1>
        </div>
        <button type="button" className="primary-button" onClick={() => setDialogOpen(true)}>
          <Plus size={18} />
          Emitir sanción
        </button>
      </div>
      {message !== null ? <p className="hint">{message}</p> : null}
      <section className="panel stack">
        <div>
          <p className="eyebrow">Gestión por fiscal</p>
          <h2>Buscar y gestionar fiscal</h2>
        </div>
        <label className="search-field">
          Buscar fiscal
          <span className="input-with-icon">
            <Search size={16} />
            <input value={manageSearch} onChange={(event) => setManageSearch(event.target.value)} placeholder="Nombre, usuario, placa o rango" />
          </span>
        </label>
        {manageResults.length > 0 ? (
          <div className="compact-list">
            {manageResults.map((user) => (
              <button key={user.id} type="button" className="compact-row fiscal-result" onClick={() => { setSelectedFiscal(user); setManageSearch(""); }}>
                <strong>{user.displayName}</strong>
                <span className="muted">{roleLabel(user.role)} · {user.badgeNumber ?? "Sin placa"}</span>
              </button>
            ))}
          </div>
        ) : null}
        {selectedFiscal !== null ? (
          <div className="panel stack fiscal-manage-panel">
            <div className="actions-row">
              <div>
                <p className="eyebrow">Fiscal seleccionado</p>
                <h3>{selectedFiscal.displayName} · {roleLabel(selectedFiscal.role)}</h3>
              </div>
              <button type="button" className="secondary-link compact-button" onClick={() => setSelectedFiscal(null)}>Quitar selección</button>
            </div>
            <div className="tab-list">
              {MANAGE_TABS.map((tab) => (
                <button key={tab} type="button" className={manageTab === tab ? "active" : ""} onClick={() => setManageTab(tab)}>{tab}</button>
              ))}
            </div>
            {manageTab === "Sanciones" ? (
              <UserSanctionsSection key={`sanctions-${selectedFiscal.id}-${sanctionsRefreshKey}`} userId={selectedFiscal.id} onEmit={() => openEmitFor(selectedFiscal)} />
            ) : (
              <DecorationsSection userId={selectedFiscal.id} />
            )}
          </div>
        ) : null}
      </section>
      <section className="panel form-grid">
        <label>
          Fiscal
          <select value={filterUserId} onChange={(event) => setFilterUserId(event.target.value)}>
            <option value="">Todos</option>
            {eligibleUsers.map((user) => <option key={user.id} value={user.id}>{user.displayName}</option>)}
          </select>
        </label>
        <label>
          Tipo
          <select value={filterType} onChange={(event) => setFilterType(event.target.value)}>
            <option value="">Todos</option>
            {SANCTION_TYPES.map((type) => <option key={type} value={type}>{SANCTION_LABELS[type]}</option>)}
          </select>
        </label>
        <label>
          Estado
          <select value={filterActive} onChange={(event) => setFilterActive(event.target.value)}>
            <option value="">Todas</option>
            <option value="true">Activas</option>
            <option value="false">Resueltas</option>
          </select>
        </label>
      </section>
      <section className="panel table-wrap">
        {sanctions.length === 0 ? (
          <EmptyState title="No hay sanciones registradas." />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Fiscal sancionado</th>
                <th>Tipo</th>
                <th>Severidad</th>
                <th>Emitida por</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sanctions.map((sanction) => (
                <tr key={sanction.id}>
                  <td><PersonCell person={sanction.user} /></td>
                  <td><SanctionBadge type={sanction.type} /></td>
                  <td><SeverityDots value={sanction.severity} /></td>
                  <td>{sanction.issuedBy.displayName}</td>
                  <td>{shortDateTime(sanction.createdAt)}</td>
                  <td><span className={sanction.active ? "badge status-active" : "badge status-inactive"}>{sanction.active ? "Activa" : "Resuelta"}</span></td>
                  <td>
                    {sanction.active ? (
                      <button type="button" className="secondary-link compact-button" onClick={() => setResolveTarget(sanction)}>
                        Resolver
                      </button>
                    ) : (
                      <span className="muted">Sin acciones</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {meta !== null ? <p className="muted">Total: {meta.total}</p> : null}
      </section>
      {dialogOpen ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <section className="modal-panel">
            <div className="actions-row">
              <div>
                <p className="eyebrow">Nueva medida disciplinaria</p>
                <h2>Emitir sanción</h2>
              </div>
              <button type="button" className="secondary-link compact-button" onClick={() => setDialogOpen(false)}>Cerrar</button>
            </div>
            <form className="form-grid" onSubmit={(event) => void handleSubmit(event)}>
              <label className="span-full">Buscar fiscal<input value={userSearch} onChange={(event) => setUserSearch(event.target.value)} placeholder="Nombre, usuario o placa" /></label>
              <label className="span-full">
                Fiscal sancionado
                <select value={form.userId} onChange={(event) => setForm((current) => ({ ...current, userId: event.target.value }))} required>
                  <option value="">Selecciona un fiscal de rango inferior</option>
                  {filteredEligibleUsers.map((user) => <option key={user.id} value={user.id}>{user.displayName} · {roleLabel(user.role)}</option>)}
                </select>
              </label>
              <label>
                Tipo
                <select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as SanctionType }))}>
                  {SANCTION_TYPES.map((type) => <option key={type} value={type}>{SANCTION_LABELS[type]}</option>)}
                </select>
              </label>
              <div>
                <p className="field-label">Severidad</p>
                <div className="severity-picker">
                  {SEVERITY_VALUES.map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={form.severity >= value ? "active" : undefined}
                      onClick={() => setForm((current) => ({ ...current, severity: value }))}
                      aria-label={`Severidad ${value}`}
                    >
                      ●
                    </button>
                  ))}
                </div>
              </div>
              <label className="span-full">
                Descripción
                <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} minLength={20} />
              </label>
              <p className="hint">{form.description.length}/20 caracteres mínimos</p>
              {validationMessage !== null ? <p className="error-message span-full">{validationMessage}</p> : null}
              <button className="primary-button" type="submit" disabled={validationMessage !== null}>Emitir sanción</button>
            </form>
          </section>
        </div>
      ) : null}
      {resolveTarget !== null ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <section className="modal-panel">
            <div className="actions-row">
              <div>
                <p className="eyebrow">Resolución disciplinaria</p>
                <h2>Resolver sanción</h2>
              </div>
              <button type="button" className="secondary-link compact-button" onClick={() => setResolveTarget(null)}>Cerrar</button>
            </div>
            <label>Notas de resolución<textarea value={resolvedNotes} onChange={(event) => setResolvedNotes(event.target.value)} /></label>
            <div className="actions-row">
              <button type="button" className="secondary-link" onClick={() => setResolveTarget(null)}>Cancelar</button>
              <button type="button" className="primary-button" onClick={() => void handleResolve()}>
                <Check size={18} />
                Resolver
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

export function SanctionBadge({ type }: { type: SanctionType }): JSX.Element {
  return <span className={`badge sanction-badge sanction-${type.toLowerCase()}`}>{SANCTION_LABELS[type]}</span>;
}

export function SeverityDots({ value }: { value: number }): JSX.Element {
  return (
    <span className="severity-dots" aria-label={`Severidad ${value} de 5`}>
      {SEVERITY_VALUES.map((level) => <span key={level} className={level <= value ? "active" : undefined}>●</span>)}
    </span>
  );
}

function PersonCell({ person }: { person: PersonRef }): JSX.Element {
  return (
    <div className="person-cell">
      {person.avatar !== null ? <img src={person.avatar} alt="" /> : <div className="avatar small">{person.displayName.slice(0, 1)}</div>}
      <div>
        <strong>{person.displayName}</strong>
        <small className="muted">{roleLabel(person.role)}</small>
      </div>
    </div>
  );
}

function validateSanctionForm(form: SanctionFormState): string | null {
  if (form.userId.length === 0) return "Selecciona un fiscal sancionado.";
  if (form.description.trim().length < 20) return "La descripción debe tener al menos 20 caracteres.";
  if (form.type === "SUSPENSION" && form.severity < 3) return "Una suspensión requiere severidad mínima de 3.";
  return null;
}
