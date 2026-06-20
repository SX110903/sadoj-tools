import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/auth-context";
import { StatusBadge } from "../../components/StatusBadge";
import { EmptyState, SkeletonBlock } from "../../components/ui";
import { apiRequest } from "../../services/api";
import type { Warrant, WarrantStatus, WarrantType } from "../../types/sadoj";
import { shortDateTime } from "../../utils/labels";

const WARRANT_STATUSES: readonly WarrantStatus[] = ["PENDING", "APPROVED", "REJECTED", "EXECUTED", "EXPIRED"];
const WARRANT_TYPES: readonly WarrantType[] = ["ALLANAMIENTO", "DETENCION", "INTERCEPCION", "INCAUTACION"];

export function WarrantsListPage(): JSX.Element {
  const { accessToken } = useAuth();
  const [warrants, setWarrants] = useState<Warrant[] | null>(null);
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async (): Promise<void> => {
      const params = new URLSearchParams({ limit: "100" });
      if (status.length > 0) params.set("status", status);
      if (type.length > 0) params.set("type", type);

      const result = await apiRequest<Warrant[]>(`/api/warrants?${params.toString()}`, {}, accessToken);

      if (result.error) {
        setErrorMessage(result.message);
        return;
      }

      setWarrants(result.data);
    };

    void load();
  }, [accessToken, status, type]);

  if (errorMessage !== null) return <EmptyState title={errorMessage} />;
  if (warrants === null) return <SkeletonBlock height={320} />;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Control judicial</p>
          <h1>Órdenes judiciales</h1>
        </div>
        <Link className="primary-link" to="/ordenes/new">
          <Plus size={16} />
          Nueva orden
        </Link>
      </div>
      <section className="panel form-grid">
        <label>
          Estado
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">Todos</option>
            {WARRANT_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label>
          Tipo
          <select value={type} onChange={(event) => setType(event.target.value)}>
            <option value="">Todos</option>
            {WARRANT_TYPES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
      </section>
      <section className="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>Número</th>
              <th>Tipo</th>
              <th>Título</th>
              <th>Investigación</th>
              <th>Solicitada por</th>
              <th>Estado</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {warrants.map((warrant) => (
              <tr key={warrant.id}>
                <td><Link className="case-number" to={`/ordenes/${warrant.id}`}>{warrant.warrantNumber}</Link></td>
                <td><StatusBadge value={warrant.type} kind="type" /></td>
                <td>{warrant.title}</td>
                <td>{warrant.investigation?.caseNumber ?? "Sin expediente"}</td>
                <td>{warrant.requestedBy?.displayName ?? "Fiscalía"}</td>
                <td><StatusBadge value={warrant.status} /></td>
                <td>{shortDateTime(warrant.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
