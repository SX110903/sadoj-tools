import { ArrowLeft, Map, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../auth/auth-context";
import { StatusBadge } from "../../components/StatusBadge";
import { EmptyState, SkeletonBlock } from "../../components/ui";
import { apiRequest } from "../../services/api";
import type { CriminalOrganization, MapElement, Subject } from "../../types/sadoj";
import { TYPE_LABELS, shortDateTime } from "../../utils/labels";

const TABS = ["Miembros", "Presencia en el mapa", "Información"] as const;
type OrganizationTab = (typeof TABS)[number];

interface OrganizationDetail extends CriminalOrganization {
  members: Subject[];
  mapElements: MapElement[];
}

export function OrganizationDetailPage(): JSX.Element {
  const { id } = useParams();
  const { accessToken } = useAuth();
  const [organization, setOrganization] = useState<OrganizationDetail | null>(null);
  const [activeTab, setActiveTab] = useState<OrganizationTab>("Miembros");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async (): Promise<void> => {
      if (id === undefined) return;
      const result = await apiRequest<OrganizationDetail>(`/api/organizations/${id}`, {}, accessToken);

      if (result.error) {
        setErrorMessage(result.message);
        return;
      }

      setOrganization(result.data);
    };

    void load();
  }, [id, accessToken]);

  if (errorMessage !== null) return <EmptyState title={errorMessage} />;
  if (id === undefined) return <EmptyState title="Organización no encontrada." />;
  if (organization === null) return <SkeletonBlock height={420} />;

  return (
    <div className="page">
      <Link className="secondary-link compact-button" to="/organizaciones">
        <ArrowLeft size={16} />
        Volver
      </Link>
      <header className="detail-header organization-header">
        <span className="organization-emblem" style={{ background: organization.color }}>{organization.name.slice(0, 1)}</span>
        <div>
          <p className="eyebrow">Organización criminal</p>
          <h1>{organization.name}</h1>
          {organization.alias !== null ? <p className="subject-alias">"{organization.alias}"</p> : null}
          <div className="badge-row">
            <span className="badge badge-plain">{TYPE_LABELS[organization.type] ?? organization.type}</span>
            <span className={organization.active ? "badge status-active" : "badge status-inactive"}>{organization.active ? "Activa" : "Inactiva"}</span>
          </div>
        </div>
        <Link className="primary-link" to={`/mapa?org=${organization.id}`}>
          <Map size={16} />
          Ver en mapa
        </Link>
      </header>

      <section className="stats-grid">
        <article className="stat-card">
          <Users size={22} />
          <div><strong>{organization.members.length}</strong><p>Miembros registrados</p></div>
        </article>
        <article className="stat-card">
          <Map size={22} />
          <div><strong>{organization.mapElements.length}</strong><p>Elementos en el mapa</p></div>
        </article>
      </section>

      <div className="tabs-shell">
        <div className="tab-list">
          {TABS.map((tab) => (
            <button key={tab} type="button" className={tab === activeTab ? "active" : ""} onClick={() => setActiveTab(tab)}>
              {tab}
            </button>
          ))}
        </div>
        {activeTab === "Miembros" ? <MembersTab members={organization.members} /> : null}
        {activeTab === "Presencia en el mapa" ? <MapPresenceTab organizationId={organization.id} elements={organization.mapElements} /> : null}
        {activeTab === "Información" ? <InformationTab organization={organization} /> : null}
      </div>
    </div>
  );
}

function MembersTab({ members }: { members: Subject[] }): JSX.Element {
  if (members.length === 0) {
    return <EmptyState title="No hay miembros vinculados a esta organización." />;
  }

  return (
    <section className="panel table-wrap">
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Alias</th>
            <th>Peligro</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id}>
              <td>
                <div className="person-cell">
                  {member.photo !== null ? <img src={member.photo} alt={`${member.firstName} ${member.lastName}`} /> : <span className="avatar small">{member.firstName.slice(0, 1)}</span>}
                  <Link to={`/sujetos/${member.id}`}>{member.firstName} {member.lastName}</Link>
                </div>
              </td>
              <td>{member.alias ?? "Sin alias"}</td>
              <td><StatusBadge value={member.dangerLevel} kind="danger" /></td>
              <td><StatusBadge value={member.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function MapPresenceTab({ organizationId, elements }: { organizationId: string; elements: MapElement[] }): JSX.Element {
  if (elements.length === 0) {
    return <EmptyState title="No hay elementos de mapa vinculados a esta organización." />;
  }

  return (
    <section className="compact-list">
      {elements.map((element) => (
        <article className="compact-row organization-map-row" key={element.id}>
          <div className="actions-row">
            <div>
              <p className="case-number">#{element.legendNumber} · {TYPE_LABELS[element.type] ?? element.type}</p>
              <strong>{element.label}</strong>
            </div>
            <Link className="secondary-link compact-button" to={`/mapa?org=${organizationId}`}>Ver en mapa</Link>
          </div>
          <p className="muted">
            {element.linkedSubjects.length} persona(s) vinculada(s)
            {element.property !== null && element.property !== undefined ? ` · ${element.property.address}` : ""}
          </p>
          {element.description !== null ? <p>{element.description}</p> : null}
        </article>
      ))}
    </section>
  );
}

function InformationTab({ organization }: { organization: OrganizationDetail }): JSX.Element {
  return (
    <section className="panel">
      <h2>Información</h2>
      <dl className="details-grid">
        <div><dt>Nombre</dt><dd>{organization.name}</dd></div>
        <div><dt>Alias</dt><dd>{organization.alias ?? "Sin alias"}</dd></div>
        <div><dt>Tipo</dt><dd>{TYPE_LABELS[organization.type] ?? organization.type}</dd></div>
        <div><dt>Estado</dt><dd>{organization.active ? "Activa" : "Inactiva"}</dd></div>
        <div><dt>Color operativo</dt><dd><span className="org-color-dot" style={{ background: organization.color }} /> {organization.color}</dd></div>
        <div><dt>Fecha de registro</dt><dd>{shortDateTime(organization.createdAt)}</dd></div>
      </dl>
      <div className="legal-box">
        <strong>Descripción HUMINT</strong>
        <span>{organization.description ?? "No hay descripción registrada."}</span>
      </div>
    </section>
  );
}
