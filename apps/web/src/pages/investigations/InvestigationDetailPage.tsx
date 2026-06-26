import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { FileText, Plus } from "lucide-react";
import { ChatPanel } from "../../components/chat/ChatPanel";
import { DatalinkGraph } from "../../components/datalink/DatalinkGraph";
import { FileUploadPanel } from "../../components/files/FileUploadPanel";
import { IntelMapWorkspace } from "../../components/map/IntelMapWorkspace";
import { NotesPanel } from "../../components/notes/NotesPanel";
import { StatusBadge } from "../../components/StatusBadge";
import { TimelinePanel } from "../../components/timeline/TimelinePanel";
import { EmptyState, RetryButton, RoleBadge, SkeletonBlock } from "../../components/ui";
import { useAuth } from "../../auth/auth-context";
import { apiRequest } from "../../services/api";
import type { AccessLevel, DatalinkGraph as DatalinkGraphData, InvestigationDetail, OfficialDocument, PersonRef, Subject, Warrant } from "../../types/sadoj";
import { ACCESS_LABELS, shortDateTime, TYPE_LABELS } from "../../utils/labels";

const TABS = ["General", "Sujetos", "DataLink", "Mapa Operativo", "Documentos", "Cronología", "Notas", "Archivos", "Chat", "Órdenes"] as const;
type InvestigationTab = (typeof TABS)[number];

export function InvestigationDetailPage(): JSX.Element {
  const { id } = useParams();
  const { accessToken, hasPermission } = useAuth();
  const [investigation, setInvestigation] = useState<InvestigationDetail | null>(null);
  const [activeTab, setActiveTab] = useState<InvestigationTab>("General");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadInvestigation = async (): Promise<void> => {
    if (id === undefined) return;

    const result = await apiRequest<InvestigationDetail>(`/api/investigations/${id}`, {}, accessToken);

    if (result.error) {
      setErrorMessage(result.message);
      return;
    }

    setInvestigation(result.data);
  };

  useEffect(() => {
    void loadInvestigation();
  }, [id, accessToken]);

  if (errorMessage !== null) {
    return (
      <EmptyState
        title={errorMessage}
        action={<button type="button" className="secondary-link" onClick={() => void loadInvestigation()}>Reintentar</button>}
      />
    );
  }
  if (id === undefined) return <EmptyState title="Investigación no encontrada." />;
  if (investigation === null) return <SkeletonBlock height={420} />;

  const visibleTabs = hasPermission("MANAGE_WARRANTS") ? TABS : TABS.filter((tab) => tab !== "Órdenes");

  return (
    <div className="page">
      <header className="detail-header investigation-dossier-header">
        <div>
          <p className="case-number">{investigation.caseNumber}</p>
          <h1>{investigation.title}</h1>
          <div className="badge-row">
            <StatusBadge value={investigation.status} />
            <StatusBadge value={investigation.priority} kind="priority" />
            <StatusBadge value={investigation.type} kind="type" />
          </div>
        </div>
        <div className="actions-row">
          <Link className="secondary-link" to={`/documentos/nuevo?investigationId=${investigation.id}`}>
            <FileText size={16} />
            Nuevo documento
          </Link>
          {hasPermission("MANAGE_WARRANTS") ? (
            <Link className="primary-link" to={`/ordenes/nueva?investigationId=${investigation.id}`}>
              <Plus size={16} />
              Nueva orden
            </Link>
          ) : null}
        </div>
      </header>
      <section className="investigation-stat-strip">
        <span><strong>{investigation._count.subjects ?? investigation.subjects.length}</strong>Sujetos</span>
        <span><strong>{investigation._count.documents ?? 0}</strong>Documentos</span>
        <span><strong>{investigation._count.warrants}</strong>Órdenes</span>
        <span><strong>{investigation.participants.length}</strong>Participantes</span>
      </section>
      <div className="tabs-shell">
        <div className="tab-list">
          {visibleTabs.map((tab) => (
            <button key={tab} type="button" className={tab === activeTab ? "active" : ""} onClick={() => setActiveTab(tab)}>
              {tab}
            </button>
          ))}
        </div>
        {activeTab === "General" ? <GeneralTab investigation={investigation} onChanged={() => void loadInvestigation()} /> : null}
        {activeTab === "Sujetos" ? <SubjectsTab investigation={investigation} onChanged={() => void loadInvestigation()} /> : null}
        {activeTab === "DataLink" ? <InvestigationDatalinkTab investigationId={investigation.id} /> : null}
        {activeTab === "Mapa Operativo" ? <InvestigationMapTab investigationId={investigation.id} /> : null}
        {activeTab === "Documentos" ? <InvestigationDocumentsTab investigationId={investigation.id} /> : null}
        {activeTab === "Cronología" ? <TimelinePanel endpoint={`/api/investigations/${investigation.id}/timeline`} /> : null}
        {activeTab === "Notas" ? <NotesPanel target="investigations" targetId={investigation.id} /> : null}
        {activeTab === "Archivos" ? <FileUploadPanel targetType="investigation" targetId={investigation.id} /> : null}
        {activeTab === "Chat" ? (
          investigation.chatRoom === null ? <EmptyState title="Esta investigación no tiene sala de chat." /> : <ChatPanel roomId={investigation.chatRoom.id} investigationId={investigation.id} />
        ) : null}
        {activeTab === "Órdenes" ? <InvestigationWarrantsTab investigationId={investigation.id} /> : null}
      </div>
    </div>
  );
}

