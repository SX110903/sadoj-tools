import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/auth-context";
import { ErrorBoundary } from "../../components/common/ErrorBoundary";
import { SecureImage } from "../../components/common/SecureImage";
import { apiRequest } from "../../services/api";
import type { CriminalOrganization, MapElement, MapElementType, OrgType, Property, PropertyDossier, Subject } from "../../types/sadoj";
import { shortDateTime, STATUS_LABELS, TYPE_LABELS } from "../../utils/labels";
import { parseGeoJson } from "../../utils/mapCoords";
import { EmptyState, RetryButton, SkeletonBlock } from "../ui";
import { LosSantosMap } from "./LosSantosMap";

const ORG_TYPES: readonly OrgType[] = ["GANG", "CARTEL", "MAFIA", "BIKER", "CORPORATE", "OTHER"];
const SUBJECT_ROLES = ["controla la zona", "visto aquí", "propietario", "operador"] as const;
const COLOR_PRESETS = ["#dc2626", "#d97706", "#16a34a", "#3b82f6", "#8b5cf6", "#8b9db5"] as const;
const PROPERTY_TYPES = ["RESIDENCE", "BUSINESS", "WAREHOUSE", "HIDEOUT", "UNKNOWN"] as const;

type MapElementDraft = {
  type: MapElementType;
  geoJson: string;
  radius?: number;
};

type SubjectLinkDraft = {
  subjectId: string;
  role: string;
};

type ElementFormState = {
  label: string;
  organizationId: string;
  description: string;
  color: string;
  propertyId: string;
  propertyAddress: string;
  propertyType: string;
  propertyZone: string;
  propertyNotes: string;
  subjectLinks: SubjectLinkDraft[];
};

type OrganizationFormState = {
  name: string;
  alias: string;
  color: string;
  type: OrgType;
};

type RightPanelMode = "legend" | "create" | "edit";

interface IntelMapWorkspaceProps {
  investigationId?: string;
  title?: string;
}

interface PointCoordinates {
  gtaX: number;
  gtaY: number;
}

interface PropertyHistoryTarget {
  property: Property;
  dossier: PropertyDossier | null;
  accessDenied: boolean;
}

