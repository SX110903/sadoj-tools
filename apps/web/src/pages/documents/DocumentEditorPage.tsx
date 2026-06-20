import { ArrowLeft, FileText, Save, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/auth-context";
import { DOCUMENT_DEFINITIONS, DOCUMENT_TYPE_LABELS, isDocumentType } from "../../components/document/documentDefinitions";
import { DocumentTemplateRenderer } from "../../components/document/DocumentTemplateRenderer";
import { EmptyState, SkeletonBlock } from "../../components/ui";
import { getInitialDocumentData, useDocumentForm, type FormDataMap } from "../../hooks/useDocumentForm";
import { apiRequest } from "../../services/api";
import type { DocumentType } from "../../types/documents";
import type { InvestigationListItem, OfficialDocument, Subject } from "../../types/sadoj";

type DocumentFormData = FormDataMap[DocumentType];

interface DocumentPayload {
  type: DocumentType;
  title: string;
  formData: Record<string, unknown>;
  investigationId?: string | null;
  subjectId?: string | null;
}

interface EditorWorkspaceProps {
  documentType: DocumentType;
  documentId: string | undefined;
  initialDocument: OfficialDocument | null;
  investigations: readonly InvestigationListItem[];
  subjects: readonly Subject[];
}

export function DocumentEditorPage(): JSX.Element {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { accessToken } = useAuth();
  const isEditing = id !== undefined;
  const initialTypeParam = searchParams.get("type");
  const [selectedType, setSelectedType] = useState<DocumentType | null>(isDocumentType(initialTypeParam ?? "") ? (initialTypeParam as DocumentType) : null);
  const [investigations, setInvestigations] = useState<InvestigationListItem[] | null>(null);
  const [subjects, setSubjects] = useState<Subject[] | null>(null);
  const [document, setDocument] = useState<OfficialDocument | null>(null);
  const [documentLoaded, setDocumentLoaded] = useState(!isEditing);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadOptions = async (): Promise<void> => {
      const [investigationsResult, subjectsResult] = await Promise.all([
        apiRequest<InvestigationListItem[]>("/api/investigations?limit=100", {}, accessToken),
        apiRequest<Subject[]>("/api/subjects?limit=100", {}, accessToken)
      ]);

      if (investigationsResult.error) {
        setErrorMessage(investigationsResult.message);
        setInvestigations([]);
      } else {
        setInvestigations(investigationsResult.data);
      }

      if (subjectsResult.error) {
        setErrorMessage(subjectsResult.message);
        setSubjects([]);
      } else {
        setSubjects(subjectsResult.data);
      }
    };

    void loadOptions();
  }, [accessToken]);

  useEffect(() => {
    if (!isEditing || id === undefined) return;

    const loadDocument = async (): Promise<void> => {
      const result = await apiRequest<OfficialDocument>(`/api/documents/${id}`, {}, accessToken);

      if (result.error) {
        setErrorMessage(result.message);
        setDocumentLoaded(true);
        return;
      }

      setDocument(result.data);
      setSelectedType(result.data.type);
      setDocumentLoaded(true);
    };

    void loadDocument();
  }, [accessToken, id, isEditing]);

  if (errorMessage !== null && isEditing && documentLoaded && document === null) return <EmptyState title={errorMessage} />;
  if (!documentLoaded || investigations === null || subjects === null) return <SkeletonBlock height={520} />;

  return (
    <div className="page document-editor-page">
      <div className="page-header no-print">
        <div>
          <p className="eyebrow">Documentos oficiales</p>
          <h1>{isEditing ? "Editar documento" : "Nuevo documento"}</h1>
        </div>
        <Link className="secondary-link" to={isEditing && id !== undefined ? `/documentos/${id}` : "/documentos"}>
          <ArrowLeft size={16} />
          Volver
        </Link>
      </div>
      {errorMessage !== null ? <p className="error-message no-print">{errorMessage}</p> : null}
      {selectedType === null ? (
        <TemplateSelector onSelect={setSelectedType} />
      ) : (
        <EditorWorkspace
          documentType={selectedType}
          documentId={id}
          initialDocument={document}
          investigations={investigations}
          subjects={subjects}
        />
      )}
    </div>
  );
}

