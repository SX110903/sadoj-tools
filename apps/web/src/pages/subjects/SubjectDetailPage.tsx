import { useEffect, useState } from "react";
import { FileText, Network, Pencil } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../auth/auth-context";
import { ImageUrlInput } from "../../components/common/ImageUrlInput";
import { FileUploadPanel } from "../../components/files/FileUploadPanel";
import { NotesPanel } from "../../components/notes/NotesPanel";
import { StatusBadge } from "../../components/StatusBadge";
import { TimelinePanel } from "../../components/timeline/TimelinePanel";
import { EmptyState, RetryButton, SkeletonBlock } from "../../components/ui";
import { apiRequest } from "../../services/api";
import type { Property, Subject, SubjectDetail, Warrant } from "../../types/sadoj";
import { gtaToPreviewPercent } from "../../utils/mapCoords";
import { shortDateTime, STATUS_LABELS, TYPE_LABELS } from "../../utils/labels";

const TABS = ["Información", "Vehículos", "Propiedades", "Relaciones", "Zonas", "Notas", "Investigaciones", "Cronología"] as const;
type SubjectTab = (typeof TABS)[number];

interface VehicleOption {
  id: string;
  plate: string;
  brand: string;
  model: string;
  color: string;
  year: number | null;
}

interface PropertyOption {
  id: string;
  address: string;
  type: string;
  zone: string | null;
  notes: string | null;
  gtaX: number | null;
  gtaY: number | null;
}

interface ZoneOption {
  id: string;
  name: string;
  district: string;
}

