import { Activity, AlertTriangle, Building2, FileText, FolderOpen, Gavel, MapPin, ShieldAlert, UserPlus, UserSearch } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../../auth/auth-context";
import { StatusBadge } from "../../components/StatusBadge";
import { EmptyState, RetryButton, SkeletonBlock } from "../../components/ui";
import { apiRequest } from "../../services/api";
import { formatAuditAction, type AuditCategory } from "../../utils/auditFormat";
import { roleLabel } from "../../utils/labels";

interface DashboardStats {
  activeInvestigations: number;
  watchedSubjects: number;
  pendingWarrants: number;
  myActivity: number;
}

interface DashboardParticipant {
  id: string;
  user: {
    id: string;
    displayName: string;
    avatar: string | null;
    role: string;
  };
}

interface DashboardInvestigation {
  id: string;
  caseNumber: string;
  title: string;
  status: string;
  priority: string;
  type: string;
  leadFiscal: {
    displayName: string;
    role: string;
    avatar: string | null;
  };
  participants: DashboardParticipant[];
  _count: {
    participants: number;
    subjects: number;
  };
}

interface DashboardActivity {
  id: string;
  action: string;
  entity: string;
  meta: Record<string, unknown> | null;
  createdAt: string;
  user: {
    displayName: string;
    role: string;
    avatar: string | null;
  };
}

interface DashboardPersonnel {
  id: string;
  displayName: string;
  role: string;
  avatar: string | null;
  badgeNumber: string | null;
  activeInvestigations: number;
  documentsLast30Days: number;
  activeSanctions: number;
  lastLoginAt: string | null;
}

interface DashboardPayload {
  stats: DashboardStats;
  recentInvestigations: DashboardInvestigation[];
  recentActivity: DashboardActivity[];
  personnel: DashboardPersonnel[];
}

type StatKey = keyof DashboardStats;

const STAT_CARDS = [
  {
    key: "activeInvestigations",
    label: "Investigaciones activas",
    context: "Expedientes abiertos o en curso",
    icon: <FolderOpen size={24} />,
    tone: "blue"
  },
  {
    key: "watchedSubjects",
    label: "Sujetos vigilados",
    context: "Personas bajo observación",
    icon: <UserSearch size={24} />,
    tone: "orange"
  },
  {
    key: "pendingWarrants",
    label: "Órdenes pendientes",
    context: "Solicitudes por resolver",
    icon: <AlertTriangle size={24} />,
    tone: "yellow"
  },
  {
    key: "myActivity",
    label: "Mi actividad",
    context: "Acciones registradas en 24 h",
    icon: <Activity size={24} />,
    tone: "green"
  }
] as const satisfies ReadonlyArray<{ key: StatKey; label: string; context: string; icon: JSX.Element; tone: string }>;

const ACTIVITY_ICONS: Readonly<Record<AuditCategory, JSX.Element>> = {
  case: <FolderOpen size={16} />,
  map: <MapPin size={16} />,
  subject: <UserSearch size={16} />,
  warrant: <Gavel size={16} />,
  organization: <Building2 size={16} />,
  sanction: <ShieldAlert size={16} />,
  user: <UserPlus size={16} />,
  property: <Building2 size={16} />,
  file: <FileText size={16} />,
  system: <Activity size={16} />
};

