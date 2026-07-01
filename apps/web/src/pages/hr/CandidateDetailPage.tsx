import { ArrowLeft, CheckCircle2, UserX } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CandidateApprovalDialog, CandidateRejectDialog } from "../../components/hr/CandidateDecisionDialogs";
import { CandidateInterviewSection } from "../../components/hr/CandidateInterviewSection";
import { CandidateStatusBadge } from "../../components/hr/CandidateStatusBadge";
import { EmptyState, RetryButton, SkeletonBlock } from "../../components/ui";
import { useCandidate } from "../../hooks/useCandidates";
import { shortDateTime } from "../../utils/labels";

export function CandidateDetailPage(): JSX.Element {
  const { id } = useParams();
  const candidateId = id ?? "";
  const { candidate, errorMessage, isLoading, refresh, saveInterview, approve, reject } = useCandidate(candidateId);
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);

  if (isLoading) return <div className="page"><SkeletonBlock height={460} /></div>;
  if (errorMessage !== null || candidate === null) {
    return <div className="page"><EmptyState title={errorMessage ?? "No se encontró el candidato."} action={<RetryButton onRetry={() => void refresh()} />} /></div>;
  }

  const isClosed = candidate.status === "APPROVED" || candidate.status === "REJECTED";
  const canApprove = !isClosed && candidate.interview?.result === "PASSED";

  return (
    <div className="page">
      <Link className="secondary-link align-self-start" to="/rrhh"><ArrowLeft size={16} />Volver a RRHH</Link>
      <div className="page-header">
        <div><p className="eyebrow">Ficha de candidato</p><h1>{candidate.fullName}</h1></div>
        <CandidateStatusBadge status={candidate.status} />
      </div>

      <section className="panel stack">
        <div className="detail-grid">
          <div><span>Contacto</span><strong>{candidate.contact ?? "Sin contacto"}</strong></div>
          <div><span>Registrado por</span><strong>{candidate.createdBy.displayName}</strong></div>
          <div><span>Fecha de alta</span><strong>{shortDateTime(candidate.createdAt)}</strong></div>
          <div><span>Cuenta vinculada</span><strong>{candidate.approvedUser?.username ?? "Pendiente"}</strong></div>
        </div>
        <div><p className="eyebrow">Notas</p><p>{candidate.notes ?? "Sin notas internas."}</p></div>
      </section>

      <CandidateInterviewSection
        interview={candidate.interview}
        isClosed={isClosed}
        onSave={async (input) => {
          const result = await saveInterview(input);
          return result.error ? result.message : null;
        }}
      />

      {!isClosed ? (
        <section className="panel stack">
          <div><p className="eyebrow">Decisión</p><h2>Resolver candidatura</h2></div>
          {!canApprove ? <p className="hint">La entrevista debe tener resultado Apto antes de aprobar y crear la cuenta.</p> : null}
          <div className="actions-row justify-start">
            <button type="button" className="primary-button" disabled={!canApprove} onClick={() => setIsApprovalOpen(true)}><CheckCircle2 size={17} />Aprobar</button>
            <button type="button" className="danger-button" onClick={() => setIsRejectOpen(true)}><UserX size={17} />Rechazar</button>
          </div>
        </section>
      ) : null}

      {candidate.approvedUser !== null ? (
        <section className="panel"><p>Cuenta creada: <Link to={`/fiscales/${candidate.approvedUser.id}`}>{candidate.approvedUser.displayName} ({candidate.approvedUser.username})</Link></p></section>
      ) : null}

      {isApprovalOpen ? (
        <CandidateApprovalDialog
          candidateName={candidate.fullName}
          onClose={() => setIsApprovalOpen(false)}
          onApprove={async (input) => {
            const result = await approve(input);
            return result.error ? result.message : null;
          }}
        />
      ) : null}
      {isRejectOpen ? (
        <CandidateRejectDialog
          onClose={() => setIsRejectOpen(false)}
          onReject={async (reason) => {
            const result = await reject(reason);
            return result.error ? result.message : null;
          }}
        />
      ) : null}
    </div>
  );
}
