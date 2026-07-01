import { MapPin } from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/auth-context";
import { SecureImage } from "../../components/common/SecureImage";
import { FileUploadPanel } from "../../components/files/FileUploadPanel";
import { StatusBadge } from "../../components/StatusBadge";
import { TimelinePanel } from "../../components/timeline/TimelinePanel";
import { EmptyState, RetryButton, RoleBadge, SkeletonBlock } from "../../components/ui";
import { apiRequest } from "../../services/api";
import type {
  AccessLevel,
  IncidentResult,
  InvestigationListItem,
  PersonRef,
  PropertyDossier,
  PropertyDossierOwner,
  PropertyIncident,
  PropertyIncidentType,
  PropertyMember
} from "../../types/sadoj";
import { ACCESS_LABELS, shortDateTime, STATUS_LABELS, TYPE_LABELS } from "../../utils/labels";

const TABS = ["Resumen", "Incidentes", "Acceso y miembros", "Cronología"] as const;
const INCIDENT_TYPES: readonly PropertyIncidentType[] = ["RAID", "SEIZURE", "SURVEILLANCE", "SIGHTING", "INTERVENTION", "INSPECTION", "OTHER"];
const INCIDENT_RESULTS: readonly IncidentResult[] = ["PENDING", "POSITIVE", "NEGATIVE", "PARTIAL"];
const ACCESS_LEVELS: readonly AccessLevel[] = ["READ", "WRITE", "ADMIN"];

type PropertyTab = (typeof TABS)[number];

interface UserOption extends PersonRef {
  badgeNumber?: string | null;
}

interface IncidentFormState {
  type: PropertyIncidentType;
  title: string;
  description: string;
  occurredAt: string;
  result: IncidentResult;
  participatingAgencies: string;
  evidence: string;
  personsPresent: string;
  investigationId: string;
}

interface MemberFormState {
  userId: string;
  accessLevel: AccessLevel;
}