export function SubjectDetailPage(): JSX.Element {
  const { id } = useParams();
  const { accessToken, hasPermission } = useAuth();
  const [subject, setSubject] = useState<SubjectDetail | null>(null);
  const [activeTab, setActiveTab] = useState<SubjectTab>("Información");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");

  const loadSubject = async (): Promise<void> => {
    if (id === undefined) return;

    const result = await apiRequest<SubjectDetail>(`/api/subjects/${id}`, {}, accessToken);

    if (result.error) {
      setErrorMessage(result.message);
      return;
    }

    setSubject(result.data);
  };

  useEffect(() => {
    void loadSubject();
  }, [id, accessToken]);

  if (errorMessage !== null) return <EmptyState title={errorMessage} action={<RetryButton onRetry={() => void loadSubject()} />} />;
  if (id === undefined) return <EmptyState title="Sujeto no encontrado." />;
  if (subject === null) return <SkeletonBlock height={420} />;
  const canManageSubject = hasPermission("MANAGE_SUBJECTS");
  const subjectName = `${subject.firstName} ${subject.lastName}`;
  const investigationCount = subject._count?.investigations ?? subject.investigations.length;
  const propertyCount = subject._count?.properties ?? subject.properties.length;
  const documentCount = subject._count?.documents ?? 0;

  const openPhotoDialog = (): void => {
    setPhotoUrl(subject.photo ?? "");
    setPhotoDialogOpen(true);
  };

  const handlePhotoSubmit = async (): Promise<void> => {
    const result = await apiRequest<SubjectDetail>(
      `/api/subjects/${subject.id}/photo`,
      { method: "PATCH", body: JSON.stringify({ photoUrl }) },
      accessToken
    );

    setMessage(result.error ? result.message : "Foto actualizada correctamente.");
    if (!result.error) {
      setPhotoDialogOpen(false);
      await loadSubject();
    }
  };

  return (
    <div className="page">
      <header className="detail-header subject-header">
        <button type="button" className="editable-photo" disabled={!canManageSubject} onClick={openPhotoDialog} aria-label="Cambiar foto">
          {subject.photo !== null ? <img className="avatar-preview" src={subject.photo} alt={subjectName} /> : <div className="avatar large">{subject.firstName.slice(0, 1)}</div>}
          {canManageSubject ? <span><Pencil size={16} /> Cambiar foto</span> : null}
        </button>
        <div className="subject-header-main">
          <div>
            <p className="eyebrow">Ficha de sujeto</p>
            <h1>{subjectName}</h1>
            {subject.alias !== null ? <p className="subject-alias">"{subject.alias}"</p> : null}
            <div className="badge-row">
              <StatusBadge value={subject.status} />
              <StatusBadge value={subject.dangerLevel} kind="danger" />
              {subject.criminalOrganization !== null && subject.criminalOrganization !== undefined ? (
                <Link className="badge badge-plain" to={`/organizaciones/${subject.criminalOrganization.id}`}>
                  {subject.criminalOrganization.alias ?? subject.criminalOrganization.name}
                </Link>
              ) : null}
            </div>
            {message !== null ? <p className="hint">{message}</p> : null}
          </div>
          <div className="subject-header-actions">
            <Link className="secondary-link compact-button" to={`/documentos/nuevo?subjectId=${subject.id}`}>
              <FileText size={16} />
              Generar documento
            </Link>
            {investigationCount > 0 ? (
              <Link className="secondary-link compact-button" to={`/datalink?subjectId=${subject.id}`}>
                <Network size={16} />
                Ver en DataLink
              </Link>
            ) : null}
          </div>
          <div className="subject-metric-row" aria-label="Resumen del sujeto">
            <span><strong>{investigationCount}</strong> investigaciones</span>
            <span><strong>{propertyCount}</strong> propiedades</span>
            <span><strong>{documentCount}</strong> documentos</span>
          </div>
        </div>
      </header>
      <div className="tabs-shell">
        <div className="tab-list">
          {TABS.map((tab) => (
            <button key={tab} type="button" className={tab === activeTab ? "active" : ""} onClick={() => setActiveTab(tab)}>
              {tab}
            </button>
          ))}
        </div>
        {activeTab === "Información" ? <InformationTab subject={subject} /> : null}
        {activeTab === "Vehículos" ? <VehiclesTab subject={subject} onChanged={() => void loadSubject()} /> : null}
        {activeTab === "Propiedades" ? <PropertiesTab subject={subject} onChanged={() => void loadSubject()} /> : null}
        {activeTab === "Relaciones" ? <RelationshipsTab subject={subject} onChanged={() => void loadSubject()} /> : null}
        {activeTab === "Zonas" ? <ZonesTab subject={subject} onChanged={() => void loadSubject()} /> : null}
        {activeTab === "Notas" ? <NotesPanel target="subjects" targetId={subject.id} /> : null}
        {activeTab === "Investigaciones" ? <InvestigationsTab subject={subject} /> : null}
        {activeTab === "Cronología" ? <TimelinePanel endpoint={`/api/subjects/${subject.id}/timeline`} /> : null}
      </div>
      <FileUploadPanel targetType="subject" targetId={subject.id} initialFiles={subject.files} />
      {photoDialogOpen ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <section className="modal-panel image-url-dialog">
            <div className="actions-row">
              <div>
                <p className="eyebrow">Foto del sujeto</p>
                <h2>Modificar foto</h2>
              </div>
              <button type="button" className="secondary-link compact-button" onClick={() => setPhotoDialogOpen(false)}>Cerrar</button>
            </div>
            <ImageUrlInput value={photoUrl} onChange={setPhotoUrl} shape="circle" label="URL de la foto" />
            <div className="actions-row">
              <button type="button" className="secondary-link" onClick={() => setPhotoDialogOpen(false)}>Cancelar</button>
              <button type="button" className="primary-button" onClick={() => void handlePhotoSubmit()}>Guardar foto</button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function InformationTab({ subject }: { subject: SubjectDetail }): JSX.Element {
  return (
    <section className="panel">
      <h2>Información</h2>
      <dl className="details-grid">
        <div><dt>Fecha de nacimiento</dt><dd>{shortDateTime(subject.dateOfBirth)}</dd></div>
        <div><dt>Nacionalidad</dt><dd>{subject.nationality ?? "No consta"}</dd></div>
        <div><dt>Ocupación</dt><dd>{subject.occupation ?? "No consta"}</dd></div>
        <div><dt>Teléfono</dt><dd>{subject.phone ?? "No consta"}</dd></div>
        <div><dt>Dirección</dt><dd>{subject.address ?? "No consta"}</dd></div>
      </dl>
      {subject.isOrganized ? (
        <div className="legal-box">
          <strong>Organización Criminal</strong>
          <span>{subject.criminalOrganization?.alias ?? subject.criminalOrganization?.name ?? subject.organization ?? "Nombre no registrado"}</span>
        </div>
      ) : null}
    </section>
  );
}

function VehiclesTab({ subject, onChanged }: { subject: SubjectDetail; onChanged: () => void }): JSX.Element {
  const { accessToken, hasPermission } = useAuth();
  const [showLinkVehicle, setShowLinkVehicle] = useState(false);
  const [plate, setPlate] = useState("");
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [vehicleId, setVehicleId] = useState("");
  const [relation, setRelation] = useState("propietario");
  const [newVehicle, setNewVehicle] = useState({ plate: "", brand: "", model: "", color: "", year: "" });
  const [message, setMessage] = useState<string | null>(null);
  const canManage = hasPermission("MANAGE_SUBJECTS");

  const searchVehicles = async (): Promise<void> => {
    const result = await apiRequest<VehicleOption[]>(`/api/vehicles?plate=${encodeURIComponent(plate)}&limit=20`, {}, accessToken);

    if (!result.error) setVehicles(result.data);
  };

  const createVehicle = async (): Promise<void> => {
    const body = {
      plate: newVehicle.plate,
      brand: newVehicle.brand,
      model: newVehicle.model,
      color: newVehicle.color,
      year: newVehicle.year.length > 0 ? Number(newVehicle.year) : undefined
    };
    const result = await apiRequest<VehicleOption>("/api/vehicles", { method: "POST", body: JSON.stringify(body) }, accessToken);

    if (result.error) {
      setMessage(result.message);
      return;
    }

    setVehicleId(result.data.id);
    setVehicles((current) => [result.data, ...current]);
    setMessage("Vehículo creado correctamente.");
  };

  const linkVehicle = async (): Promise<void> => {
    const result = await apiRequest(`/api/subjects/${subject.id}/vehicles`, { method: "POST", body: JSON.stringify({ vehicleId, relation }) }, accessToken);
    setMessage(result.error ? result.message : "Vehículo vinculado correctamente.");
    if (!result.error) {
      setShowLinkVehicle(false);
      onChanged();
    }
  };

  const unlinkVehicle = async (targetVehicleId: string): Promise<void> => {
    if (!window.confirm("¿Desvincular este vehículo del sujeto?")) return;
    const result = await apiRequest(`/api/subjects/${subject.id}/vehicles/${targetVehicleId}`, { method: "DELETE" }, accessToken);
    setMessage(result.error ? result.message : "Vehículo desvinculado correctamente.");
    if (!result.error) onChanged();
  };

  return (
    <section className="stack">
      <div className="actions-row">
        <h2>Vehículos</h2>
        {canManage ? <button type="button" className="primary-button" onClick={() => setShowLinkVehicle(true)}>Vincular vehículo</button> : null}
      </div>
      {message !== null ? <p className="muted">{message}</p> : null}
      <div className="card-grid">
        {subject.vehicles.length === 0 ? <p className="muted">No hay vehículos vinculados.</p> : null}
        {subject.vehicles.map((item) => (
          <article className="panel" key={item.id}>
            <p className="case-number">{item.vehicle.plate}</p>
            <h2>{item.vehicle.brand} {item.vehicle.model}</h2>
            <p>{item.vehicle.color} · {item.vehicle.year ?? "Año no registrado"}</p>
            <div className="actions-row">
              <span className="badge badge-plain">{item.relation}</span>
              {canManage ? <button type="button" className="danger-button compact-button" onClick={() => void unlinkVehicle(item.vehicle.id)}>Desvincular</button> : null}
            </div>
          </article>
        ))}
      </div>
      {showLinkVehicle ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <section className="modal-panel">
            <h2>Vincular vehículo</h2>
            <div className="form-grid">
              <label>Buscar por placa<input value={plate} onChange={(event) => setPlate(event.target.value)} /></label>
              <button type="button" className="secondary-link" onClick={() => void searchVehicles()}>Buscar</button>
              <label className="span-full">Vehículo<select value={vehicleId} onChange={(event) => setVehicleId(event.target.value)}>
                <option value="">Selecciona un vehículo</option>
                {vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.plate} · {vehicle.brand} {vehicle.model}</option>)}
              </select></label>
              <label>Relación<select value={relation} onChange={(event) => setRelation(event.target.value)}>
                <option value="propietario">Propietario</option>
                <option value="conductor habitual">Conductor habitual</option>
                <option value="prestado">Prestado</option>
                <option value="asociado">Asociado</option>
              </select></label>
            </div>
            <h3>Crear nuevo vehículo</h3>
            <div className="form-grid">
              <input placeholder="Placa" value={newVehicle.plate} onChange={(event) => setNewVehicle((current) => ({ ...current, plate: event.target.value }))} />
              <input placeholder="Marca" value={newVehicle.brand} onChange={(event) => setNewVehicle((current) => ({ ...current, brand: event.target.value }))} />
              <input placeholder="Modelo" value={newVehicle.model} onChange={(event) => setNewVehicle((current) => ({ ...current, model: event.target.value }))} />
              <input placeholder="Color" value={newVehicle.color} onChange={(event) => setNewVehicle((current) => ({ ...current, color: event.target.value }))} />
              <input placeholder="Año" value={newVehicle.year} onChange={(event) => setNewVehicle((current) => ({ ...current, year: event.target.value }))} />
              <button type="button" className="secondary-link" onClick={() => void createVehicle()}>Crear vehículo</button>
            </div>
            <div className="actions-row">
              <button type="button" className="secondary-link" onClick={() => setShowLinkVehicle(false)}>Cancelar</button>
              <button type="button" className="primary-button" disabled={vehicleId.length === 0} onClick={() => void linkVehicle()}>Vincular</button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}

function PropertiesTab({ subject, onChanged }: { subject: SubjectDetail; onChanged: () => void }): JSX.Element {
  const { accessToken, hasPermission } = useAuth();
  const [showLinkProperty, setShowLinkProperty] = useState(false);
  const [query, setQuery] = useState("");
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [propertyId, setPropertyId] = useState("");
  const [relation, setRelation] = useState("propietario");
  const [newProperty, setNewProperty] = useState({ address: "", type: "RESIDENCE", zone: "", notes: "", gtaX: "", gtaY: "" });
  const [showPropertyPreview, setShowPropertyPreview] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<{ property: Property; history: Warrant[] | null } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const canManage = hasPermission("MANAGE_SUBJECTS");

  const searchProperties = async (): Promise<void> => {
    const result = await apiRequest<PropertyOption[]>(`/api/properties?q=${encodeURIComponent(query)}&limit=20`, {}, accessToken);

    if (!result.error) setProperties(result.data);
  };

  const createProperty = async (): Promise<void> => {
    const body = {
      address: newProperty.address,
      type: newProperty.type,
      zone: newProperty.zone,
      notes: newProperty.notes,
      gtaX: newProperty.gtaX.length > 0 ? Number(newProperty.gtaX) : undefined,
      gtaY: newProperty.gtaY.length > 0 ? Number(newProperty.gtaY) : undefined
    };
    const result = await apiRequest<PropertyOption>("/api/properties", { method: "POST", body: JSON.stringify(body) }, accessToken);

    if (result.error) {
      setMessage(result.message);
      return;
    }

    setPropertyId(result.data.id);
    setProperties((current) => [result.data, ...current]);
    setMessage("Propiedad creada correctamente.");
  };

  const linkProperty = async (): Promise<void> => {
    const result = await apiRequest(`/api/subjects/${subject.id}/properties`, { method: "POST", body: JSON.stringify({ propertyId, relation }) }, accessToken);
    setMessage(result.error ? result.message : "Propiedad vinculada correctamente.");
    if (!result.error) {
      setShowLinkProperty(false);
      onChanged();
    }
  };

  const unlinkProperty = async (targetPropertyId: string): Promise<void> => {
    if (!window.confirm("¿Desvincular esta propiedad del sujeto?")) return;
    const result = await apiRequest(`/api/subjects/${subject.id}/properties/${targetPropertyId}`, { method: "DELETE" }, accessToken);
    setMessage(result.error ? result.message : "Propiedad desvinculada correctamente.");
    if (!result.error) onChanged();
  };

  const openPropertyHistory = async (property: Property): Promise<void> => {
    setHistoryTarget({ property, history: null });
    const result = await apiRequest<Warrant[]>(`/api/properties/${property.id}/history`, {}, accessToken);

    if (result.error) {
      setMessage(result.message);
      return;
    }

    setHistoryTarget({ property, history: result.data });
  };

  return (
    <section className="stack">
      <div className="actions-row">
        <h2>Propiedades</h2>
        {canManage ? <button type="button" className="primary-button" onClick={() => setShowLinkProperty(true)}>Vincular propiedad</button> : null}
      </div>
      {message !== null ? <p className="muted">{message}</p> : null}
      <div className="card-grid">
        {subject.properties.length === 0 ? <p className="muted">No hay propiedades vinculadas.</p> : null}
        {subject.properties.map((item) => (
          <article className="panel" key={item.id}>
            <h2>{item.property.address}</h2>
            <p>{TYPE_LABELS[item.property.type] ?? item.property.type} · {item.property.zone ?? "Zona no registrada"}</p>
            {item.property.gtaX !== null && item.property.gtaY !== null ? (
              <p className="muted">Coordenadas GTA: {item.property.gtaX.toFixed(2)}, {item.property.gtaY.toFixed(2)}</p>
            ) : null}
            <div className="actions-row">
              <span className="badge badge-plain">{item.relation}</span>
              <div className="toolbar">
                <button type="button" className="secondary-link compact-button" onClick={() => void openPropertyHistory(item.property)}>Ver historial</button>
                {canManage ? <button type="button" className="danger-button compact-button" onClick={() => void unlinkProperty(item.property.id)}>Desvincular</button> : null}
              </div>
            </div>
          </article>
        ))}
      </div>
      {showLinkProperty ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <section className="modal-panel">
            <h2>Vincular propiedad</h2>
            <div className="form-grid">
              <label>Buscar por dirección<input value={query} onChange={(event) => setQuery(event.target.value)} /></label>
              <button type="button" className="secondary-link" onClick={() => void searchProperties()}>Buscar</button>
              <label className="span-full">Propiedad<select value={propertyId} onChange={(event) => setPropertyId(event.target.value)}>
                <option value="">Selecciona una propiedad</option>
                {properties.map((property) => <option key={property.id} value={property.id}>{property.address}</option>)}
              </select></label>
              <label>Relación<select value={relation} onChange={(event) => setRelation(event.target.value)}>
                <option value="propietario">Propietario</option>
                <option value="inquilino">Inquilino</option>
                <option value="asociado">Asociado</option>
                <option value="operativo">Operativo</option>
              </select></label>
            </div>
            <h3>Crear nueva propiedad</h3>
            <div className="form-grid">
              <input placeholder="Dirección" value={newProperty.address} onChange={(event) => setNewProperty((current) => ({ ...current, address: event.target.value }))} />
              <select value={newProperty.type} onChange={(event) => setNewProperty((current) => ({ ...current, type: event.target.value }))}>
                <option value="RESIDENCE">Residencia</option>
                <option value="BUSINESS">Negocio</option>
                <option value="WAREHOUSE">Almacén</option>
                <option value="HIDEOUT">Escondite</option>
                <option value="UNKNOWN">Desconocido</option>
              </select>
              <input placeholder="Zona" value={newProperty.zone} onChange={(event) => setNewProperty((current) => ({ ...current, zone: event.target.value }))} />
              <input placeholder="Notas" value={newProperty.notes} onChange={(event) => setNewProperty((current) => ({ ...current, notes: event.target.value }))} />
              <label>
                Coordenada X
                <input placeholder="ej: 245.30" value={newProperty.gtaX} onChange={(event) => setNewProperty((current) => ({ ...current, gtaX: event.target.value }))} />
              </label>
              <label>
                Coordenada Y
                <input placeholder="-1823.10" value={newProperty.gtaY} onChange={(event) => setNewProperty((current) => ({ ...current, gtaY: event.target.value }))} />
              </label>
              <button type="button" className="secondary-link" disabled={newProperty.gtaX.length === 0 || newProperty.gtaY.length === 0} onClick={() => setShowPropertyPreview(true)}>Vista previa del punto</button>
              <button type="button" className="secondary-link" onClick={() => void createProperty()}>Crear propiedad</button>
            </div>
            <div className="actions-row">
              <button type="button" className="secondary-link" onClick={() => setShowLinkProperty(false)}>Cancelar</button>
              <button type="button" className="primary-button" disabled={propertyId.length === 0} onClick={() => void linkProperty()}>Vincular</button>
            </div>
          </section>
        </div>
      ) : null}
      {showPropertyPreview ? (
        <PropertyPreviewModal
          gtaX={Number(newProperty.gtaX)}
          gtaY={Number(newProperty.gtaY)}
          onClose={() => setShowPropertyPreview(false)}
        />
      ) : null}
      {historyTarget !== null ? (
        <PropertyHistorySheet target={historyTarget} onClose={() => setHistoryTarget(null)} />
      ) : null}
    </section>
  );
}

function PropertyPreviewModal({ gtaX, gtaY, onClose }: { gtaX: number; gtaY: number; onClose: () => void }): JSX.Element {
  const isValid = Number.isFinite(gtaX) && Number.isFinite(gtaY);
  const { top, left } = isValid ? gtaToPreviewPercent(gtaX, gtaY) : { top: "0%", left: "0%" };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <section className="modal-panel">
        <div className="actions-row">
          <h2>Vista previa del punto</h2>
          <button type="button" className="secondary-link compact-button" onClick={onClose}>Cerrar</button>
        </div>
        {isValid ? (
          <div className="mini-map-preview">
            <span className="mini-map-point" style={{ top, left }} />
          </div>
        ) : (
          <p className="error-message">Las coordenadas introducidas no son válidas.</p>
        )}
      </section>
    </div>
  );
}

function PropertyHistorySheet({
  target,
  onClose
}: {
  target: { property: Property; history: Warrant[] | null };
  onClose: () => void;
}): JSX.Element {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <section className="modal-panel property-history-sheet">
        <div className="actions-row">
          <div>
            <p className="eyebrow">Historial</p>
            <h2>{target.property.address}</h2>
          </div>
          <button type="button" className="secondary-link compact-button" onClick={onClose}>Cerrar</button>
        </div>
        {target.history === null ? <SkeletonBlock height={160} /> : <PropertyHistoryTimeline history={target.history} />}
      </section>
    </div>
  );
}