export function IntelMapWorkspace({ investigationId, title = "Los Santos" }: IntelMapWorkspaceProps): JSX.Element {
  const { accessToken, hasPermission } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [elements, setElements] = useState<MapElement[] | null>(null);
  const [organizations, setOrganizations] = useState<CriminalOrganization[] | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [activeOrgFilter, setActiveOrgFilter] = useState<string | null>(searchParams.get("org"));
  const [highlightedElementId, setHighlightedElementId] = useState<string | null>(null);
  const [selectedElement, setSelectedElement] = useState<MapElement | null>(null);
  const [pendingDraft, setPendingDraft] = useState<MapElementDraft | null>(null);
  const [editingElement, setEditingElement] = useState<MapElement | null>(null);
  const [rightPanel, setRightPanel] = useState<RightPanelMode>("legend");
  const [clearPendingDraftSignal, setClearPendingDraftSignal] = useState(0);
  const [form, setForm] = useState<ElementFormState>(initialElementForm());
  const [organizationForm, setOrganizationForm] = useState<OrganizationFormState>({ name: "", alias: "", color: "#dc2626", type: "GANG" });
  const [historyTarget, setHistoryTarget] = useState<PropertyHistoryTarget | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const canManageIntel = hasPermission("MANAGE_SUBJECTS");

  const nextLegendNumber = useMemo(() => (elements ?? []).reduce((max, element) => Math.max(max, element.legendNumber), 0) + 1, [elements]);

  const load = async (): Promise<void> => {
    setLoadError(null);
    const query = investigationId === undefined ? "" : `?investigationId=${encodeURIComponent(investigationId)}`;
    const [elementsResult, organizationsResult, subjectsResult, propertiesResult] = await Promise.all([
      apiRequest<MapElement[]>(`/api/map/elements${query}`, {}, accessToken),
      apiRequest<CriminalOrganization[]>("/api/organizations?active=true", {}, accessToken),
      apiRequest<Subject[]>("/api/subjects?limit=100", {}, accessToken),
      apiRequest<Property[]>("/api/properties?limit=100", {}, accessToken)
    ]);

    if (elementsResult.error) {
      setLoadError(elementsResult.message);
    } else {
      setElements(elementsResult.data);
    }

    if (organizationsResult.error) {
      setOrganizations([]);
      setMessage(organizationsResult.message);
    } else {
      setOrganizations(organizationsResult.data);
    }
    if (!subjectsResult.error) setSubjects(subjectsResult.data);
    if (!propertiesResult.error) setProperties(propertiesResult.data);
  };

  useEffect(() => {
    void load();
  }, [accessToken, investigationId]);

  useEffect(() => {
    const nextOrg = searchParams.get("org");
    setActiveOrgFilter(nextOrg);
  }, [searchParams]);

  const filteredElements = useMemo(() => {
    const source = elements ?? [];
    return activeOrgFilter === null ? source : source.filter((element) => element.organizationId === activeOrgFilter);
  }, [activeOrgFilter, elements]);

  const handleFilterChange = (organizationId: string | null): void => {
    setActiveOrgFilter(organizationId);
    const next = new URLSearchParams(searchParams);
    if (organizationId === null) {
      next.delete("org");
    } else {
      next.set("org", organizationId);
    }
    setSearchParams(next);
  };

  const openDraftDialog = (draft: MapElementDraft): void => {
    setPendingDraft(draft);
    setEditingElement(null);
    setForm(initialElementForm());
    setRightPanel("create");
  };

  const openEditDialog = (element: MapElement): void => {
    setEditingElement(element);
    setPendingDraft(null);
    setForm({
      label: element.label,
      organizationId: element.organizationId ?? "",
      description: element.description ?? "",
      color: element.color,
      propertyId: element.propertyId ?? "",
      propertyAddress: "",
      propertyType: "RESIDENCE",
      propertyZone: "",
      propertyNotes: "",
      subjectLinks: element.linkedSubjects.map((link) => ({ subjectId: link.subjectId, role: link.role ?? "visto aquí" }))
    });
    setRightPanel("edit");
  };

  const closeElementPanel = (): void => {
    if (pendingDraft !== null) {
      setClearPendingDraftSignal((current) => current + 1);
    }
    setPendingDraft(null);
    setEditingElement(null);
    setForm(initialElementForm());
    setRightPanel("legend");
  };

  const saveElement = async (): Promise<void> => {
    if (editingElement !== null) {
      const result = await apiRequest<MapElement>(
        `/api/map/elements/${editingElement.id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            label: form.label,
            description: form.description.length > 0 ? form.description : null,
            color: form.color,
            organizationId: form.organizationId.length > 0 ? form.organizationId : null,
            radius: editingElement.radius
          })
        },
        accessToken
      );

      if (result.error) {
        setMessage(result.message);
        return;
      }

      await syncElementSubjects(result.data.id, form.subjectLinks);
      setMessage("✓ Elemento actualizado.");
      closeElementPanel();
      await load();
      return;
    }

    if (pendingDraft === null) return;

    const coordinates = pointCoordinatesFromGeoJson(pendingDraft.geoJson);
    const propertyId = await resolvePointProperty(pendingDraft, coordinates);
    const result = await apiRequest<MapElement>(
      "/api/map/elements",
      {
        method: "POST",
        body: JSON.stringify({
          investigationId,
          type: pendingDraft.type,
          label: form.label,
          description: form.description.length > 0 ? form.description : undefined,
          color: form.color,
          geoJson: pendingDraft.geoJson,
          radius: pendingDraft.radius,
          organizationId: form.organizationId.length > 0 ? form.organizationId : undefined,
          propertyId,
          linkedSubjects: form.subjectLinks
        })
      },
      accessToken
    );

    if (result.error) {
      setMessage(result.message);
      return;
    }

    setMessage(`✓ Elemento #${result.data.legendNumber} creado.`);
    closeElementPanel();
    await load();
  };

  const resolvePointProperty = async (draft: MapElementDraft, coordinates: PointCoordinates | null): Promise<string | undefined> => {
    if (draft.type !== "POINT" || coordinates === null) return undefined;

    if (form.propertyId.length > 0) {
      const updateResult = await apiRequest<Property>(
        `/api/properties/${form.propertyId}`,
        { method: "PUT", body: JSON.stringify({ gtaX: coordinates.gtaX, gtaY: coordinates.gtaY }) },
        accessToken
      );
      return updateResult.error ? form.propertyId : updateResult.data.id;
    }

    if (form.propertyAddress.trim().length === 0) return undefined;

    const createResult = await apiRequest<Property>(
      "/api/properties",
      {
        method: "POST",
        body: JSON.stringify({
          address: form.propertyAddress,
          type: form.propertyType,
          zone: form.propertyZone.length > 0 ? form.propertyZone : undefined,
          notes: form.propertyNotes.length > 0 ? form.propertyNotes : undefined,
          gtaX: coordinates.gtaX,
          gtaY: coordinates.gtaY
        })
      },
      accessToken
    );

    if (createResult.error) {
      setMessage(createResult.message);
      return undefined;
    }

    return createResult.data.id;
  };

  const syncElementSubjects = async (elementId: string, subjectLinks: readonly SubjectLinkDraft[]): Promise<void> => {
    await Promise.all(subjectLinks.map((link) =>
      apiRequest(
        `/api/map/elements/${elementId}/subjects`,
        { method: "POST", body: JSON.stringify({ subjectId: link.subjectId, role: link.role }) },
        accessToken
      )
    ));
  };

  const createOrganization = async (): Promise<void> => {
    const result = await apiRequest<CriminalOrganization>(
      "/api/organizations",
      {
        method: "POST",
        body: JSON.stringify({
          name: organizationForm.name,
          alias: organizationForm.alias.length > 0 ? organizationForm.alias : undefined,
          color: organizationForm.color,
          type: organizationForm.type
        })
      },
      accessToken
    );

    if (result.error) {
      setMessage(result.message);
      return;
    }

    setOrganizations((current) => [result.data, ...(current ?? [])]);
    setForm((current) => ({ ...current, organizationId: result.data.id, color: result.data.color }));
    setOrganizationForm({ name: "", alias: "", color: "#dc2626", type: "GANG" });
  };

  const openHistory = async (property: Property): Promise<void> => {
    setHistoryTarget({ property, dossier: null, accessDenied: false });
    const result = await apiRequest<PropertyDossier>(`/api/properties/${property.id}/dossier`, {}, accessToken);
    setHistoryTarget({ property, dossier: result.error ? null : result.data, accessDenied: result.error });
  };

  const selectElement = (element: MapElement): void => {
    setSelectedElement(element);
    setHighlightedElementId(element.id);

    if (element.property !== null && element.property !== undefined) {
      void openHistory(element.property);
    }
  };

  const deleteElement = async (element: MapElement): Promise<void> => {
    if (!window.confirm(`Eliminar el elemento #${element.legendNumber}?`)) return;
    const result = await apiRequest<{ deleted: boolean }>(`/api/map/elements/${element.id}`, { method: "DELETE" }, accessToken);

    if (result.error) {
      setMessage(result.message);
      return;
    }

    setMessage("Elemento eliminado.");
    await load();
  };

  if (loadError !== null && elements === null) {
    return <EmptyState title={loadError} action={<RetryButton onRetry={() => void load()} />} />;
  }

  if (elements === null || organizations === null) return <SkeletonBlock height={620} />;

  return (
    <div className="page map-workspace">
      <header className="page-header">
        <div>
          <p className="eyebrow">Mapa HUMINT</p>
          <h1>{title}</h1>
        </div>
        {message !== null ? <p className="muted">{message}</p> : null}
      </header>
      <section className="intel-map-grid">
        <ErrorBoundary title="Algo salió mal al cargar el mapa">
          <LosSantosMap
            mapElements={elements}
            activeOrgFilter={activeOrgFilter}
            highlightedElementId={highlightedElementId}
            canManageIntel={canManageIntel}
            clearPendingDraftSignal={clearPendingDraftSignal}
            onElementDraft={openDraftDialog}
            onElementSelect={selectElement}
          />
        </ErrorBoundary>
        {rightPanel === "legend" ? (
          <IntelLegendPanel
            elements={filteredElements}
            allElements={elements}
            organizations={organizations}
            activeOrgFilter={activeOrgFilter}
            selectedElement={selectedElement}
            canManage={canManageIntel}
            onFilterChange={handleFilterChange}
            onSelect={selectElement}
            onEdit={openEditDialog}
            onDelete={(element) => void deleteElement(element)}
            onOpenHistory={(property) => void openHistory(property)}
          />
        ) : (
          <IntelElementForm
            draft={pendingDraft}
            editingElement={editingElement}
            form={form}
            organizations={organizations}
            subjects={subjects}
            properties={properties}
            organizationForm={organizationForm}
            nextLegendNumber={editingElement?.legendNumber ?? nextLegendNumber}
            onFormChange={setForm}
            onOrganizationFormChange={setOrganizationForm}
            onCreateOrganization={() => void createOrganization()}
            onCancel={closeElementPanel}
            onSave={() => void saveElement()}
          />
        )}
      </section>
      {historyTarget !== null ? (
        <PropertyHistorySheet
          target={historyTarget}
          onClose={() => setHistoryTarget(null)}
          onImageOpen={setLightboxUrl}
        />
      ) : null}
      {lightboxUrl !== null ? (
        <button type="button" className="lightbox" onClick={() => setLightboxUrl(null)} aria-label="Cerrar imagen">
          <img src={lightboxUrl} alt="Evidencia ampliada" />
        </button>
      ) : null}
    </div>
  );
}

function IntelLegendPanel({
  elements,
  allElements,
  organizations,
  activeOrgFilter,
  selectedElement,
  canManage,
  onFilterChange,
  onSelect,
  onEdit,
  onDelete,
  onOpenHistory
}: {
  elements: MapElement[];
  allElements: MapElement[];
  organizations: CriminalOrganization[];
  activeOrgFilter: string | null;
  selectedElement: MapElement | null;
  canManage: boolean;
  onFilterChange: (organizationId: string | null) => void;
  onSelect: (element: MapElement) => void;
  onEdit: (element: MapElement) => void;
  onDelete: (element: MapElement) => void;
  onOpenHistory: (property: Property) => void;
}): JSX.Element {
  const organizationCount = new Set(elements.map((element) => element.organizationId).filter((value): value is string => value !== null)).size;

  return (
    <aside className="intel-legend-panel">
      <div className="intel-legend-header">
        <p className="eyebrow">Leyenda de inteligencia</p>
        <div className="org-chip-row">
          <button type="button" className={activeOrgFilter === null ? "org-chip active" : "org-chip"} onClick={() => onFilterChange(null)}>Todas</button>
          {organizations.map((organization) => (
            <button
              key={organization.id}
              type="button"
              className={activeOrgFilter === organization.id ? "org-chip active" : "org-chip"}
              style={{ borderColor: organization.color }}
              onClick={() => onFilterChange(organization.id)}
            >
              <span style={{ background: organization.color }} />
              {organization.alias ?? organization.name}
            </button>
          ))}
        </div>
      </div>
      <div className="intel-legend-list">
        {elements.length === 0 ? <EmptyState title="No hay elementos de inteligencia registrados." /> : null}
        {elements.map((element) => (
          <article className={selectedElement?.id === element.id ? "intel-legend-entry active" : "intel-legend-entry"} key={element.id}>
            <button type="button" className="intel-entry-main" onClick={() => onSelect(element)}>
              <span className="intel-entry-number" style={{ background: element.organization?.color ?? element.color }}>{element.legendNumber}</span>
              <span>
                <strong>{element.label}</strong>
                <small>{element.organization?.alias ?? element.organization?.name ?? "Organización desconocida"}</small>
              </span>
            </button>
            <div className="intel-entry-meta">
              {element.linkedSubjects.map((link) => (
                <span key={link.id}>{link.subject.firstName} {link.subject.lastName} · {link.role ?? "vinculado"}</span>
              ))}
              {element.property !== null && element.property !== undefined ? <span>{element.property.address}</span> : null}
              {element.description !== null ? <p>{element.description}</p> : null}
            </div>
            <div className="toolbar">
              {element.property !== null && element.property !== undefined ? (
                <button
                  type="button"
                  className="secondary-link compact-button"
                  onClick={() => {
                    const property = element.property;
                    if (property !== null && property !== undefined) onOpenHistory(property);
                  }}
                >
                  Ver
                </button>
              ) : null}
              {canManage ? <button type="button" className="secondary-link compact-button" onClick={() => onEdit(element)}>Editar</button> : null}
              {canManage ? <button type="button" className="danger-button compact-button" onClick={() => onDelete(element)}>×</button> : null}
            </div>
          </article>
        ))}
      </div>
      <div className="intel-legend-footer">
        {elements.length} elemento(s) · {organizationCount} organización(es) · {allElements.length} total
      </div>
    </aside>
  );
}

function IntelElementForm({
  draft,
  editingElement,
  form,
  organizations,
  subjects,
  properties,
  organizationForm,
  nextLegendNumber,
  onFormChange,
  onOrganizationFormChange,
  onCreateOrganization,
  onCancel,
  onSave
}: {
  draft: MapElementDraft | null;
  editingElement: MapElement | null;
  form: ElementFormState;
  organizations: CriminalOrganization[];
  subjects: Subject[];
  properties: Property[];
  organizationForm: OrganizationFormState;
  nextLegendNumber: number;
  onFormChange: (form: ElementFormState) => void;
  onOrganizationFormChange: (form: OrganizationFormState) => void;
  onCreateOrganization: () => void;
  onCancel: () => void;
  onSave: () => void;
}): JSX.Element {
  const type = editingElement?.type ?? draft?.type ?? "POINT";
  const canSave = form.label.trim().length > 0;

  return (
    <aside className="intel-form-panel" aria-label="Formulario de inteligencia">
        <div className="actions-row">
          <div>
            <p className="eyebrow">{editingElement === null ? "Nuevo elemento de inteligencia" : "Editar elemento de inteligencia"}</p>
            <h2>Elemento #{nextLegendNumber}</h2>
          </div>
          <button type="button" className="secondary-link compact-button" onClick={onCancel}>Cerrar</button>
        </div>
        <div className="form-grid">
          <label className="span-full">Título<input value={form.label} onChange={(event) => onFormChange({ ...form, label: event.target.value })} placeholder="Casa franca de Los Ballas" /></label>
          <label>
            Organización criminal
            <select value={form.organizationId} onChange={(event) => {
              const organization = organizations.find((item) => item.id === event.target.value);
              onFormChange({ ...form, organizationId: event.target.value, color: organization?.color ?? form.color });
            }}>
              <option value="">Ninguna / desconocida</option>
              {organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.alias ?? organization.name}</option>)}
            </select>
          </label>
          <label>
            Color
            <input type="color" value={form.color} onChange={(event) => onFormChange({ ...form, color: event.target.value })} />
          </label>
          <div className="color-swatches span-full">
            {COLOR_PRESETS.map((color) => (
              <button key={color} type="button" aria-label={`Color ${color}`} style={{ background: color }} onClick={() => onFormChange({ ...form, color })} />
            ))}
          </div>
          <label className="span-full">
            Personas vinculadas
            <select value="" onChange={(event) => {
              if (event.target.value.length === 0 || form.subjectLinks.some((link) => link.subjectId === event.target.value)) return;
              onFormChange({ ...form, subjectLinks: [...form.subjectLinks, { subjectId: event.target.value, role: "visto aquí" }] });
            }}>
              <option value="">Añadir sujeto</option>
              {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.firstName} {subject.lastName} · {subject.alias ?? "Sin alias"}</option>)}
            </select>
          </label>
          <div className="subject-chip-list span-full">
            {form.subjectLinks.map((link) => {
              const subject = subjects.find((item) => item.id === link.subjectId);
              return (
                <div className="subject-chip" key={link.subjectId}>
                  <strong>{subject === undefined ? "Sujeto" : `${subject.firstName} ${subject.lastName}`}</strong>
                  <select value={link.role} onChange={(event) => onFormChange({ ...form, subjectLinks: form.subjectLinks.map((item) => item.subjectId === link.subjectId ? { ...item, role: event.target.value } : item) })}>
                    {SUBJECT_ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
                  </select>
                  <button type="button" onClick={() => onFormChange({ ...form, subjectLinks: form.subjectLinks.filter((item) => item.subjectId !== link.subjectId) })}>×</button>
                </div>
              );
            })}
          </div>
          {type === "POINT" ? (
            <>
              <label className="span-full">
                Propiedad asociada
                <select value={form.propertyId} onChange={(event) => onFormChange({ ...form, propertyId: event.target.value })}>
                  <option value="">Crear o dejar sin propiedad</option>
                  {properties.map((property) => <option key={property.id} value={property.id}>{property.address}</option>)}
                </select>
              </label>
              <label>Nueva dirección<input value={form.propertyAddress} onChange={(event) => onFormChange({ ...form, propertyAddress: event.target.value })} /></label>
              <label>Tipo<select value={form.propertyType} onChange={(event) => onFormChange({ ...form, propertyType: event.target.value })}>{PROPERTY_TYPES.map((typeValue) => <option key={typeValue} value={typeValue}>{TYPE_LABELS[typeValue] ?? typeValue}</option>)}</select></label>
              <label>Zona<input value={form.propertyZone} onChange={(event) => onFormChange({ ...form, propertyZone: event.target.value })} /></label>
              <label>Notas<input value={form.propertyNotes} onChange={(event) => onFormChange({ ...form, propertyNotes: event.target.value })} /></label>
            </>
          ) : null}
          <label className="span-full">Notas HUMINT<textarea value={form.description} onChange={(event) => onFormChange({ ...form, description: event.target.value })} /></label>
        </div>
        <section className="quick-org-box">
          <p className="eyebrow">Crear organización rápida</p>
          <div className="form-grid">
            <input placeholder="Nombre" value={organizationForm.name} onChange={(event) => onOrganizationFormChange({ ...organizationForm, name: event.target.value })} />
            <input placeholder="Alias" value={organizationForm.alias} onChange={(event) => onOrganizationFormChange({ ...organizationForm, alias: event.target.value })} />
            <input type="color" value={organizationForm.color} onChange={(event) => onOrganizationFormChange({ ...organizationForm, color: event.target.value })} />
            <select value={organizationForm.type} onChange={(event) => onOrganizationFormChange({ ...organizationForm, type: event.target.value as OrgType })}>{ORG_TYPES.map((orgType) => <option key={orgType} value={orgType}>{TYPE_LABELS[orgType] ?? orgType}</option>)}</select>
            <button type="button" className="secondary-link span-full" disabled={organizationForm.name.trim().length < 2} onClick={onCreateOrganization}>Crear y seleccionar</button>
          </div>
        </section>
        <div className="actions-row">
          <button type="button" className="secondary-link" onClick={onCancel}>Cancelar</button>
          <button type="button" className="primary-button" disabled={!canSave} onClick={onSave}>Guardar elemento #{nextLegendNumber}</button>
        </div>
    </aside>
  );
}