export function PropertyDetailPage(): JSX.Element {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { accessToken } = useAuth();
  const [dossier, setDossier] = useState<PropertyDossier | null>(null);
  const [investigations, setInvestigations] = useState<InvestigationListItem[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [activeTab, setActiveTab] = useState<PropertyTab>(searchParams.get("newIncident") === "1" ? "Incidentes" : "Resumen");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showIncidentForm, setShowIncidentForm] = useState(searchParams.get("newIncident") === "1");
  const [editingIncidentId, setEditingIncidentId] = useState<string | null>(null);
  const [incidentForm, setIncidentForm] = useState<IncidentFormState>(initialIncidentForm());
  const [memberForm, setMemberForm] = useState<MemberFormState>({ userId: "", accessLevel: "READ" });

  const loadDossier = async (): Promise<void> => {
    if (id === undefined) return;
    const result = await apiRequest<PropertyDossier>(`/api/properties/${id}/dossier`, {}, accessToken);

    if (result.error) {
      setErrorMessage(result.message);
      return;
    }

    setDossier(result.data);
    setErrorMessage(null);
  };

  useEffect(() => {
    void loadDossier();
  }, [accessToken, id]);

  useEffect(() => {
    const loadOptions = async (): Promise<void> => {
      const [investigationsResult, usersResult] = await Promise.all([
        apiRequest<InvestigationListItem[]>("/api/investigations?limit=100", {}, accessToken),
        apiRequest<UserOption[]>("/api/users/mentions?limit=20", {}, accessToken)
      ]);

      if (!investigationsResult.error) setInvestigations(investigationsResult.data);
      if (!usersResult.error) setUsers(usersResult.data);
    };

    void loadOptions();
  }, [accessToken]);

  const selectedMemberUserIds = useMemo(() => new Set(dossier?.members.map((member) => member.userId) ?? []), [dossier]);
  const availableUsers = users.filter((user) => !selectedMemberUserIds.has(user.id));

  const saveIncident = async (): Promise<void> => {
    if (id === undefined) return;
    const payload = {
      type: incidentForm.type,
      title: incidentForm.title,
      description: incidentForm.description,
      occurredAt: new Date(incidentForm.occurredAt).toISOString(),
      result: incidentForm.result,
      participatingAgencies: optionalText(incidentForm.participatingAgencies),
      evidence: optionalText(incidentForm.evidence),
      personsPresent: optionalText(incidentForm.personsPresent),
      investigationId: optionalText(incidentForm.investigationId)
    };
    const endpoint = editingIncidentId === null ? `/api/properties/${id}/incidents` : `/api/properties/${id}/incidents/${editingIncidentId}`;
    const method = editingIncidentId === null ? "POST" : "PUT";
    const result = await apiRequest<PropertyIncident>(endpoint, { method, body: JSON.stringify(payload) }, accessToken);

    if (result.error) {
      setMessage(result.message);
      return;
    }

    setMessage(editingIncidentId === null ? "Incidente registrado correctamente." : "Incidente actualizado correctamente.");
    setIncidentForm(initialIncidentForm());
    setEditingIncidentId(null);
    setShowIncidentForm(false);
    await loadDossier();
  };

  const startEditIncident = (incident: PropertyIncident): void => {
    setEditingIncidentId(incident.id);
    setIncidentForm({
      type: incident.type,
      title: incident.title,
      description: incident.description,
      occurredAt: toLocalDateTimeValue(incident.occurredAt),
      result: incident.result ?? "PENDING",
      participatingAgencies: incident.participatingAgencies ?? "",
      evidence: incident.evidence ?? "",
      personsPresent: incident.personsPresent ?? "",
      investigationId: incident.investigationId ?? ""
    });
    setShowIncidentForm(true);
    setActiveTab("Incidentes");
  };

  const deleteIncident = async (incident: PropertyIncident): Promise<void> => {
    if (id === undefined || !window.confirm(`Eliminar el incidente #${incident.sequence}?`)) return;
    const result = await apiRequest<{ deleted: boolean }>(`/api/properties/${id}/incidents/${incident.id}`, { method: "DELETE" }, accessToken);

    if (result.error) {
      setMessage(result.message);
      return;
    }

    setMessage("Incidente eliminado correctamente.");
    await loadDossier();
  };

  const upsertMember = async (): Promise<void> => {
    if (id === undefined || memberForm.userId.length === 0) return;
    const result = await apiRequest<PropertyMember>(
      `/api/properties/${id}/members`,
      { method: "POST", body: JSON.stringify(memberForm) },
      accessToken
    );

    if (result.error) {
      setMessage(result.message);
      return;
    }

    setMessage("Acceso actualizado correctamente.");
    setMemberForm({ userId: "", accessLevel: "READ" });
    await loadDossier();
  };

  const updateMember = async (member: PropertyMember, accessLevel: AccessLevel): Promise<void> => {
    if (id === undefined) return;
    const result = await apiRequest<PropertyMember>(
      `/api/properties/${id}/members/${member.userId}`,
      { method: "PATCH", body: JSON.stringify({ accessLevel }) },
      accessToken
    );

    if (result.error) {
      setMessage(result.message);
      return;
    }

    setMessage("Acceso actualizado correctamente.");
    await loadDossier();
  };

  const removeMember = async (member: PropertyMember): Promise<void> => {
    if (id === undefined || !window.confirm(`Quitar acceso a ${member.user.displayName}?`)) return;
    const result = await apiRequest<{ deleted: boolean }>(`/api/properties/${id}/members/${member.userId}`, { method: "DELETE" }, accessToken);

    if (result.error) {
      setMessage(result.message);
      return;
    }

    setMessage("Acceso eliminado correctamente.");
    await loadDossier();
  };

  if (id === undefined) return <EmptyState title="Propiedad no encontrada." />;
  if (errorMessage !== null) return <EmptyState title={errorMessage} action={<RetryButton onRetry={() => void loadDossier()} />} />;
  if (dossier === null) return <SkeletonBlock height={420} />;

  const property = dossier.property;

  return (
    <div className="page">
      <header className="property-dossier-header">
        <div className="property-dossier-title">
          <p className="eyebrow">Expediente de propiedad</p>
          <h1>{property.address}</h1>
          <div className="badge-row">
            <span className="badge badge-plain">{TYPE_LABELS[property.type] ?? property.type}</span>
            {property.zone !== null ? <span className="badge badge-plain">{property.zone}</span> : null}
            {dossier.organizations.map((organization) => (
              <span className="badge badge-plain" style={{ borderColor: organization.color }} key={organization.id}>
                {organization.alias ?? organization.name}
              </span>
            ))}
          </div>
          {message !== null ? <p className="muted">{message}</p> : null}
        </div>
        <div className="actions-row">
          {dossier.permissions.canWrite ? (
            <button type="button" className="primary-button" onClick={() => {
              setEditingIncidentId(null);
              setIncidentForm(initialIncidentForm());
              setShowIncidentForm(true);
              setActiveTab("Incidentes");
            }}>
              + Registrar incidente
            </button>
          ) : null}
          <ViewOnMapButton propertyId={property.id} gtaX={property.gtaX} gtaY={property.gtaY} />
        </div>
      </header>

      <section className="property-stat-strip">
        <span><strong>{dossier.incidentCount}</strong>Incidentes</span>
        <span><strong>{dossier.owners.length}</strong>Propietarios y vinculados</span>
        <span><strong>{dossier.members.length}</strong>Miembros con acceso</span>
        <span><strong>{property.gtaX !== null && property.gtaY !== null ? "Sí" : "No"}</strong>Punto geolocalizado</span>
      </section>

      <div className="tabs-shell">
        <div className="tab-list">
          {TABS.map((tab) => (
            <button key={tab} type="button" className={tab === activeTab ? "active" : ""} onClick={() => setActiveTab(tab)}>
              {tab}
            </button>
          ))}
        </div>
        {activeTab === "Resumen" ? <PropertySummary dossier={dossier} /> : null}
        {activeTab === "Incidentes" ? (
          <IncidentTab
            dossier={dossier}
            investigations={investigations}
            form={incidentForm}
            showForm={showIncidentForm}
            editingIncidentId={editingIncidentId}
            onFormChange={setIncidentForm}
            onShowFormChange={setShowIncidentForm}
            onSave={() => void saveIncident()}
            onCancel={() => {
              setShowIncidentForm(false);
              setEditingIncidentId(null);
              setIncidentForm(initialIncidentForm());
            }}
            onEdit={startEditIncident}
            onDelete={(incident) => void deleteIncident(incident)}
          />
        ) : null}
        {activeTab === "Acceso y miembros" ? (
          <MembersTab
            dossier={dossier}
            users={availableUsers}
            memberForm={memberForm}
            onMemberFormChange={setMemberForm}
            onAddMember={() => void upsertMember()}
            onUpdateMember={(member, accessLevel) => void updateMember(member, accessLevel)}
            onRemoveMember={(member) => void removeMember(member)}
          />
        ) : null}
        {activeTab === "Cronología" ? <TimelinePanel endpoint={`/api/properties/${property.id}/timeline`} /> : null}
      </div>
    </div>
  );
}