function GeneralTab({ investigation, onChanged }: { investigation: InvestigationDetail; onChanged: () => void }): JSX.Element {
  const { accessToken, hasPermission } = useAuth();
  const [users, setUsers] = useState<PersonRef[]>([]);
  const [userId, setUserId] = useState("");
  const [accessLevel, setAccessLevel] = useState<AccessLevel>("READ");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!hasPermission("SHARE_INVESTIGATION")) return;

    const loadUsers = async (): Promise<void> => {
      const result = await apiRequest<PersonRef[]>("/api/users/mentions?limit=100", {}, accessToken);

      if (!result.error) {
        setUsers(result.data);
      }
    };

    void loadUsers();
  }, [accessToken]);

  const handleShare = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const result = await apiRequest(
      `/api/investigations/${investigation.id}/share`,
      { method: "POST", body: JSON.stringify({ userId, accessLevel }) },
      accessToken
    );

    setMessage(result.error ? result.message : "Investigación compartida correctamente.");
    if (!result.error) onChanged();
  };

  return (
    <section className="grid-two">
      <article className="panel">
        <h2>Información general</h2>
        <dl className="details-grid">
          <div><dt>Descripción</dt><dd>{investigation.description}</dd></div>
          <div><dt>Tipo</dt><dd>{TYPE_LABELS[investigation.type] ?? investigation.type}</dd></div>
          <div><dt>Base legal</dt><dd>{investigation.legalBasis ?? "Sin base legal registrada"}</dd></div>
          <div><dt>Apertura</dt><dd>{shortDateTime(investigation.startDate)}</dd></div>
          <div><dt>Cierre</dt><dd>{shortDateTime(investigation.closeDate)}</dd></div>
        </dl>
      </article>
      <article className="panel">
        <h2>Equipo investigador</h2>
        <div className="compact-list">
          {investigation.participants.map((participant) => (
            <div className="compact-row" key={participant.id}>
              <div className="person-cell">
                <div className="avatar small">{participant.user.displayName.slice(0, 1)}</div>
                <div>
                  <strong>{participant.user.displayName}</strong>
                  <span className="muted">{ACCESS_LABELS[participant.accessLevel]}</span>
                </div>
              </div>
              <RoleBadge role={participant.user.role} />
            </div>
          ))}
        </div>
        {hasPermission("SHARE_INVESTIGATION") ? (
          <form className="share-form" onSubmit={(event) => void handleShare(event)}>
            <label>
              Fiscal
              <select value={userId} onChange={(event) => setUserId(event.target.value)}>
                <option value="">Selecciona un fiscal</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>{user.displayName}</option>
                ))}
              </select>
            </label>
            <label>
              Acceso
              <select value={accessLevel} onChange={(event) => setAccessLevel(event.target.value as AccessLevel)}>
                <option value="READ">Lectura</option>
                <option value="WRITE">Escritura</option>
                <option value="ADMIN">Admin</option>
              </select>
            </label>
            <button type="submit" className="primary-button" disabled={userId.length === 0}>Compartir investigación</button>
            {message !== null ? <p className="muted">{message}</p> : null}
          </form>
        ) : null}
      </article>
    </section>
  );
}