function PropertyHistorySheet({
  target,
  onClose,
  onImageOpen
}: {
  target: PropertyHistoryTarget;
  onClose: () => void;
  onImageOpen: (url: string) => void;
}): JSX.Element {
  const dossier = target.dossier;
  const property = dossier?.property ?? target.property;
  const incidents = dossier?.incidents ?? [];

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <section className="modal-panel property-history-sheet">
        <div className="actions-row">
          <div>
            <p className="eyebrow">Expediente de propiedad</p>
            <h2>{property.address}</h2>
            <p className="muted">{TYPE_LABELS[property.type] ?? property.type} · {property.zone ?? "Zona no registrada"}</p>
          </div>
          <button type="button" className="secondary-link compact-button" onClick={onClose}>Cerrar</button>
        </div>
        {dossier === null && !target.accessDenied ? <SkeletonBlock height={160} /> : null}
        {target.accessDenied ? (
          <div className="panel">
            <p className="muted">No tienes acceso al expediente completo de esta propiedad. Solicita acceso a un fiscal con permiso ADMIN.</p>
          </div>
        ) : null}
        {dossier !== null ? (
          <>
            <div className="property-quick-stats">
              <span><strong>{dossier.incidentCount}</strong>{dossier.incidentCount === 1 ? "Incidente registrado" : "Incidentes registrados"}</span>
              <span><strong>{dossier.owners.length}</strong>Vinculados</span>
              <span><strong>{dossier.organizations.length}</strong>Organizaciones</span>
            </div>
            <section className="property-owner-strip">
              {dossier.owners.length === 0 ? <p className="muted">Sin propietarios o vinculados registrados.</p> : null}
              {dossier.owners.map((owner) => (
                <Link className="property-owner-chip" key={owner.id} to={`/sujetos/${owner.subject.id}`}>
                  {owner.subject.photo !== null ? <img src={owner.subject.photo} alt={`${owner.subject.firstName} ${owner.subject.lastName}`} /> : <span>{owner.subject.firstName.charAt(0)}{owner.subject.lastName.charAt(0)}</span>}
                  <strong>{owner.subject.firstName} {owner.subject.lastName}</strong>
                  <small>{owner.relation}</small>
                </Link>
              ))}
            </section>
          </>
        ) : null}
        {dossier !== null && incidents.length === 0 ? <EmptyState title="Sin incidentes registrados en esta propiedad." /> : null}
        <div className="history-timeline">
          {incidents.map((incident) => (
            <article className="history-entry" key={incident.id}>
              <div className="actions-row">
                {incident.warrant !== null && incident.warrant !== undefined ? (
                  <Link className="case-number" to={`/ordenes/${incident.warrant.id}`}>#{incident.sequence} · {incident.warrant.warrantNumber}</Link>
                ) : (
                  <strong className="case-number">#{incident.sequence} · {incident.title}</strong>
                )}
                <span className={`result-badge ${(incident.result ?? "pending").toLowerCase()}`}>{STATUS_LABELS[incident.result ?? "PENDING"] ?? "Pendiente"}</span>
              </div>
              <small>{TYPE_LABELS[incident.type] ?? incident.type} · {shortDateTime(incident.occurredAt)} · {incident.createdBy.displayName}</small>
              {incident.investigation !== null && incident.investigation !== undefined ? <p><strong>Investigación:</strong> {incident.investigation.caseNumber}</p> : null}
              {incident.participatingAgencies !== null ? <p><strong>Agencias:</strong> {incident.participatingAgencies}</p> : null}
              <p><strong>Descripción:</strong> {incident.description}</p>
              {incident.evidence !== null ? <p><strong>Evidencia:</strong> {incident.evidence}</p> : null}
              {incident.files.length > 0 ? (
                <div className="file-thumb-grid">
                  {incident.files.map((file) => (
                    <SecureImage key={file.id} fileId={file.id} alt={file.originalName} className="file-thumb-image" onClick={onImageOpen} />
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
        <div className="actions-row">
          <Link className="primary-link" to={`/propiedades/${property.id}`}>
            Abrir expediente completo
          </Link>
          {dossier?.permissions.canWrite === true ? (
            <Link className="secondary-link" to={`/propiedades/${property.id}?newIncident=1`}>
              + Registrar incidente
            </Link>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function initialElementForm(): ElementFormState {
  return {
    label: "",
    organizationId: "",
    description: "",
    color: "#dc2626",
    propertyId: "",
    propertyAddress: "",
    propertyType: "RESIDENCE",
    propertyZone: "",
    propertyNotes: "",
    subjectLinks: []
  };
}

function pointCoordinatesFromGeoJson(value: string): PointCoordinates | null {
  const geoJson = parseGeoJson(value);
  if (geoJson === null) return null;

  if (isPointFeature(geoJson)) {
    return pointCoordinatesOrNull(geoJson.geometry.coordinates[0], geoJson.geometry.coordinates[1]);
  }

  if (isPointGeometry(geoJson)) {
    return pointCoordinatesOrNull(geoJson.coordinates[0], geoJson.coordinates[1]);
  }

  return null;
}

function pointCoordinatesOrNull(gtaX: number | undefined, gtaY: number | undefined): PointCoordinates | null {
  if (gtaX === undefined || gtaY === undefined || !Number.isFinite(gtaX) || !Number.isFinite(gtaY)) {
    return null;
  }

  return { gtaX, gtaY };
}

function isPointFeature(value: GeoJSON.GeoJsonObject): value is GeoJSON.Feature<GeoJSON.Point> {
  if (value.type !== "Feature") return false;
  const feature = value as GeoJSON.Feature<GeoJSON.Geometry>;
  return feature.geometry.type === "Point";
}

function isPointGeometry(value: GeoJSON.GeoJsonObject): value is GeoJSON.Point {
  return value.type === "Point";
}
