import { FileText, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/auth-context";
import { DOCUMENT_DEFINITIONS } from "../../components/document/documentDefinitions";
import { StatusBadge } from "../../components/StatusBadge";
import { EmptyState, RetryButton, RoleBadge, SkeletonBlock } from "../../components/ui";
import { apiRequest } from "../../services/api";
import type { DocumentStatus, OfficialDocument, RoleType } from "../../types/sadoj";
import { shortDateTime } from "../../utils/labels";

const DOCUMENT_STATUSES: readonly DocumentStatus[] = ["DRAFT", "ISSUED", "SIGNED", "ARCHIVED"];

interface FiscalOption {
  id: string;
  displayName: string;
  role: RoleType;
  avatar: string | null;
  badgeNumber: string | null;
}

export function DocumentsListPage(): JSX.Element {
  const { accessToken, hasPermission } = useAuth();
  const canFilterAuthor = hasPermission("MANAGE_USERS");
  const [documents, setDocuments] = useState<OfficialDocument[] | null>(null);
  const [authors, setAuthors] = useState<FiscalOption[]>([]);
  const [filters, setFilters] = useState({ search: "", type: "", status: "", authorId: "" });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!canFilterAuthor) return;

    const loadAuthors = async (): Promise<void> => {
      const result = await apiRequest<FiscalOption[]>("/api/users?limit=100&active=true", {}, accessToken);

      if (!result.error) {
        setAuthors(result.data);
      }
    };

    void loadAuthors();
  }, [accessToken, canFilterAuthor]);

  useEffect(() => {
    const loadDocuments = async (): Promise<void> => {
      const params = new URLSearchParams({ limit: "100" });
      if (filters.search.trim().length > 0) params.set("search", filters.search.trim());
      if (filters.type.length > 0) params.set("type", filters.type);
      if (filters.status.length > 0) params.set("status", filters.status);
      if (filters.authorId.length > 0) params.set("authorId", filters.authorId);

      const result = await apiRequest<OfficialDocument[]>(`/api/documents?${params.toString()}`, {}, accessToken);

      if (result.error) {
        setErrorMessage(result.message);
        return;
      }

      setErrorMessage(null);
      setDocuments(result.data);
    };

    void loadDocuments();
  }, [accessToken, filters]);

  const setFilter = (field: keyof typeof filters, value: string): void => {
    setFilters((current) => ({ ...current, [field]: value }));
  };

  if (errorMessage !== null && documents === null) return <EmptyState title={errorMessage} action={<RetryButton />} />;
  if (documents === null) return <SkeletonBlock height={360} />;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Archivo oficial</p>
          <h1>Documentos</h1>
        </div>
        <Link className="primary-link" to="/documentos/nuevo">
          <Plus size={16} />
          Nuevo documento
        </Link>
      </div>
      {errorMessage !== null ? <p className="error-message">{errorMessage}</p> : null}
      <section className="panel document-filters">
        <label className="search-field">
          Buscar
          <input value={filters.search} onChange={(event) => setFilter("search", event.target.value)} placeholder="Número o título" />
        </label>
        <label>
          Tipo
          <select value={filters.type} onChange={(event) => setFilter("type", event.target.value)}>
            <option value="">Todos</option>
            {DOCUMENT_DEFINITIONS.map((definition) => (
              <option key={definition.type} value={definition.type}>{definition.label}</option>
            ))}
          </select>
        </label>
        <label>
          Estado
          <select value={filters.status} onChange={(event) => setFilter("status", event.target.value)}>
            <option value="">Todos</option>
            {DOCUMENT_STATUSES.map((status) => (
              <option key={status} value={status}>{statusLabel(status)}</option>
            ))}
          </select>
        </label>
        {canFilterAuthor ? (
          <label>
            Autor
            <select value={filters.authorId} onChange={(event) => setFilter("authorId", event.target.value)}>
              <option value="">Todos</option>
              {authors.map((author) => (
                <option key={author.id} value={author.id}>{author.displayName}</option>
              ))}
            </select>
          </label>
        ) : null}
      </section>
      <section className="panel table-wrap">
        {documents.length === 0 ? (
          <EmptyState
            title="No hay documentos con esos filtros."
            action={<Link className="secondary-link" to="/documentos/nuevo">Crear documento</Link>}
          />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Número</th>
                <th>Tipo</th>
                <th>Título</th>
                <th>Autor</th>
                <th>Estado</th>
                <th>Expediente</th>
                <th>Sujeto</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((document) => (
                <tr key={document.id}>
                  <td><Link className="case-number" to={`/documentos/${document.id}`}>{document.documentNumber}</Link></td>
                  <td><StatusBadge value={document.type} kind="type" /></td>
                  <td>
                    <div className="document-title-cell">
                      <FileText size={16} />
                      <span>{document.title}</span>
                    </div>
                  </td>
                  <td>
                    <div className="document-author-cell">
                      <span>{document.createdBy.displayName}</span>
                      <RoleBadge role={document.authorRole} />
                    </div>
                  </td>
                  <td><StatusBadge value={document.status} /></td>
                  <td>{document.investigation?.caseNumber ?? "Sin expediente"}</td>
                  <td>{document.subject === null || document.subject === undefined ? "Sin sujeto" : `${document.subject.firstName} ${document.subject.lastName}`}</td>
                  <td>{shortDateTime(document.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