function PropertyHistoryTimeline({ history }: { history: Warrant[] }): JSX.Element {
  if (history.length === 0) return <p className="muted">No hay operaciones registradas en esta propiedad.</p>;

  return (
    <div className="history-timeline">
      {history.map((warrant) => (
        <article className="history-entry" key={warrant.id}>
          <div>
            <strong>{shortDateTime(warrant.executedAt ?? warrant.createdAt)}</strong>
            <Link className="case-number" to={`/ordenes/${warrant.id}`}>{warrant.warrantNumber}</Link>
          </div>
          <p>Investigación: {warrant.investigation?.caseNumber ?? "Sin expediente"} {warrant.investigation?.title ?? ""}</p>
          <p>Tipo: {TYPE_LABELS[warrant.type] ?? warrant.type} · Fiscal: {warrant.requestedBy?.displayName ?? "Fiscalía"}</p>
          {warrant.warrantReport !== null && warrant.warrantReport !== undefined ? (
            <>
              <StatusBadge value={warrant.warrantReport.result} />
              <p>Hallazgos: {warrant.warrantReport.findings}</p>
              {warrant.warrantReport.evidence !== null ? <p>Evidencia incautada: {warrant.warrantReport.evidence}</p> : null}
              {warrant.warrantReport.persons !== null ? <p>Personas presentes: {warrant.warrantReport.persons}</p> : null}
            </>
          ) : (
            <p className="muted">Sin informe registrado.</p>
          )}
          <Link className="secondary-link compact-button" to={`/ordenes/${warrant.id}`}>Ver orden completa</Link>
        </article>
      ))}
      <p className="muted">{history.length} operaciones registradas en esta propiedad.</p>
    </div>
  );
}

