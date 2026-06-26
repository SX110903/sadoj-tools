import html2pdf from "html2pdf.js";
import { Archive, Download, Edit, PenLine, Printer, Send, Trash2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../../auth/auth-context";
import { DocumentTemplateRenderer } from "../../components/document/DocumentTemplateRenderer";
import { StatusBadge } from "../../components/StatusBadge";
import { EmptyState, RetryButton, RoleBadge, SkeletonBlock } from "../../components/ui";
import { apiRequest } from "../../services/api";
import type { DocumentType, FormData as DocumentFormData } from "../../types/documents";
import type { DocumentStatus, OfficialDocument, RoleType } from "../../types/sadoj";
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

export function DocumentDetailPage(): JSX.Element {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken, user } = useAuth();
  const [document, setDocument] = useState<OfficialDocument | null>(null);
  const [formData, setFormData] = useState<DocumentFormData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = async (): Promise<void> => {
    if (id === undefined) return;

    const result = await apiRequest<OfficialDocument>(`/api/documents/${id}`, {}, accessToken);

    if (result.error) {
      setErrorMessage(result.message);
      return;
    }

    setDocument(result.data);
    setFormData(result.data.formData);
  };

  useEffect(() => {
    void load();
  }, [accessToken, id]);

  const patchStatus = async (status: DocumentStatus): Promise<void> => {
    if (document === null) return;
    const result = await apiRequest<OfficialDocument>(
      `/api/documents/${document.id}/status`,
      { method: "PATCH", body: JSON.stringify({ status }) },
      accessToken
    );

    if (result.error) {
      setErrorMessage(result.message);
      return;
    }

    setDocument(result.data);
    setFormData(result.data.formData);
  };

  const sign = async (): Promise<void> => {
    if (document === null) return;
    const result = await apiRequest<OfficialDocument>(`/api/documents/${document.id}/sign`, { method: "PATCH", body: "{}" }, accessToken);

    if (result.error) {
      setErrorMessage(result.message);
      return;
    }

    setDocument(result.data);
    setFormData(result.data.formData);
  };

  const deleteDocument = async (): Promise<void> => {
    if (document === null) return;
    const confirmed = window.confirm("¿Eliminar este documento? Esta acción no se puede deshacer.");

    if (!confirmed) return;

    const result = await apiRequest<{ deleted: boolean }>(`/api/documents/${document.id}`, { method: "DELETE" }, accessToken);

    if (result.error) {
      setErrorMessage(result.message);
      return;
    }

    navigate("/documentos");
  };

  const downloadPdf = (): void => {
    if (document === null) return;

    const element = window.document.getElementById("document-folio");
    if (element === null) {
      toast.error("No se pudo preparar el folio para descarga.");
      return;
    }

    void html2pdf()
      .set({
        margin: 0,
        filename: `${document.documentNumber}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
      })
      .from(element)
      .save();
  };

  if (id === undefined) return <EmptyState title="Documento no encontrado." />;
  if (errorMessage !== null && document === null) return <EmptyState title={errorMessage} action={<RetryButton onRetry={() => void load()} />} />;
  if (document === null || formData === null) return <SkeletonBlock height={520} />;

  const userRole = user?.role as RoleType | undefined;
  const roleLevel = userRole === undefined ? 0 : ROLE_LEVEL[userRole];
  const isAuthor = user?.id === document.createdById;
  const canEdit = document.status === "DRAFT" && (isAuthor || roleLevel >= 8);
  const canIssue = canEdit;
  const canSign = document.status === "ISSUED" && roleLevel >= 7;
  const canArchive = document.status !== "ARCHIVED" && roleLevel >= 8;
  const canDelete = document.status === "DRAFT" && (isAuthor || roleLevel >= 9);

  return (
    <div className="page document-detail-page">
      <header className="detail-header no-print">
        <div>
          <p className="case-number">{document.documentNumber}</p>
          <h1>{document.title}</h1>
          <div className="badge-row">
            <StatusBadge value={document.type} kind="type" />
            <StatusBadge value={document.status} />
          </div>
        </div>
        <div className="actions-row">
          {canEdit ? (
            <Link className="secondary-link" to={`/documentos/${document.id}/editar`}>
              <Edit size={16} />
              Editar
            </Link>
          ) : null}
          {canIssue ? (
            <button type="button" className="primary-button" onClick={() => void patchStatus("ISSUED")}>
              <Send size={16} />
              Emitir
            </button>
          ) : null}
          {canSign ? (
            <button type="button" className="primary-button" onClick={() => void sign()}>
              <PenLine size={16} />
              Firmar
            </button>
          ) : null}
          {canArchive ? (
            <button type="button" className="secondary-link" onClick={() => void patchStatus("ARCHIVED")}>
              <Archive size={16} />
              Archivar
            </button>
          ) : null}
          {canDelete ? (
            <button type="button" className="danger-button" onClick={() => void deleteDocument()}>
              <Trash2 size={16} />
              Eliminar
            </button>
          ) : null}
          <button type="button" className="primary-button" onClick={downloadPdf}>
            <Download size={16} />
            Descargar PDF
          </button>
          <button type="button" className="secondary-link" onClick={() => window.print()}>
            <Printer size={16} />
            Imprimir
          </button>
        </div>
      </header>
      {errorMessage !== null ? <p className="error-message no-print">{errorMessage}</p> : null}
      <main className="document-paper-shell">
        <DocumentTemplateRenderer
          type={document.type as DocumentType}
          data={formData}
          onChange={setFormData}
          readOnly
          elementId="document-folio"
        />
      </main>
      <section className="panel no-print">
        <h2>Trazabilidad</h2>
        <dl className="details-grid">
          <div><dt>Número</dt><dd>{document.documentNumber}</dd></div>
          <div><dt>Tipo</dt><dd>{TYPE_LABELS[document.type] ?? document.type}</dd></div>
          <div><dt>Estado</dt><dd>{statusLabel(document.status)}</dd></div>
          <div><dt>Creado</dt><dd>{shortDateTime(document.createdAt)}</dd></div>
          <div><dt>Última actualización</dt><dd>{shortDateTime(document.updatedAt)}</dd></div>
          <div><dt>Autor</dt><dd>{document.createdBy.displayName} <RoleBadge role={document.authorRole} /></dd></div>
          <div><dt>Firmado por</dt><dd>{document.signedBy?.displayName ?? "Pendiente de firma"}</dd></div>
          <div><dt>Fecha de firma</dt><dd>{shortDateTime(document.signedAt)}</dd></div>
          <div><dt>Expediente</dt><dd>{document.investigation?.caseNumber ?? "Sin expediente vinculado"}</dd></div>
          <div><dt>Sujeto</dt><dd>{document.subject === null || document.subject === undefined ? "Sin sujeto vinculado" : `${document.subject.firstName} ${document.subject.lastName}`}</dd></div>
        </dl>
      </section>
    </div>
  );
}

function statusLabel(status: DocumentStatus): string {
  const labels: Readonly<Record<DocumentStatus, string>> = {
    DRAFT: "Borrador",
    ISSUED: "Emitido",
    SIGNED: "Firmado",
    ARCHIVED: "Archivado"
  };

  return labels[status];
}
