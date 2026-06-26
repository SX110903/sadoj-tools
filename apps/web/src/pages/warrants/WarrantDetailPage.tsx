import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../auth/auth-context";
import { FileUploadPanel } from "../../components/files/FileUploadPanel";
import { StatusBadge } from "../../components/StatusBadge";
import { EmptyState, RetryButton, RoleBadge, SkeletonBlock } from "../../components/ui";
import { apiRequest } from "../../services/api";
import type { RoleType, Warrant, WarrantReport, WarrantResult } from "../../types/sadoj";
import { shortDateTime, TYPE_LABELS } from "../../utils/labels";

const ROLE_LEVEL: Readonly<Record<RoleType, number>> = {
  FISCAL_GENERAL: 10,
  FISCAL_ADJUNTO: 9,
  FISCAL_DIVISION: 8,
  FISCAL_SUPERIOR: 7,
  FISCAL_JEFE: 6,
  FISCAL: 5,
  FISCAL_AUXILIAR: 4,
  INVESTIGADOR_SENIOR: 3,
  INVESTIGADOR_JUNIOR: 2,
  PASANTE: 1
};

export function WarrantDetailPage(): JSX.Element {
  const { id } = useParams();
  const { accessToken, user, hasPermission } = useAuth();
  const [warrant, setWarrant] = useState<Warrant | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = async (): Promise<void> => {
    if (id === undefined) return;

    const result = await apiRequest<Warrant>(`/api/warrants/${id}`, {}, accessToken);

    if (result.error) {
      setErrorMessage(result.message);
      return;
    }

    setWarrant(result.data);
  };

  useEffect(() => {
    void load();
  }, [id, accessToken]);

  const patch = async (path: string, body: object = {}): Promise<void> => {
    const result = await apiRequest<Warrant>(path, { method: "PATCH", body: JSON.stringify(body) }, accessToken);

    if (result.error) {
      setErrorMessage(result.message);
      return;
    }

    setWarrant(result.data);
  };

  if (errorMessage !== null && warrant === null) return <EmptyState title={errorMessage} action={<RetryButton onRetry={() => void load()} />} />;
  if (id === undefined) return <EmptyState title="Orden no encontrada." />;
  if (warrant === null) return <SkeletonBlock height={420} />;

  const canReview = user !== null && ROLE_LEVEL[user.role as RoleType] >= ROLE_LEVEL.FISCAL_DIVISION;
  const canExecute = hasPermission("MANAGE_WARRANTS");

  return (
    <div className="page">
      <header className="detail-header">
        <div>
          <p className="case-number">{warrant.warrantNumber}</p>
          <h1>{warrant.title}</h1>
          <div className="badge-row">
            <StatusBadge value={warrant.type} kind="type" />
            <StatusBadge value={warrant.status} />
          </div>
        </div>
      </header>
      {errorMessage !== null ? <p className="error-message">{errorMessage}</p> : null}
      <section className="grid-two">
        <article className="panel">
          <h2>Contenido de la orden</h2>
          <dl className="details-grid">
            <div><dt>Investigación</dt><dd>{warrant.investigation === undefined ? "Sin expediente" : <Link to={`/investigaciones/${warrant.investigation.id}`}>{warrant.investigation.caseNumber} · {warrant.investigation.title}</Link>}</dd></div>
            {warrant.property !== undefined && warrant.property !== null ? (
              <div><dt>Propiedad objetivo</dt><dd><Link to={`/propiedades/${warrant.property.id}`}>{warrant.property.address}</Link></dd></div>
            ) : null}
            <div><dt>Objetivo</dt><dd>{warrant.location}</dd></div>
            <div><dt>Descripción</dt><dd>{warrant.description}</dd></div>
            <div><dt>Fundamentación</dt><dd>{warrant.justification}</dd></div>
          </dl>
          <div className="legal-box">{warrant.legalBasis}</div>
        </article>
        <article className="panel">
          <h2>Tramitación</h2>
          <div className="compact-list">
            <div className="compact-row">
              <strong>Solicitada por</strong>
              <span>{warrant.requestedBy?.displayName ?? "Fiscalía"}</span>
              {warrant.requestedBy !== undefined ? <RoleBadge role={warrant.requestedBy.role} /> : null}
            </div>
            <div className="compact-row">
              <strong>Aprobada por</strong>
              <span>{warrant.approvedBy?.displayName ?? "Pendiente"}</span>
              <small>{shortDateTime(warrant.approvedAt)}</small>
            </div>
            <div className="compact-row">
              <strong>Creación</strong>
              <span>{shortDateTime(warrant.createdAt)}</span>
            </div>
          </div>
          <WarrantActions warrant={warrant} canReview={canReview} canExecute={canExecute} onPatch={(path, body) => void patch(path, body)} />
        </article>
      </section>
      {warrant.status === "EXECUTED" ? (
        <section className="panel">
          <h2>Ejecución</h2>
          <p>{warrant.executionNotes}</p>
          <small className="muted">{shortDateTime(warrant.executedAt)}</small>
        </section>
      ) : null}
      {warrant.rejectionReason !== null ? (
        <section className="panel">
          <h2>Motivo de rechazo</h2>
          <p>{warrant.rejectionReason}</p>
        </section>
      ) : null}
      {warrant.status === "EXECUTED" ? (
        <WarrantReportSection
          warrant={warrant}
          canCreate={hasPermission("MANAGE_WARRANTS")}
          onCreated={(report) => setWarrant((current) => current === null ? current : { ...current, warrantReport: report })}
        />
      ) : null}
      <FileUploadPanel targetType="warrant" targetId={warrant.id} initialFiles={warrant.files ?? []} />
    </div>
  );
}