function RelationshipsTab({ subject, onChanged }: { subject: SubjectDetail; onChanged: () => void }): JSX.Element {
  const { accessToken, hasPermission } = useAuth();
  const [showAddRelationship, setShowAddRelationship] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [search, setSearch] = useState("");
  const [toSubjectId, setToSubjectId] = useState("");
  const [type, setType] = useState("ASSOCIATE");
  const [description, setDescription] = useState("");
  const [strength, setStrength] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const canManage = hasPermission("MANAGE_SUBJECTS");

  const searchSubjects = async (): Promise<void> => {
    const result = await apiRequest<Subject[]>(`/api/subjects?q=${encodeURIComponent(search)}&limit=20`, {}, accessToken);

    if (!result.error) setSubjects(result.data.filter((item) => item.id !== subject.id));
  };

  const addRelationship = async (): Promise<void> => {
    const result = await apiRequest(
      `/api/subjects/${subject.id}/relationships`,
      { method: "POST", body: JSON.stringify({ toSubjectId, type, description, strength }) },
      accessToken
    );
    setMessage(result.error ? result.message : "Relación añadida correctamente.");
    if (!result.error) {
      setShowAddRelationship(false);
      onChanged();
    }
  };

  const removeRelationship = async (relationshipId: string): Promise<void> => {
    if (!window.confirm("¿Eliminar esta relación?")) return;
    const result = await apiRequest(`/api/subjects/${subject.id}/relationships/${relationshipId}`, { method: "DELETE" }, accessToken);
    setMessage(result.error ? result.message : "Relación eliminada correctamente.");
    if (!result.error) onChanged();
  };

  return (
    <section className="stack">
      <div className="actions-row">
        <h2>Relaciones</h2>
        {canManage ? <button type="button" className="primary-button" onClick={() => setShowAddRelationship(true)}>Añadir relación</button> : null}
      </div>
      {message !== null ? <p className="muted">{message}</p> : null}
      <section className="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>Relacionado</th>
              <th>Tipo</th>
              <th>Descripción</th>
              <th>Fuerza</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {subject.relationships.map((relationship) => (
              <tr key={relationship.id}>
                <td>
                  <Link to={`/sujetos/${relationship.to.id}`}>{relationship.to.firstName} {relationship.to.lastName}</Link>
                </td>
                <td><span className="badge badge-plain">{relationshipTypeLabel(relationship.type)}</span></td>
                <td>{relationship.description ?? "Sin descripción"}</td>
                <td>{"★".repeat(relationship.strength)}{"☆".repeat(5 - relationship.strength)}</td>
                <td>{canManage ? <button type="button" className="danger-button compact-button" onClick={() => void removeRelationship(relationship.id)}>Eliminar</button> : null}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      {showAddRelationship ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <section className="modal-panel">
            <h2>Añadir relación</h2>
            <div className="form-grid">
              <label>Buscar sujeto<input value={search} onChange={(event) => setSearch(event.target.value)} /></label>
              <button type="button" className="secondary-link" onClick={() => void searchSubjects()}>Buscar</button>
              <label className="span-full">Sujeto<select value={toSubjectId} onChange={(event) => setToSubjectId(event.target.value)}>
                <option value="">Selecciona un sujeto</option>
                {subjects.map((item) => <option key={item.id} value={item.id}>{item.firstName} {item.lastName}</option>)}
              </select></label>
              <label>Tipo<select value={type} onChange={(event) => setType(event.target.value)}>
                <option value="ASSOCIATE">Asociado</option>
                <option value="FAMILY">Familiar</option>
                <option value="EMPLOYER">Empleador</option>
                <option value="EMPLOYEE">Empleado</option>
                <option value="ACCOMPLICE">Cómplice</option>
                <option value="RIVAL">Rival</option>
                <option value="UNKNOWN">Desconocido</option>
              </select></label>
              <label className="span-full">Descripción<textarea value={description} onChange={(event) => setDescription(event.target.value)} /></label>
              <div className="star-picker span-full">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button key={value} type="button" className={value <= strength ? "star active" : "star"} onClick={() => setStrength(value)}>★</button>
                ))}
              </div>
            </div>
            <div className="actions-row">
              <button type="button" className="secondary-link" onClick={() => setShowAddRelationship(false)}>Cancelar</button>
              <button type="button" className="primary-button" disabled={toSubjectId.length === 0} onClick={() => void addRelationship()}>Añadir</button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}

function relationshipTypeLabel(type: string): string {
  const labels: Readonly<Record<string, string>> = {
    ASSOCIATE: "Asociado",
    FAMILY: "Familiar",
    EMPLOYER: "Empleador",
    EMPLOYEE: "Empleado",
    ACCOMPLICE: "Cómplice",
    RIVAL: "Rival",
    UNKNOWN: "Desconocido"
  };

  return labels[type] ?? type;
}

function ZonesTab({ subject, onChanged }: { subject: SubjectDetail; onChanged: () => void }): JSX.Element {
  const { accessToken, hasPermission } = useAuth();
  const [showAssignZone, setShowAssignZone] = useState(false);
  const [zones, setZones] = useState<ZoneOption[]>([]);
  const [zoneId, setZoneId] = useState("");
  const [frequency, setFrequency] = useState("residente");
  const [lastSeenAt, setLastSeenAt] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const canManage = hasPermission("MANAGE_SUBJECTS");

  const loadZones = async (): Promise<void> => {
    const result = await apiRequest<ZoneOption[]>("/api/zones", {}, accessToken);

    if (!result.error) setZones(result.data);
  };

  const openAssignZone = (): void => {
    setShowAssignZone(true);
    void loadZones();
  };

  const assignZone = async (): Promise<void> => {
    const body = {
      zoneId,
      frequency,
      lastSeenAt: lastSeenAt.length > 0 ? new Date(lastSeenAt).toISOString() : undefined
    };
    const result = await apiRequest(`/api/subjects/${subject.id}/zones`, { method: "POST", body: JSON.stringify(body) }, accessToken);
    setMessage(result.error ? result.message : "Zona asignada correctamente.");
    if (!result.error) {
      setShowAssignZone(false);
      onChanged();
    }
  };

  const removeZone = async (targetZoneId: string): Promise<void> => {
    if (!window.confirm("¿Desasignar esta zona del sujeto?")) return;
    const result = await apiRequest(`/api/subjects/${subject.id}/zones/${targetZoneId}`, { method: "DELETE" }, accessToken);
    setMessage(result.error ? result.message : "Zona desasignada correctamente.");
    if (!result.error) onChanged();
  };

  return (
    <section className="stack">
      <div className="actions-row">
        <h2>Zonas</h2>
        {canManage ? <button type="button" className="primary-button" onClick={openAssignZone}>Asignar a zona</button> : null}
      </div>
      {message !== null ? <p className="muted">{message}</p> : null}
      <div className="compact-list">
        {subject.zones.length === 0 ? <p className="muted">No hay zonas asignadas.</p> : null}
        {subject.zones.map((item) => (
          <article className="compact-row" key={item.id}>
            <strong>{item.zone.name}</strong>
            <span>{item.zone.district}</span>
            <small>{item.frequency ?? "Frecuencia no registrada"} · Última vez: {shortDateTime(item.lastSeenAt)}</small>
            {canManage ? <button type="button" className="danger-button compact-button" onClick={() => void removeZone(item.zone.id)}>Desasignar</button> : null}
          </article>
        ))}
      </div>
      {showAssignZone ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <section className="modal-panel">
            <h2>Asignar a zona</h2>
            <div className="form-grid">
              <label className="span-full">Zona<select value={zoneId} onChange={(event) => setZoneId(event.target.value)}>
                <option value="">Selecciona una zona</option>
                {zones.map((zone) => <option key={zone.id} value={zone.id}>{zone.district} · {zone.name}</option>)}
              </select></label>
              <label>Frecuencia<select value={frequency} onChange={(event) => setFrequency(event.target.value)}>
                <option value="residente">Residente</option>
                <option value="visto frecuentemente">Visto frecuentemente</option>
                <option value="base de operaciones">Base de operaciones</option>
                <option value="ocasional">Ocasional</option>
              </select></label>
              <label>Última vez visto<input type="datetime-local" value={lastSeenAt} onChange={(event) => setLastSeenAt(event.target.value)} /></label>
            </div>
            <div className="actions-row">
              <button type="button" className="secondary-link" onClick={() => setShowAssignZone(false)}>Cancelar</button>
              <button type="button" className="primary-button" disabled={zoneId.length === 0} onClick={() => void assignZone()}>Asignar</button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}

function InvestigationsTab({ subject }: { subject: SubjectDetail }): JSX.Element {
  return (
    <section className="panel table-wrap">
      <table>
        <thead>
          <tr>
            <th>Expediente</th>
            <th>Título</th>
            <th>Rol</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {subject.investigations.map((item) => (
            <tr key={item.id}>
              <td><Link className="case-number" to={`/investigaciones/${item.investigation.id}`}>{item.investigation.caseNumber}</Link></td>
              <td>{item.investigation.title}</td>
              <td>{item.role}</td>
              <td>{STATUS_LABELS[item.investigation.status] ?? item.investigation.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