function PropertySummary({ dossier }: { dossier: PropertyDossier }): JSX.Element {
  const property = dossier.property;

  return (
    <section className="stack">
      <article className="panel">
        <h2>Datos de la propiedad</h2>
        <dl className="details-grid">
          <div><dt>Tipo</dt><dd>{TYPE_LABELS[property.type] ?? property.type}</dd></div>
          <div><dt>Zona</dt><dd>{property.zone ?? "No registrada"}</dd></div>
          <div><dt>Coordenadas GTA</dt><dd>{property.gtaX !== null && property.gtaY !== null ? `${property.gtaX.toFixed(2)}, ${property.gtaY.toFixed(2)}` : "No registradas"}</dd></div>
          <div><dt>Notas</dt><dd>{property.notes ?? "Sin notas"}</dd></div>
        </dl>
      </article>
      <article className="panel">
        <h2>Propietarios y vinculados</h2>
        <OwnerGrid owners={dossier.owners} />
      </article>
    </section>
  );
}

function OwnerGrid({ owners }: { owners: PropertyDossierOwner[] }): JSX.Element {
  if (owners.length === 0) {
    return <EmptyState title="No hay sujetos vinculados a esta propiedad." />;
  }

  return (
    <div className="property-owner-grid">
      {owners.map((owner) => (
        <Link className="property-owner-card" key={owner.id} to={`/sujetos/${owner.subject.id}`}>
          {owner.subject.photo !== null ? (
            <img src={owner.subject.photo} alt={`${owner.subject.firstName} ${owner.subject.lastName}`} />
          ) : (
            <span>{owner.subject.firstName.charAt(0)}{owner.subject.lastName.charAt(0)}</span>
          )}
          <div>
            <strong>{owner.subject.firstName} {owner.subject.lastName}</strong>
            <small>{owner.subject.alias ?? "Sin alias"} · {owner.relation}</small>
            {owner.subject.criminalOrganization !== null && owner.subject.criminalOrganization !== undefined ? (
              <em style={{ borderColor: owner.subject.criminalOrganization.color }}>{owner.subject.criminalOrganization.alias ?? owner.subject.criminalOrganization.name}</em>
            ) : null}
          </div>
        </Link>
      ))}
    </div>
  );
}

