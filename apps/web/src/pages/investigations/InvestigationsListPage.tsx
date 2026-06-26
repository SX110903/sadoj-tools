import { CalendarClock, FolderPlus, LayoutGrid, List, Search, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/auth-context";
import { StatusBadge } from "../../components/StatusBadge";
import { EmptyState, SkeletonBlock } from "../../components/ui";
import { apiRequest } from "../../services/api";
import type { InvestigationListItem, InvestigationPriority, InvestigationStatus, InvestigationType } from "../../types/sadoj";
import { relativeDate, TYPE_LABELS } from "../../utils/labels";

const STATUSES: readonly InvestigationStatus[] = ["OPEN", "ACTIVE", "SUSPENDED", "CLOSED_SUCCESSFUL", "CLOSED_DISMISSED"];
const PRIORITIES: readonly InvestigationPriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const TYPES: readonly InvestigationType[] = ["CRIMINAL", "FINANCIAL", "CORRUPTION", "ORGANIZED_CRIME", "NARCOTICS", "WEAPONS", "CIVIL", "MIXED"];

type ViewMode = "grid" | "table";

export function InvestigationsListPage(): JSX.Element {
  const { accessToken, hasPermission } = useAuth();
  const [investigations, setInvestigations] = useState<InvestigationListItem[] | null>(null);
  const [filters, setFilters] = useState({ search: "", status: "", type: "", priority: "" });
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadInvestigations = useCallback(async (): Promise<void> => {
    const params = new URLSearchParams({ limit: "100" });
    if (filters.search.trim().length > 0) params.set("search", filters.search.trim());
    if (filters.status.length > 0) params.set("status", filters.status);
    if (filters.type.length > 0) params.set("type", filters.type);
    if (filters.priority.length > 0) params.set("priority", filters.priority);

    const result = await apiRequest<InvestigationListItem[]>(`/api/investigations?${params.toString()}`, {}, accessToken);

    if (result.error) {
      setErrorMessage(result.message);
      return;
    }

    setErrorMessage(null);
    setInvestigations(result.data);
  }, [accessToken, filters]);

  useEffect(() => {
    void loadInvestigations();
  }, [loadInvestigations]);

  const setFilter = (field: keyof typeof filters, value: string): void => {
    setFilters((current) => ({ ...current, [field]: value }));
  };

  if (errorMessage !== null && investigations === null) {
    return (
      <EmptyState
        title={errorMessage}
        action={<button type="button" className="secondary-link" onClick={() => void loadInvestigations()}>Reintentar</button>}
      />
    );
  }
  if (investigations === null) return <SkeletonBlock height={360} />;

  return (
    <div className="page investigations-page">
      <div className="investigations-hero">
        <div>
          <p className="eyebrow">Expedientes</p>
          <h1>Investigaciones</h1>
          <p>Seguimiento operativo de casos, sujetos, documentos y actividad fiscal.</p>
        </div>
        <div className="actions-row">
          <div className="segmented-control">
            <button type="button" className={viewMode === "grid" ? "active" : ""} onClick={() => setViewMode("grid")} aria-label="Vista de tarjetas">
              <LayoutGrid size={16} />
            </button>
            <button type="button" className={viewMode === "table" ? "active" : ""} onClick={() => setViewMode("table")} aria-label="Vista de tabla">
              <List size={16} />
            </button>
          </div>
          {hasPermission("CREATE_INVESTIGATION") ? (
            <Link className="primary-link" to="/investigaciones/nueva">
              <FolderPlus size={16} />
              Nueva investigación
            </Link>
          ) : null}
        </div>
      </div>
      <section className="panel investigation-filter-bar">
        <label className="search-field">
          Buscar
          <span className="input-with-icon">
            <Search size={16} />
            <input value={filters.search} onChange={(event) => setFilter("search", event.target.value)} placeholder="Expediente, título o descripción" />
          </span>
        </label>
        <label>
          Estado
          <select value={filters.status} onChange={(event) => setFilter("status", event.target.value)}>
            <option value="">Todos</option>
            {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </label>
        <label>
          Tipo
          <select value={filters.type} onChange={(event) => setFilter("type", event.target.value)}>
            <option value="">Todos</option>
            {TYPES.map((type) => <option key={type} value={type}>{TYPE_LABELS[type] ?? type}</option>)}
          </select>
        </label>
        <label>
          Prioridad
          <select value={filters.priority} onChange={(event) => setFilter("priority", event.target.value)}>
            <option value="">Todas</option>
            {PRIORITIES.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
          </select>
        </label>
      </section>
      {errorMessage !== null ? <p className="error-message">{errorMessage}</p> : null}
      {investigations.length === 0 ? (
        <EmptyState title="No hay investigaciones con esos filtros." />
      ) : viewMode === "grid" ? (
        <section className="investigation-card-grid">
          {investigations.map((investigation) => <InvestigationCard key={investigation.id} investigation={investigation} />)}
        </section>
      ) : (
        <InvestigationsTable investigations={investigations} />
      )}
    </div>
  );
}

function InvestigationCard({ investigation }: { investigation: InvestigationListItem }): JSX.Element {
  const priorityClass = `priority-${investigation.priority.toLowerCase()}`;
  const subjectCount = investigation.counts?.subjects ?? 0;
  const participantCount = investigation.counts?.participants ?? 0;

  return (
    <Link className={`investigation-card-pro ${priorityClass}`} to={`/investigaciones/${investigation.id}`}>
      <div className="investigation-card-top">
        <span className="case-number">{investigation.caseNumber}</span>
        <StatusBadge value={investigation.status} />
      </div>
      <h2>{investigation.title}</h2>
      <p>{investigation.description}</p>
      <div className="badge-row">
        <StatusBadge value={investigation.type} kind="type" />
        <StatusBadge value={investigation.priority} kind="priority" />
      </div>
      <div className="investigation-progress" aria-hidden="true">
        <span style={{ width: progressForStatus(investigation.status) }} />
      </div>
      <footer>
        <span><Users size={14} /> {participantCount} fiscales · {subjectCount} sujetos</span>
        <span><CalendarClock size={14} /> {relativeDate(investigation.updatedAt)}</span>
      </footer>
    </Link>
  );
}

function InvestigationsTable({ investigations }: { investigations: readonly InvestigationListItem[] }): JSX.Element {
  return (
    <section className="panel table-wrap">
      <table>
        <thead>
          <tr>
            <th>Expediente</th>
            <th>Título</th>
            <th>Tipo</th>
            <th>Estado</th>
            <th>Prioridad</th>
            <th>Fiscal líder</th>
          </tr>
        </thead>
        <tbody>
          {investigations.map((investigation) => (
            <tr key={investigation.id}>
              <td>
                <Link className="case-number" to={`/investigaciones/${investigation.id}`}>
                  {investigation.caseNumber}
                </Link>
              </td>
              <td>{investigation.title}</td>
              <td>{TYPE_LABELS[investigation.type] ?? investigation.type}</td>
              <td><StatusBadge value={investigation.status} /></td>
              <td><StatusBadge value={investigation.priority} kind="priority" /></td>
              <td>{investigation.leadFiscal.displayName}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function progressForStatus(status: InvestigationStatus): string {
  const values: Readonly<Record<InvestigationStatus, string>> = {
    OPEN: "20%",
    ACTIVE: "55%",
    SUSPENDED: "35%",
    CLOSED_SUCCESSFUL: "100%",
    CLOSED_DISMISSED: "100%"
  };

  return values[status];
}