function SubjectsTab({ investigation, onChanged }: { investigation: InvestigationDetail; onChanged: () => void }): JSX.Element {
  const { accessToken, hasPermission } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectId, setSubjectId] = useState("");
  const [role, setRole] = useState("Imputado");
  const [message, setMessage] = useState<string | null>(null);
  const [unlinkTarget, setUnlinkTarget] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const loadSubjects = async (): Promise<void> => {
      const result = await apiRequest<Subject[]>("/api/subjects?limit=100", {}, accessToken);

      if (!result.error) setSubjects(result.data);
    };

    void loadSubjects();
  }, [accessToken]);

  const handleLink = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const result = await apiRequest(
      `/api/investigations/${investigation.id}/subjects`,
      { method: "POST", body: JSON.stringify({ subjectId, role }) },
      accessToken
    );

    setMessage(result.error ? result.message : "Sujeto vinculado correctamente.");
    if (!result.error) onChanged();
  };

  const handleConfirmUnlink = async (): Promise<void> => {
    if (unlinkTarget === null) return;

    const result = await apiRequest<{ unlinked: boolean }>(
      `/api/investigations/${investigation.id}/subjects/${unlinkTarget.id}`,
      { method: "DELETE" },
      accessToken
    );

    setMessage(result.error ? result.message : "Sujeto desvinculado de la investigación.");
    setUnlinkTarget(null);
    if (!result.error) onChanged();
  };

  return (
    <section className="stack">
      {hasPermission("EDIT_INVESTIGATION") ? (
        <form className="panel form-grid" onSubmit={(event) => void handleLink(event)}>
          <label>
            Sujeto
            <select value={subjectId} onChange={(event) => setSubjectId(event.target.value)}>
              <option value="">Selecciona un sujeto</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>{subject.firstName} {subject.lastName}</option>
              ))}
            </select>
          </label>
          <label>
            Rol en la investigación
            <input value={role} onChange={(event) => setRole(event.target.value)} />
          </label>
          <button type="submit" className="primary-button span-full" disabled={subjectId.length === 0}>Vincular sujeto</button>
          {message !== null ? <p className="muted span-full">{message}</p> : null}
        </form>
      ) : null}
      <section className="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>Sujeto</th>
              <th>Alias</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Peligro</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {investigation.subjects.map((item) => (
              <tr key={item.id}>
                <td>
                  <Link className="person-cell" to={`/sujetos/${item.subject.id}`}>
                    <div className="avatar small">{item.subject.firstName.slice(0, 1)}</div>
                    <span>{item.subject.firstName} {item.subject.lastName}</span>
                  </Link>
                </td>
                <td>{item.subject.alias ?? "Sin alias"}</td>
                <td>{item.role}</td>
                <td><StatusBadge value={item.subject.status} /></td>
                <td><StatusBadge value={item.subject.dangerLevel} kind="danger" /></td>
                <td>
                  <div className="toolbar">
                    <Link className="secondary-link compact-button" to={`/sujetos/${item.subject.id}`}>Ver ficha</Link>
                    {hasPermission("EDIT_INVESTIGATION") ? (
                      <button
                        type="button"
                        className="danger-button compact-button"
                        onClick={() => setUnlinkTarget({ id: item.subject.id, name: `${item.subject.firstName} ${item.subject.lastName}` })}
                      >
                        Desvincular
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      {unlinkTarget !== null ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <section className="modal-panel">
            <h2>¿Desvincular sujeto?</h2>
            <p>Se desvinculará a <strong>{unlinkTarget.name}</strong> de esta investigación. Esta acción no elimina la ficha del sujeto.</p>
            <div className="actions-row">
              <button type="button" className="secondary-link" onClick={() => setUnlinkTarget(null)}>Cancelar</button>
              <button type="button" className="danger-button" onClick={() => void handleConfirmUnlink()}>Desvincular</button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}

function InvestigationWarrantsTab({ investigationId }: { investigationId: string }): JSX.Element {
  const { accessToken } = useAuth();
  const [warrants, setWarrants] = useState<Warrant[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadWarrants = async (): Promise<void> => {
      const result = await apiRequest<Warrant[]>(`/api/warrants?investigationId=${investigationId}&limit=100`, {}, accessToken);

      if (result.error) {
        setErrorMessage(result.message);
        return;
      }

      setErrorMessage(null);
      setWarrants(result.data);
    };

    void loadWarrants();
  }, [accessToken, investigationId]);

  if (errorMessage !== null) return <EmptyState title={errorMessage} action={<RetryButton />} />;
  if (warrants === null) return <SkeletonBlock height={220} />;

  return (
    <section className="panel table-wrap">
      <div className="actions-row">
        <h2>Órdenes judiciales</h2>
        <Link className="primary-link" to={`/ordenes/nueva?investigationId=${investigationId}`}>Nueva orden</Link>
      </div>
      <table>
        <thead>
          <tr>
            <th>Número</th>
            <th>Tipo</th>
            <th>Estado</th>
            <th>Título</th>
            <th>Solicitada por</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          {warrants.map((warrant) => (
            <tr key={warrant.id}>
              <td><Link className="case-number" to={`/ordenes/${warrant.id}`}>{warrant.warrantNumber}</Link></td>
              <td><StatusBadge value={warrant.type} kind="type" /></td>
              <td><StatusBadge value={warrant.status} /></td>
              <td>{warrant.title}</td>
              <td>{warrant.requestedBy?.displayName ?? "Fiscalía"}</td>
              <td>{shortDateTime(warrant.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function InvestigationMapTab({ investigationId }: { investigationId: string }): JSX.Element {
  return <IntelMapWorkspace investigationId={investigationId} title="Mapa operativo" />;
}

function InvestigationDocumentsTab({ investigationId }: { investigationId: string }): JSX.Element {
  const { accessToken } = useAuth();
  const [documents, setDocuments] = useState<OfficialDocument[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadDocuments = async (): Promise<void> => {
      const result = await apiRequest<OfficialDocument[]>(`/api/documents?investigationId=${investigationId}&limit=100`, {}, accessToken);

      if (result.error) {
        setErrorMessage(result.message);
        return;
      }

      setDocuments(result.data);
    };

    void loadDocuments();
  }, [accessToken, investigationId]);

  if (errorMessage !== null) return <EmptyState title={errorMessage} action={<RetryButton />} />;
  if (documents === null) return <SkeletonBlock height={260} />;

  return (
    <section className="panel table-wrap">
      <div className="actions-row">
        <h2>Documentos del expediente</h2>
        <Link className="primary-link" to={`/documentos/nuevo?investigationId=${investigationId}`}>
          <Plus size={16} />
          Nuevo documento
        </Link>
      </div>
      {documents.length === 0 ? (
        <EmptyState title="Aún no hay documentos vinculados a esta investigación." action={<Link className="secondary-link" to={`/documentos/nuevo?investigationId=${investigationId}`}>Crear documento</Link>} />
      ) : (
        <table>
          <thead>
            <tr>
              <th>Número</th>
              <th>Tipo</th>
              <th>Título</th>
              <th>Autor</th>
              <th>Estado</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((document) => (
              <tr key={document.id}>
                <td><Link className="case-number" to={`/documentos/${document.id}`}>{document.documentNumber}</Link></td>
                <td><StatusBadge value={document.type} kind="type" /></td>
                <td>{document.title}</td>
                <td>{document.createdBy.displayName}</td>
                <td><StatusBadge value={document.status} /></td>
                <td>{shortDateTime(document.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function InvestigationDatalinkTab({ investigationId }: { investigationId: string }): JSX.Element {
  const { accessToken } = useAuth();
  const [graph, setGraph] = useState<DatalinkGraphData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadGraph = async (): Promise<void> => {
      const result = await apiRequest<DatalinkGraphData>(`/api/investigations/${investigationId}/datalink`, {}, accessToken);

      if (result.error) {
        setErrorMessage(result.message);
        return;
      }

      setGraph(result.data);
    };

    void loadGraph();
  }, [accessToken, investigationId]);

  if (errorMessage !== null) return <EmptyState title={errorMessage} action={<RetryButton />} />;
  if (graph === null) return <SkeletonBlock height={520} />;

  return <DatalinkGraph graph={graph} />;
}