function IncidentTab({
  dossier,
  investigations,
  form,
  showForm,
  editingIncidentId,
  onFormChange,
  onShowFormChange,
  onSave,
  onCancel,
  onEdit,
  onDelete
}: {
  dossier: PropertyDossier;
  investigations: InvestigationListItem[];
  form: IncidentFormState;
  showForm: boolean;
  editingIncidentId: string | null;
  onFormChange: (form: IncidentFormState) => void;
  onShowFormChange: (show: boolean) => void;
  onSave: () => void;
  onCancel: () => void;
  onEdit: (incident: PropertyIncident) => void;
  onDelete: (incident: PropertyIncident) => void;
}): JSX.Element {
  return (
    <section className="stack">
      {dossier.permissions.canWrite && showForm ? (
        <IncidentForm
          form={form}
          investigations={investigations}
          editingIncidentId={editingIncidentId}
          onFormChange={onFormChange}
          onSave={onSave}
          onCancel={onCancel}
        />
      ) : null}
      {dossier.permissions.canWrite && !showForm ? (
        <button type="button" className="secondary-link compact-button" onClick={() => onShowFormChange(true)}>+ Registrar incidente</button>
      ) : null}
      {dossier.incidents.length === 0 ? <EmptyState title="Sin incidentes registrados" description="Las actuaciones manuales y los informes de órdenes aparecerán numerados aquí." /> : null}
      <section className="property-raid-list">
        {dossier.incidents.map((incident) => (
          <IncidentCard
            key={incident.id}
            incident={incident}
            canWrite={dossier.permissions.canWrite}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </section>
    </section>
  );
}

function IncidentForm({
  form,
  investigations,
  editingIncidentId,
  onFormChange,
  onSave,
  onCancel
}: {
  form: IncidentFormState;
  investigations: InvestigationListItem[];
  editingIncidentId: string | null;
  onFormChange: (form: IncidentFormState) => void;
  onSave: () => void;
  onCancel: () => void;
}): JSX.Element {
  const canSave = form.title.trim().length >= 3 && form.description.trim().length > 0 && form.occurredAt.length > 0;

  return (
    <article className="panel">
      <div className="actions-row">
        <div>
          <p className="eyebrow">{editingIncidentId === null ? "Nuevo incidente" : "Editar incidente"}</p>
          <h2>{editingIncidentId === null ? "Registrar actuación" : "Actualizar actuación"}</h2>
        </div>
        <button type="button" className="secondary-link compact-button" onClick={onCancel}>Cancelar</button>
      </div>
      <div className="form-grid">
        <label>Tipo<select value={form.type} onChange={(event) => onFormChange({ ...form, type: event.target.value as PropertyIncidentType })}>{INCIDENT_TYPES.map((type) => <option key={type} value={type}>{TYPE_LABELS[type] ?? type}</option>)}</select></label>
        <label>Resultado<select value={form.result} onChange={(event) => onFormChange({ ...form, result: event.target.value as IncidentResult })}>{INCIDENT_RESULTS.map((result) => <option key={result} value={result}>{STATUS_LABELS[result] ?? result}</option>)}</select></label>
        <label>Fecha y hora<input type="datetime-local" value={form.occurredAt} onChange={(event) => onFormChange({ ...form, occurredAt: event.target.value })} /></label>
        <label>Investigación<select value={form.investigationId} onChange={(event) => onFormChange({ ...form, investigationId: event.target.value })}><option value="">Sin investigación vinculada</option>{investigations.map((investigation) => <option key={investigation.id} value={investigation.id}>{investigation.caseNumber} · {investigation.title}</option>)}</select></label>
        <label className="span-full">Título<input value={form.title} onChange={(event) => onFormChange({ ...form, title: event.target.value })} placeholder="Vigilancia exterior, allanamiento, incautación..." /></label>
        <label className="span-full">Descripción<textarea value={form.description} onChange={(event) => onFormChange({ ...form, description: event.target.value })} placeholder="Resumen operativo del incidente" /></label>
        <label className="span-full">Agencias participantes<input value={form.participatingAgencies} onChange={(event) => onFormChange({ ...form, participatingAgencies: event.target.value })} placeholder="Fiscalía SADOJ, LSPD, DAI..." /></label>
        <label className="span-full">Evidencia<textarea value={form.evidence} onChange={(event) => onFormChange({ ...form, evidence: event.target.value })} placeholder="Objetos incautados, fotos, documentos..." /></label>
        <label className="span-full">Personas presentes<textarea value={form.personsPresent} onChange={(event) => onFormChange({ ...form, personsPresent: event.target.value })} placeholder="Personas encontradas o identificadas" /></label>
      </div>
      <button type="button" className="primary-button" disabled={!canSave} onClick={onSave}>
        {editingIncidentId === null ? "Guardar incidente" : "Guardar cambios"}
      </button>
    </article>
  );
}

function IncidentCard({
  incident,
  canWrite,
  onEdit,
  onDelete
}: {
  incident: PropertyIncident;
  canWrite: boolean;
  onEdit: (incident: PropertyIncident) => void;
  onDelete: (incident: PropertyIncident) => void;
}): JSX.Element {
  const isManual = incident.origin === "MANUAL";

  return (
    <article className="property-raid-card">
      <div className="property-raid-heading">
        <div>
          <p className="eyebrow">{TYPE_LABELS[incident.type] ?? incident.type} #{incident.sequence} · {incident.origin === "WARRANT" ? "orden" : "manual"}</p>
          <h2>{incident.title}</h2>
          <small>{shortDateTime(incident.occurredAt)} · {incident.createdBy.displayName}</small>
        </div>
        <StatusBadge value={incident.result ?? "PENDING"} />
      </div>
      <div className="compact-list">
        {incident.investigation !== null && incident.investigation !== undefined ? (
          <div className="compact-row">
            <strong>Investigación</strong>
            <Link to={`/investigaciones/${incident.investigation.id}`}>{incident.investigation.caseNumber}</Link>
          </div>
        ) : null}
        {incident.warrant !== null && incident.warrant !== undefined ? (
          <div className="compact-row">
            <strong>Orden vinculada</strong>
            <Link to={`/ordenes/${incident.warrant.id}`}>{incident.warrant.warrantNumber}</Link>
          </div>
        ) : null}
        {incident.participatingAgencies !== null ? (
          <div className="compact-row">
            <strong>Agencias participantes</strong>
            <span>{incident.participatingAgencies}</span>
          </div>
        ) : null}
      </div>
      <dl className="details-grid">
        <div><dt>Descripción</dt><dd>{incident.description}</dd></div>
        <div><dt>Evidencia</dt><dd>{incident.evidence ?? "Sin evidencia registrada"}</dd></div>
        <div><dt>Personas presentes</dt><dd>{incident.personsPresent ?? "Sin personas registradas"}</dd></div>
      </dl>
      <FileUploadPanel targetType="propertyIncident" targetId={incident.id} initialFiles={incident.files} />
      {canWrite && isManual ? (
        <div className="actions-row">
          <button type="button" className="secondary-link compact-button" onClick={() => onEdit(incident)}>Editar</button>
          <button type="button" className="danger-button compact-button" onClick={() => onDelete(incident)}>Eliminar</button>
        </div>
      ) : null}
    </article>
  );
}

function MembersTab({
  dossier,
  users,
  memberForm,
  onMemberFormChange,
  onAddMember,
  onUpdateMember,
  onRemoveMember
}: {
  dossier: PropertyDossier;
  users: UserOption[];
  memberForm: MemberFormState;
  onMemberFormChange: (form: MemberFormState) => void;
  onAddMember: () => void;
  onUpdateMember: (member: PropertyMember, accessLevel: AccessLevel) => void;
  onRemoveMember: (member: PropertyMember) => void;
}): JSX.Element {
  return (
    <section className="stack">
      <article className="panel">
        <h2>Acceso al expediente</h2>
        <p className="muted">Los fiscales con rango District Attorney o superior tienen acceso global. Los miembros añadidos aquí aplican permisos específicos sobre esta propiedad.</p>
        {dossier.permissions.canManageMembers ? (
          <div className="form-grid">
            <label>Fiscal<select value={memberForm.userId} onChange={(event) => onMemberFormChange({ ...memberForm, userId: event.target.value })}><option value="">Seleccionar fiscal</option>{users.map((user) => <option key={user.id} value={user.id}>{user.displayName} · {TYPE_LABELS[user.role] ?? user.role}</option>)}</select></label>
            <label>Nivel<select value={memberForm.accessLevel} onChange={(event) => onMemberFormChange({ ...memberForm, accessLevel: event.target.value as AccessLevel })}>{ACCESS_LEVELS.map((level) => <option key={level} value={level}>{ACCESS_LABELS[level] ?? level}</option>)}</select></label>
            <button type="button" className="primary-button" disabled={memberForm.userId.length === 0} onClick={onAddMember}>Añadir acceso</button>
          </div>
        ) : null}
      </article>
      <section className="property-raid-list">
        {dossier.members.map((member) => (
          <article className="property-raid-card" key={member.id}>
            <div className="actions-row">
              <div className="compact-row">
                {member.user.avatar !== null ? <img className="avatar" src={member.user.avatar} alt={member.user.displayName} /> : null}
                <strong>{member.user.displayName}</strong>
                <RoleBadge role={member.user.role} />
              </div>
              {dossier.permissions.canManageMembers ? (
                <div className="actions-row">
                  <select value={member.accessLevel} onChange={(event) => onUpdateMember(member, event.target.value as AccessLevel)}>
                    {ACCESS_LEVELS.map((level) => <option key={level} value={level}>{ACCESS_LABELS[level] ?? level}</option>)}
                  </select>
                  <button type="button" className="danger-button compact-button" onClick={() => onRemoveMember(member)}>Quitar</button>
                </div>
              ) : (
                <span className="badge badge-plain">{ACCESS_LABELS[member.accessLevel] ?? member.accessLevel}</span>
              )}
            </div>
            <p className="muted">Añadido por {member.addedBy?.displayName ?? "Sistema"} · {shortDateTime(member.addedAt)}</p>
          </article>
        ))}
      </section>
    </section>
  );
}

function ViewOnMapButton({ propertyId, gtaX, gtaY }: { propertyId: string; gtaX: number | null; gtaY: number | null }): JSX.Element | null {
  if (gtaX === null || gtaY === null) {
    return null;
  }

  return (
    <Link className="secondary-link compact-button" to={`/mapa?property=${encodeURIComponent(propertyId)}`}>
      <MapPin size={16} />
      Ver en el mapa
    </Link>
  );
}

function initialIncidentForm(): IncidentFormState {
  return {
    type: "RAID",
    title: "",
    description: "",
    occurredAt: toLocalDateTimeValue(new Date().toISOString()),
    result: "PENDING",
    participatingAgencies: "",
    evidence: "",
    personsPresent: "",
    investigationId: ""
  };
}

function toLocalDateTimeValue(value: string): string {
  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function optionalText(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}