function TemplateSelector({ onSelect }: { onSelect: (type: DocumentType) => void }): JSX.Element {
  const groups = groupDefinitions();

  return (
    <section className="document-template-selector no-print">
      {groups.map((group) => (
        <div key={group.category} className="document-template-group">
          <h2>{group.category}</h2>
          <div className="document-template-grid">
            {group.items.map((definition) => (
              <button key={definition.type} type="button" className="document-template-card" onClick={() => onSelect(definition.type)}>
                <FileText size={20} />
                <span>{definition.label}</span>
                <small>{definition.description}</small>
              </button>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

function EditorWorkspace({ documentType, documentId, initialDocument, investigations, subjects }: EditorWorkspaceProps): JSX.Element {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { accessToken, user } = useAuth();
  const isEditing = documentId !== undefined;
  const [title, setTitle] = useState(initialDocument?.title ?? DOCUMENT_TYPE_LABELS[documentType]);
  const [investigationId, setInvestigationId] = useState(initialDocument?.investigationId ?? searchParams.get("investigationId") ?? "");
  const [subjectId, setSubjectId] = useState(initialDocument?.subjectId ?? searchParams.get("subjectId") ?? "");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const initialData = useMemo(
    () => initialDocument?.formData ?? getInitialDocumentData(documentType),
    [documentType, initialDocument]
  );
  const { data, setData, reset, isLoaded } = useDocumentForm(documentType, {
    initialData: initialData as FormDataMap[typeof documentType],
    autosaveKey: isEditing ? null : `document-draft:${documentType}`
  });

  const selectedInvestigation = investigations.find((investigation) => investigation.id === investigationId) ?? null;
  const selectedSubject = subjects.find((subject) => subject.id === subjectId) ?? null;

  const saveDocument = async (): Promise<void> => {
    const syncedFormData = mergeNamedFormControls(
      data as unknown as Record<string, unknown>,
      "document-editor-folio"
    );
    const payload: DocumentPayload = {
      type: documentType,
      title: title.trim(),
      formData: syncedFormData
    };

    if (investigationId.length > 0) {
      payload.investigationId = investigationId;
    } else if (isEditing) {
      payload.investigationId = null;
    }

    if (subjectId.length > 0) {
      payload.subjectId = subjectId;
    } else if (isEditing) {
      payload.subjectId = null;
    }

    const result = await apiRequest<OfficialDocument>(
      isEditing ? `/api/documents/${documentId}` : "/api/documents",
      {
        method: isEditing ? "PUT" : "POST",
        body: JSON.stringify(payload)
      },
      accessToken
    );

    if (result.error) {
      setErrorMessage(result.message);
      return;
    }

    setData(result.data.formData as FormDataMap[typeof documentType]);
    navigate(`/documentos/${result.data.id}`);
  };

  const fillContext = (): void => {
    setData((current) => applyContext(current, selectedInvestigation, selectedSubject, user?.displayName ?? ""));
  };

  if (!isLoaded) return <SkeletonBlock height={620} />;

  return (
    <div className="document-workspace">
      <aside className="panel document-editor-sidebar no-print">
        {errorMessage !== null ? <p className="error-message">{errorMessage}</p> : null}
        <label>
          Plantilla
          <input value={DOCUMENT_TYPE_LABELS[documentType]} disabled />
        </label>
        <label>
          Título
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Título del documento" />
        </label>
        <label>
          Expediente vinculado
          <select value={investigationId} onChange={(event) => setInvestigationId(event.target.value)}>
            <option value="">Sin expediente</option>
            {investigations.map((investigation) => (
              <option key={investigation.id} value={investigation.id}>{investigation.caseNumber} · {investigation.title}</option>
            ))}
          </select>
        </label>
        <label>
          Sujeto vinculado
          <select value={subjectId} onChange={(event) => setSubjectId(event.target.value)}>
            <option value="">Sin sujeto</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>{subject.firstName} {subject.lastName}</option>
            ))}
          </select>
        </label>
        <button type="button" className="secondary-link" onClick={fillContext}>
          <FileText size={16} />
          Rellenar contexto
        </button>
        <button type="button" className="secondary-link" onClick={reset}>
          <RotateCcw size={16} />
          Restablecer plantilla
        </button>
        <button type="button" className="primary-button" disabled={title.trim().length < 3} onClick={() => void saveDocument()}>
          <Save size={16} />
          Guardar documento
        </button>
      </aside>
      <main id="document-editor-folio" className="document-paper-shell">
        <DocumentTemplateRenderer type={documentType} data={data} onChange={setData} />
      </main>
    </div>
  );
}

function mergeNamedFormControls(baseData: Record<string, unknown>, containerId: string): Record<string, unknown> {
  const container = window.document.getElementById(containerId);
  if (container === null) {
    return baseData;
  }

  const merged: Record<string, unknown> = { ...baseData };
  const controls = container.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
    "input[name], textarea[name], select[name]"
  );

  controls.forEach((control) => {
    if (control.name.length === 0) return;

    if (control instanceof HTMLInputElement && control.type === "checkbox") {
      merged[control.name] = control.checked;
      return;
    }

    if (control instanceof HTMLInputElement && control.type === "radio") {
      if (control.checked) {
        merged[control.name] = control.value;
      }
      return;
    }

    merged[control.name] = control.value;
  });

  return merged;
}

function groupDefinitions(): Array<{ category: string; items: typeof DOCUMENT_DEFINITIONS }> {
  const categories = Array.from(new Set(DOCUMENT_DEFINITIONS.map((definition) => definition.category)));

  return categories.map((category) => ({
    category,
    items: DOCUMENT_DEFINITIONS.filter((definition) => definition.category === category)
  }));
}

function applyContext(
  data: DocumentFormData,
  investigation: InvestigationListItem | null,
  subject: Subject | null,
  fiscalName: string
): DocumentFormData {
  const next: Record<string, unknown> = { ...(data as unknown as Record<string, unknown>) };
  const subjectName = subject === null ? "" : `${subject.firstName} ${subject.lastName}`.trim();

  setBlank(next, "numeroCausa", investigation?.caseNumber ?? "");
  setBlank(next, "numeroExpediente", investigation?.caseNumber ?? "");
  setBlank(next, "fiscalSolicitante", fiscalName);
  setBlank(next, "nombreFiscal", fiscalName);
  setBlank(next, "fiscalActuante", fiscalName);
  setBlank(next, "funcionarioResponsable", fiscalName);
  setBlank(next, "firmaResponsable", fiscalName);
  setBlank(next, "nombreCompleto", subjectName);
  setBlank(next, "nombreCitado", subjectName);
  setBlank(next, "nombreInterrogado", subjectName);
  setBlank(next, "nombreAcusado", subjectName);
  setBlank(next, "nombreConocido", subjectName);
  setBlank(next, "personaInvestigada", subjectName);
  setBlank(next, "identificacion", subject?.id ?? "");
  setBlank(next, "identificacionCitado", subject?.id ?? "");
  setBlank(next, "identificacionPersona", subject?.id ?? "");
  setBlank(next, "identificacionAcusado", subject?.id ?? "");
  setBlank(next, "domicilio", subject?.address ?? "");
  setBlank(next, "ultimoDomicilio", subject?.address ?? "");

  return next as unknown as DocumentFormData;
}

function setBlank(target: Record<string, unknown>, key: string, value: string): void {
  if (value.length === 0) return;
  const current = target[key];
  if (typeof current !== "string" || current.trim().length === 0) {
    target[key] = value;
  }
}
