import { Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/auth-context";
import { EmptyState, SkeletonBlock } from "../../components/ui";
import { apiRequest } from "../../services/api";
import type { CriminalOrganization, OrgType } from "../../types/sadoj";
import { TYPE_LABELS, shortDateTime } from "../../utils/labels";

const ORG_TYPES: readonly OrgType[] = ["GANG", "CARTEL", "MAFIA", "BIKER", "CORPORATE", "OTHER"];

interface OrganizationFormState {
  name: string;
  alias: string;
  color: string;
  description: string;
  type: OrgType;
}

const INITIAL_FORM: OrganizationFormState = {
  name: "",
  alias: "",
  color: "#dc2626",
  description: "",
  type: "GANG"
};

export function OrganizationsListPage(): JSX.Element {
  const { accessToken, hasPermission } = useAuth();
  const [organizations, setOrganizations] = useState<CriminalOrganization[] | null>(null);
  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<OrganizationFormState>(INITIAL_FORM);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const canManage = hasPermission("MANAGE_SUBJECTS");

  const loadOrganizations = async (search = query): Promise<void> => {
    const params = new URLSearchParams();
    if (search.trim().length > 0) params.set("q", search.trim());
    const result = await apiRequest<CriminalOrganization[]>(`/api/organizations${params.size > 0 ? `?${params.toString()}` : ""}`, {}, accessToken);

    if (result.error) {
      setErrorMessage(result.message);
      return;
    }

    setOrganizations(result.data);
  };

  useEffect(() => {
    void loadOrganizations("");
  }, [accessToken]);

  const createOrganization = async (): Promise<void> => {
    const result = await apiRequest<CriminalOrganization>(
      "/api/organizations",
      {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          alias: form.alias.length > 0 ? form.alias : undefined,
          color: form.color,
          description: form.description.length > 0 ? form.description : undefined,
          type: form.type
        })
      },
      accessToken
    );

    if (result.error) {
      setMessage(result.message);
      return;
    }

    setOrganizations((current) => [result.data, ...(current ?? [])]);
    setForm(INITIAL_FORM);
    setShowCreate(false);
    setMessage("Organización creada correctamente.");
  };

  if (errorMessage !== null) return <EmptyState title={errorMessage} />;
  if (organizations === null) return <SkeletonBlock height={320} />;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Inteligencia criminal</p>
          <h1>Organizaciones</h1>
        </div>
        {canManage ? (
          <button type="button" className="primary-button" onClick={() => setShowCreate(true)}>
            <Plus size={16} />
            Nueva organización
          </button>
        ) : null}
      </div>

      <section className="panel">
        <div className="search-row">
          <label>
            Buscar organización
            <input value={query} placeholder="Nombre, alias o banda" onChange={(event) => setQuery(event.target.value)} />
          </label>
          <button type="button" className="secondary-link" onClick={() => void loadOrganizations()}>
            <Search size={16} />
            Buscar
          </button>
        </div>
      </section>

      {message !== null ? <p className="muted">{message}</p> : null}

      <section className="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>Color</th>
              <th>Nombre</th>
              <th>Alias</th>
              <th>Tipo</th>
              <th>Miembros</th>
              <th>Mapa</th>
              <th>Estado</th>
              <th>Registro</th>
            </tr>
          </thead>
          <tbody>
            {organizations.map((organization) => (
              <tr key={organization.id}>
                <td><span className="org-color-dot" style={{ background: organization.color }} /></td>
                <td><Link to={`/organizaciones/${organization.id}`}>{organization.name}</Link></td>
                <td>{organization.alias ?? "Sin alias"}</td>
                <td><span className="badge badge-plain">{TYPE_LABELS[organization.type] ?? organization.type}</span></td>
                <td>{organization._count?.members ?? 0}</td>
                <td>{organization._count?.mapElements ?? 0}</td>
                <td><span className={organization.active ? "badge status-active" : "badge status-inactive"}>{organization.active ? "Activa" : "Inactiva"}</span></td>
                <td>{shortDateTime(organization.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {showCreate ? (
        <OrganizationDialog
          form={form}
          onChange={setForm}
          onClose={() => setShowCreate(false)}
          onSubmit={() => void createOrganization()}
        />
      ) : null}
    </div>
  );
}

function OrganizationDialog({
  form,
  onChange,
  onClose,
  onSubmit
}: {
  form: OrganizationFormState;
  onChange: (value: OrganizationFormState) => void;
  onClose: () => void;
  onSubmit: () => void;
}): JSX.Element {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <section className="modal-panel">
        <h2>Nueva organización criminal</h2>
        <div className="form-grid">
          <label>
            Nombre *
            <input value={form.name} placeholder="ej: Los Ballas" onChange={(event) => onChange({ ...form, name: event.target.value })} />
          </label>
          <label>
            Alias
            <input value={form.alias} placeholder="Nombre operativo" onChange={(event) => onChange({ ...form, alias: event.target.value })} />
          </label>
          <label>
            Tipo
            <select value={form.type} onChange={(event) => onChange({ ...form, type: event.target.value as OrgType })}>
              {ORG_TYPES.map((type) => <option key={type} value={type}>{TYPE_LABELS[type] ?? type}</option>)}
            </select>
          </label>
          <label>
            Color
            <input type="color" value={form.color} onChange={(event) => onChange({ ...form, color: event.target.value })} />
          </label>
          <label className="span-full">
            Descripción
            <textarea value={form.description} placeholder="Estructura, territorio, actividad principal..." onChange={(event) => onChange({ ...form, description: event.target.value })} />
          </label>
        </div>
        <div className="actions-row">
          <button type="button" className="secondary-link" onClick={onClose}>Cancelar</button>
          <button type="button" className="primary-button" disabled={form.name.trim().length < 2} onClick={onSubmit}>Crear organización</button>
        </div>
      </section>
    </div>
  );
}
