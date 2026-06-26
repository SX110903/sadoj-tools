import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth, type UserSession } from "../../auth/auth-context";
import { EmptyState, RetryButton, RoleBadge, SkeletonBlock } from "../../components/ui";
import { apiRequest, type PaginationMeta } from "../../services/api";

export function FiscalesListPage(): JSX.Element {
  const { accessToken, hasPermission } = useAuth();
  const [users, setUsers] = useState<UserSession[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadUsers = async (): Promise<void> => {
      setIsLoading(true);
      const result = await apiRequest<UserSession[]>("/api/users?limit=50", {}, accessToken);

      if (result.error) {
        setErrorMessage(result.message);
      } else {
        setUsers(result.data);
        setMeta(result.meta ?? null);
      }

      setIsLoading(false);
    };

    void loadUsers();
  }, [accessToken]);

  if (isLoading) {
    return (
      <div className="page">
        <SkeletonBlock height={360} />
      </div>
    );
  }

  if (errorMessage !== null) {
    return <EmptyState title={errorMessage} action={<RetryButton />} />;
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Gestión de fiscales</p>
          <h1>Fiscales</h1>
        </div>
        {hasPermission("MANAGE_USERS") ? (
          <Link className="primary-link" to="/fiscales/nuevo">
            <Plus size={18} />
            Nuevo Fiscal
          </Link>
        ) : null}
      </div>
      <section className="panel">
        {users.length === 0 ? (
          <EmptyState title="No hay fiscales registrados." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Avatar + Nombre</th>
                  <th>Nº Placa</th>
                  <th>Rol</th>
                  <th>División</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="person-cell">
                        {user.avatar !== null ? <img src={user.avatar} alt="" /> : <div className="avatar small">{user.displayName.slice(0, 1)}</div>}
                        <strong>{user.displayName}</strong>
                      </div>
                    </td>
                    <td className="case-number">{user.badgeNumber ?? "Sin placa"}</td>
                    <td><RoleBadge role={user.role} /></td>
                    <td>{user.division ?? "Sin división"}</td>
                    <td><span className={user.active ? "badge status-active" : "badge status-inactive"}>{user.active ? "Activo" : "Inactivo"}</span></td>
                    <td><Link to={`/fiscales/${user.id}`}>Ver detalle</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {meta !== null ? <p className="muted">Total: {meta.total}</p> : null}
      </section>
    </div>
  );
}