export function DashboardPage(): JSX.Element {
  const { accessToken } = useAuth();
  const [payload, setPayload] = useState<DashboardPayload | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboard = async (): Promise<void> => {
      const result = await apiRequest<DashboardPayload>("/api/dashboard/stats", {}, accessToken);

      if (result.error) {
        setErrorMessage(result.message);
        return;
      }

      setPayload(result.data);
    };

    void loadDashboard();
  }, [accessToken]);

  if (errorMessage !== null) {
    return <EmptyState title={errorMessage} action={<RetryButton />} />;
  }

  if (payload === null) {
    return (
      <div className="page">
        <SkeletonBlock height={140} />
        <SkeletonBlock height={280} />
      </div>
    );
  }

  return (
    <div className="page dashboard-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Panel operativo</p>
          <h1>Dashboard</h1>
        </div>
      </div>
      <section className="stats-grid dashboard-stats-grid">
        {STAT_CARDS.map((card) => (
          <article className={`stat-card dashboard-stat-card stat-${card.tone}`} key={card.key}>
            <span className="stat-icon">{card.icon}</span>
            <div>
              <strong>{payload.stats[card.key]}</strong>
              <p>{card.label}</p>
              <small>{card.context}</small>
            </div>
          </article>
        ))}
      </section>
      <section className="dashboard-grid">
        <article className="panel dashboard-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Expedientes asignados</p>
              <h2>Mis últimas investigaciones</h2>
            </div>
          </div>
          {payload.recentInvestigations.length === 0 ? (
            <EmptyState title="No hay investigaciones recientes." />
          ) : (
            <div className="investigation-card-list">
              {payload.recentInvestigations.map((investigation) => (
                <Link className="investigation-card" to={`/investigaciones/${investigation.id}`} key={investigation.id}>
                  <div>
                    <span className="case-number">{investigation.caseNumber}</span>
                    <h3>{investigation.title}</h3>
                  </div>
                  <div className="badge-row">
                    <StatusBadge value={investigation.type} kind="type" />
                    <StatusBadge value={investigation.priority} kind="priority" />
                  </div>
                  <div className="investigation-card-footer">
                    <AvatarStack participants={investigation.participants} total={investigation._count.participants} />
                    <span>{investigation._count.subjects} sujeto(s)</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </article>
        <article className="panel dashboard-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Registro institucional</p>
              <h2>Actividad reciente</h2>
            </div>
          </div>
          {payload.recentActivity.length === 0 ? (
            <EmptyState title="Sin actividad reciente." />
          ) : (
            <div className="activity-list">
              {payload.recentActivity.map((activity) => {
                const formatted = formatAuditAction(activity);
                return (
                  <article className="activity-row" key={activity.id}>
                    <UserAvatar name={activity.user.displayName} avatar={activity.user.avatar} />
                    <span className={`activity-icon activity-${formatted.category}`}>{ACTIVITY_ICONS[formatted.category]}</span>
                    <div>
                      <p>
                        <strong>{activity.user.displayName}</strong>
                        <span> · {formatted.label}</span>
                      </p>
                      <small>{formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: es })}</small>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </article>
        {payload.personnel.length > 0 ? (
          <article className="panel dashboard-panel dashboard-personnel-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Supervisión interna</p>
                <h2>Personal fiscal</h2>
              </div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Fiscal</th>
                    <th>Rango</th>
                    <th>Investigaciones</th>
                    <th>Documentos 30 días</th>
                    <th>Sanciones activas</th>
                    <th>Último acceso</th>
                  </tr>
                </thead>
                <tbody>
                  {payload.personnel.map((person) => (
                    <tr key={person.id}>
                      <td>
                        <span className="personnel-cell">
                          <UserAvatar name={person.displayName} avatar={person.avatar} />
                          <span>
                            <strong>{person.displayName}</strong>
                            <small>{person.badgeNumber ?? "Sin placa"}</small>
                          </span>
                        </span>
                      </td>
                      <td>{roleLabel(person.role)}</td>
                      <td>
                        <span className="workload-cell">
                          <span>{person.activeInvestigations}</span>
                          <i className={`workload-bar workload-${workloadLevel(person.activeInvestigations)}`} />
                        </span>
                      </td>
                      <td>{person.documentsLast30Days}</td>
                      <td>{person.activeSanctions}</td>
                      <td>
                        {person.lastLoginAt !== null
                          ? formatDistanceToNow(new Date(person.lastLoginAt), { addSuffix: true, locale: es })
                          : "Sin acceso registrado"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        ) : null}
      </section>
    </div>
  );
}

function AvatarStack({ participants, total }: { participants: DashboardParticipant[]; total: number }): JSX.Element {
  return (
    <div className="avatar-stack" aria-label={`${total} participante(s)`}>
      {participants.map((participant) => (
        <UserAvatar
          key={participant.id}
          name={participant.user.displayName}
          avatar={participant.user.avatar}
          title={`${participant.user.displayName} · ${roleLabel(participant.user.role)}`}
        />
      ))}
      {total > participants.length ? <span className="avatar-overflow">+{total - participants.length}</span> : null}
    </div>
  );
}

function workloadLevel(count: number): "low" | "medium" | "high" {
  if (count >= 8) return "high";
  if (count >= 4) return "medium";
  return "low";
}

function UserAvatar({ name, avatar, title }: { name: string; avatar: string | null; title?: string }): JSX.Element {
  if (avatar !== null) {
    return <img className="avatar avatar-image small" src={avatar} alt="" title={title ?? name} />;
  }

  return <span className="avatar small" title={title ?? name}>{name.slice(0, 1)}</span>;
}