const WARRANT_RESULTS: readonly WarrantResult[] = ["POSITIVE", "NEGATIVE", "PARTIAL"];
const WARRANT_RESULT_LABELS: Readonly<Record<WarrantResult, string>> = {
  POSITIVE: "Positivo",
  NEGATIVE: "Negativo",
  PARTIAL: "Parcial"
};

function WarrantReportSection({
  warrant,
  canCreate,
  onCreated
}: {
  warrant: Warrant;
  canCreate: boolean;
  onCreated: (report: WarrantReport) => void;
}): JSX.Element {
  const { accessToken } = useAuth();
  const [form, setForm] = useState({ result: "POSITIVE" as WarrantResult, findings: "", evidence: "", persons: "", participatingAgencies: "", notes: "" });
  const [message, setMessage] = useState<string | null>(null);
  const report = warrant.warrantReport ?? null;

  const createReport = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const result = await apiRequest<WarrantReport>(
      `/api/warrants/${warrant.id}/report`,
      {
        method: "POST",
        body: JSON.stringify({
          result: form.result,
          findings: form.findings,
          evidence: form.evidence.length > 0 ? form.evidence : undefined,
          persons: form.persons.length > 0 ? form.persons : undefined,
          participatingAgencies: form.participatingAgencies.length > 0 ? form.participatingAgencies : undefined,
          notes: form.notes.length > 0 ? form.notes : undefined
        })
      },
      accessToken
    );

    if (result.error) {
      setMessage(result.message);
      return;
    }

    onCreated(result.data);
    setMessage("Informe registrado correctamente.");
  };

  if (report !== null) {
    return (
      <section className="panel stack">
        <div className="actions-row">
          <h2>Informe de ejecución</h2>
          <StatusBadge value={report.result} />
        </div>
        <dl className="details-grid">
          {report.raidSequence !== null ? <div><dt>Allanamiento de propiedad</dt><dd>#{report.raidSequence}</dd></div> : null}
          <div><dt>Hallazgos</dt><dd>{report.findings}</dd></div>
          <div><dt>Evidencia incautada</dt><dd>{report.evidence ?? "Sin evidencia registrada"}</dd></div>
          <div><dt>Personas presentes</dt><dd>{report.persons ?? "Sin personas registradas"}</dd></div>
          <div><dt>Agencias participantes</dt><dd>{report.participatingAgencies ?? "Fiscalía SADOJ"}</dd></div>
          <div><dt>Notas adicionales</dt><dd>{report.notes ?? "Sin notas adicionales"}</dd></div>
          <div><dt>Registrado por</dt><dd>{report.createdBy?.displayName ?? "Fiscalía"} · {shortDateTime(report.createdAt)}</dd></div>
        </dl>
        <FileUploadPanel targetType="warrantReport" targetId={report.id} initialFiles={report.files ?? []} />
      </section>
    );
  }

  if (!canCreate) return <EmptyState title="La orden ejecutada aún no tiene informe." />;

  return (
    <section className="panel">
      <h2>Informe de ejecución</h2>
      <form className="form-grid" onSubmit={(event) => void createReport(event)}>
        <label>
          Resultado
          <select value={form.result} onChange={(event) => setForm((current) => ({ ...current, result: event.target.value as WarrantResult }))}>
            {WARRANT_RESULTS.map((result) => <option key={result} value={result}>{WARRANT_RESULT_LABELS[result]}</option>)}
          </select>
        </label>
        <label className="span-full">
          Hallazgos
          <textarea value={form.findings} onChange={(event) => setForm((current) => ({ ...current, findings: event.target.value }))} />
        </label>
        <label className="span-full">
          Evidencia incautada
          <textarea value={form.evidence} onChange={(event) => setForm((current) => ({ ...current, evidence: event.target.value }))} />
        </label>
        <label className="span-full">
          Personas presentes
          <textarea value={form.persons} onChange={(event) => setForm((current) => ({ ...current, persons: event.target.value }))} />
        </label>
        <label className="span-full">
          Agencias participantes
          <input value={form.participatingAgencies} onChange={(event) => setForm((current) => ({ ...current, participatingAgencies: event.target.value }))} placeholder="Fiscalía SADOJ, USMS" />
        </label>
        <label className="span-full">
          Notas adicionales
          <textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
        </label>
        <button type="submit" className="primary-button span-full" disabled={form.findings.trim().length < 10}>Guardar informe de ejecución</button>
        {message !== null ? <p className="muted span-full">{message}</p> : null}
      </form>
    </section>
  );
}

