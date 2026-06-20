import { useEffect, useState } from "react";
import { useAuth } from "../../auth/auth-context";
import { EmptyState, RoleBadge, SkeletonBlock } from "../../components/ui";
import { apiRequest, type PaginationMeta } from "../../services/api";
import type { RoleType } from "../../types/sadoj";
import { formatAuditAction } from "../../utils/auditFormat";
import { shortDateTime } from "../../utils/labels";

interface AdminAuditLog {
  id: string;
  userId: string;
  user: {
    id: string;
    displayName: string;
    role: RoleType;
    avatar: string | null;
  };
  action: string;
  entity: string;
  entityId: string | null;
  meta: Record<string, unknown> | null;
  createdAt: string;
}

export function AuditLogPage(): JSX.Element {
  const { accessToken } = useAuth();
  const [logs, setLogs] = useState<AdminAuditLog[] | null>(null);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [filters, setFilters] = useState({ action: "", entity: "" });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async (): Promise<void> => {
      const params = new URLSearchParams({ limit: "50" });
      if (filters.action.trim().length > 0) params.set("action", filters.action.trim());
      if (filters.entity.trim().length > 0) params.set("entity", filters.entity.trim());

      const result = await apiRequest<AdminAuditLog[]>(`/api/admin/audit?${params.toString()}`, {}, accessToken);

      if (result.error) {
        setErrorMessage(result.message);
        return;
      }

      setLogs(result.data);
      setMeta(result.meta ?? null);
    };

    void load();
  }, [accessToken, filters]);

  const setFilter = (field: keyof typeof filters, value: string): void => {
    setFilters((current) => ({ ...current, [field]: value }));
  };

  if (errorMessage !== null) return <EmptyState title={errorMessage} />;
  if (logs === null) return <SkeletonBlock height={420} />;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Trazabilidad</p>
          <h1>Auditoría</h1>
        </div>
      </div>
      <section className="panel form-grid">
        <label>
          Acción
          <input value={filters.action} onChange={(event) => setFilter("action", event.target.value)} placeholder="CREATE, UPDATE..." />
        </label>
        <label>
          Entidad
          <input value={filters.entity} onChange={(event) => setFilter("entity", event.target.value)} placeholder="Document, User..." />
        </label>
      </section>
      <section className="panel table-wrap">
        {logs.length === 0 ? (
          <EmptyState title="No hay eventos de auditoría con esos filtros." />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Usuario</th>
                <th>Evento</th>
                <th>Entidad</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const formatted = formatAuditAction({ action: log.action, meta: log.meta });

                return (
                  <tr key={log.id}>
                    <td>{shortDateTime(log.createdAt)}</td>
                    <td>
                      <div className="document-author-cell">
                        <span>{log.user.displayName}</span>
                        <RoleBadge role={log.user.role} />
                      </div>
                    </td>
                    <td>{formatted.label}</td>
                    <td><span className="case-number">{log.entity}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {meta !== null ? <p className="muted">Total: {meta.total}</p> : null}
      </section>
    </div>
  );
}
