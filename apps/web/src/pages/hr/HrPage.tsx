import { Plus, Search, Trash2, UserCheck } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { CandidateFormDialog } from "../../components/hr/CandidateFormDialog";
import { CandidateStatusBadge } from "../../components/hr/CandidateStatusBadge";
import { EmptyState, RetryButton, SkeletonBlock } from "../../components/ui";
import { useCandidates } from "../../hooks/useCandidates";
import type { CandidateStatus } from "../../types/sadoj";
import { shortDateTime } from "../../utils/labels";

const STATUS_OPTIONS: ReadonlyArray<{ value: CandidateStatus | ""; label: string }> = [
  { value: "", label: "Todos" },
  { value: "PENDING", label: "Pendientes" },
  { value: "INTERVIEWED", label: "Entrevistados" },
  { value: "APPROVED", label: "Aprobados" },
  { value: "REJECTED", label: "Rechazados" }
];

export function HrPage(): JSX.Element {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<CandidateStatus | "">("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { candidates, errorMessage, isLoading, meta, createCandidate, deleteCandidate, refresh } = useCandidates({ search, status, page: 1 });

  const handleDelete = async (id: string): Promise<void> => {
    if (!window.confirm("¿Eliminar este candidato y su entrevista?")) return;
    await deleteCandidate(id);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div><p className="eyebrow">Recursos Humanos</p><h1>Entrevistas a candidatos</h1></div>
        <button type="button" className="primary-button" onClick={() => setIsCreateOpen(true)}><Plus size={18} />Registrar candidato</button>
      </div>

      <section className="panel stack">
        <div className="hr-list-toolbar">
          <label className="search-field">
            Buscar
            <span className="input-with-icon"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nombre o contacto" /></span>
          </label>
          <div className="tab-list hr-status-tabs" aria-label="Filtrar por estado">
            {STATUS_OPTIONS.map((option) => (
              <button key={option.value || "all"} type="button" className={status === option.value ? "active" : ""} onClick={() => setStatus(option.value)}>{option.label}</button>
            ))}
          </div>
        </div>

        {isLoading ? <SkeletonBlock height={280} /> : null}
        {!isLoading && errorMessage !== null ? <EmptyState title={errorMessage} action={<RetryButton onRetry={() => void refresh()} />} /> : null}
        {!isLoading && errorMessage === null && candidates.length === 0 ? (
          <EmptyState title="No hay candidatos para este filtro." description="Registra un candidato o cambia los filtros de búsqueda." icon={<UserCheck size={28} />} />
        ) : null}
        {!isLoading && candidates.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Candidato</th><th>Estado</th><th>Entrevista</th><th>Nota</th><th>Entrevistador</th><th>Alta</th><th>Acciones</th></tr></thead>
              <tbody>
                {candidates.map((candidate) => (
                  <tr key={candidate.id}>
                    <td><strong>{candidate.fullName}</strong><span className="table-secondary">{candidate.contact ?? "Sin contacto"}</span></td>
                    <td><CandidateStatusBadge status={candidate.status} /></td>
                    <td>{candidate.interview?.conductedAt !== null && candidate.interview?.conductedAt !== undefined ? shortDateTime(candidate.interview.conductedAt) : candidate.interview?.scheduledAt !== null && candidate.interview?.scheduledAt !== undefined ? `Programada: ${shortDateTime(candidate.interview.scheduledAt)}` : "Sin programar"}</td>
                    <td>{candidate.interview?.score ?? "—"}</td>
                    <td>{candidate.interview?.interviewer.displayName ?? "—"}</td>
                    <td>{shortDateTime(candidate.createdAt)}</td>
                    <td>
                      <div className="row-actions">
                        <Link to={`/rrhh/${candidate.id}`}>Ver ficha</Link>
                        {candidate.approvedUserId === null ? <button type="button" className="icon-button" aria-label={`Eliminar a ${candidate.fullName}`} onClick={() => void handleDelete(candidate.id)}><Trash2 size={15} /></button> : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        {meta !== null ? <p className="muted">{meta.total} candidatos</p> : null}
      </section>

      {isCreateOpen ? (
        <CandidateFormDialog
          onClose={() => setIsCreateOpen(false)}
          onSubmit={async (input) => {
            const result = await createCandidate(input);
            return result.error ? result.message : null;
          }}
        />
      ) : null}
    </div>
  );
}