function WarrantActions({
  warrant,
  canReview,
  canExecute,
  onPatch
}: {
  warrant: Warrant;
  canReview: boolean;
  canExecute: boolean;
  onPatch: (path: string, body?: object) => void;
}): JSX.Element {
  const handleReject = (): void => {
    const reason = window.prompt("Motivo de rechazo");

    if (reason === null || reason.trim().length < 10) return;
    onPatch(`/api/warrants/${warrant.id}/reject`, { reason });
  };

  const handleExecute = (): void => {
    const executionNotes = window.prompt("Notas de ejecución");

    if (executionNotes === null || executionNotes.trim().length === 0) return;
    onPatch(`/api/warrants/${warrant.id}/execute`, { executionNotes });
  };

  if (warrant.status === "PENDING" && canReview) {
    return (
      <div className="actions-row action-panel">
        <button type="button" className="primary-button" onClick={() => onPatch(`/api/warrants/${warrant.id}/approve`)}>
          Aprobar
        </button>
        <button type="button" className="danger-button" onClick={handleReject}>
          Rechazar
        </button>
      </div>
    );
  }

  if (warrant.status === "APPROVED" && canExecute) {
    return (
      <div className="action-panel">
        <button type="button" className="primary-button" onClick={handleExecute}>
          Marcar como ejecutada
        </button>
      </div>
    );
  }

  return <p className="muted action-panel">No hay acciones disponibles para este estado.</p>;
}
