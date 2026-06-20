import { ClipboardList, Scale, ShieldAlert, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/auth-context";
import { EmptyState, RoleBadge, SkeletonBlock } from "../../components/ui";
import { apiRequest } from "../../services/api";
import type { RoleType } from "../../types/sadoj";
import { formatAuditAction } from "../../utils/auditFormat";
import { shortDateTime } from "../../utils/labels";

interface AdminAuditUser {
  id: string;
  displayName: string;
  role: RoleType;
  avatar: string | null;
}

interface AdminAuditLog {
  id: string;
  userId: string;
  user: AdminAuditUser;
  action: string;
  entity: string;
  entityId: string | null;
  meta: Record<string, unknown> | null;
  createdAt: string;
}

interface AdminRoleStat {
  role: RoleType;
  label: string;
  level: number;
  users: number;
}

interface AdminStats {
  users: { total: number; active: number; inactive: number };
  investigations: { total: number; active: number };
  sanctions: { total: number; active: number };
  audit: { last24h: number };
  roles: AdminRoleStat[];
  recentAudit: AdminAuditLog[];
}

export function AdminDashboardPage(): JSX.Element {
  const { accessToken, hasPermission } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async (): Promise<void> => {
      const result = await apiRequest<AdminStats>("/api/admin/stats", {}, accessToken);

      if (result.error) {
        setErrorMessage(result.message);
        return;
      }

      setStats(result.data);
    };

    void load();
  }, [accessToken]);

  if (errorMessage !== null) return <EmptyState title={errorMessage} />;
  if (stats === null) return <SkeletonBlock height={420} />;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Centro administrativo</p>
          <h1>Administración</h1>
        </div>
      </div>
      <section className="stats-grid">
        <AdminStatCard icon={<Users size={22} />} label="Fiscales activos" value={stats.users.active} detail={`${stats.users.total} registrados`} />
        <AdminStatCard icon={<ClipboardList size={22} />} label="Investigaciones activas" value={stats.investigations.active} detail={`${stats.investigations.total} totales`} />
        <AdminStatCard icon={<ShieldAlert size={22} />} label="Sanciones activas" value={stats.sanctions.active} detail={`${stats.sanctions.total} históricas`} />
        <AdminStatCard icon={<Scale size={22} />} label="Auditoría 24 h" value={stats.audit.last24h} detail="eventos recientes" />
      </section>
      <section className="admin-grid">
        <article className="panel stack">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Subsecciones</p>
              <h2>Herramientas de administración</h2>
            </div>
          </div>
          <div className="admin-link-grid">
            {hasPermission("MANAGE_USERS") ? <AdminLink to="/fiscales" title="Fiscales" description="Alta, edición y revisión del personal." /> : null}
            {hasPermission("MANAGE_ROLES") ? <AdminLink to="/admin/roles" title="Roles y permisos" description="Matriz de permisos por rango." /> : null}
            {hasPermission("VIEW_AUDIT_LOG") ? <AdminLink to="/admin/auditoria" title="Auditoría" description="Trazabilidad de acciones del sistema." /> : null}
            {hasPermission("MANAGE_SANCTIONS") ? <AdminLink to="/admin/sanciones" title="Sanciones" description="Disciplina interna y resolución." /> : null}
          </div>
        </article>
        <article className="panel stack">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Rangos</p>
              <h2>Distribución del personal</h2>
            </div>
            {hasPermission("MANAGE_ROLES") ? <Link className="secondary-link" to="/admin/roles">Ver matriz</Link> : null}
          </div>
          <div className="compact-list">
            {stats.roles.map((role) => (
              <div className="compact-row" key={role.role}>
                <RoleBadge role={role.role} />
                <span>Nivel {role.level}</span>
                <strong>{role.users} usuario(s)</strong>
              </div>
            ))}
          </div>
        </article>
      </section>
      <section className="panel stack">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Últimos eventos</p>
            <h2>Auditoría reciente</h2>
          </div>
          {hasPermission("VIEW_AUDIT_LOG") ? <Link className="secondary-link" to="/admin/auditoria">Ver auditoría</Link> : null}
        </div>
        {stats.recentAudit.length === 0 ? (
          <EmptyState title="No hay eventos recientes." />
        ) : (
          <div className="compact-list">
            {stats.recentAudit.map((log) => {
              const formatted = formatAuditAction({ action: log.action, meta: log.meta });

              return (
                <div className="compact-row" key={log.id}>
                  <strong>{log.user.displayName}</strong>
                  <span>{formatted.label}</span>
                  <small>{shortDateTime(log.createdAt)}</small>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function AdminStatCard({ icon, label, value, detail }: { icon: JSX.Element; label: string; value: number; detail: string }): JSX.Element {
  return (
    <article className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
        <small>{detail}</small>
      </div>
    </article>
  );
}

function AdminLink({ to, title, description }: { to: string; title: string; description: string }): JSX.Element {
  return (
    <Link className="admin-link-card" to={to}>
      <strong>{title}</strong>
      <span>{description}</span>
    </Link>
  );
}
