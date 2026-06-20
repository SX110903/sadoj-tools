import { Check, CheckCheck, Trash2 } from "lucide-react";
import { formatDistanceToNow, isThisWeek, isToday, isYesterday } from "date-fns";
import { es } from "date-fns/locale";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/auth-context";
import { notificationIcon } from "../../components/notifications/NotificationBell";
import { EmptyState, SkeletonBlock } from "../../components/ui";
import { apiRequest } from "../../services/api";
import type { NotificationItem, NotificationType } from "../../types/sadoj";

const NOTIFICATION_TYPES: readonly NotificationType[] = [
  "INVESTIGATION_ASSIGNED",
  "INVESTIGATION_UPDATED",
  "DOCUMENT_SIGNED",
  "DOCUMENT_TO_SIGN",
  "WARRANT_APPROVED",
  "WARRANT_REJECTED",
  "SANCTION_ISSUED",
  "MENTION",
  "NOTE_ADDED"
];

type ReadFilter = "all" | "unread";

export function NotificationsPage(): JSX.Element {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[] | null>(null);
  const [readFilter, setReadFilter] = useState<ReadFilter>("all");
  const [typeFilter, setTypeFilter] = useState<NotificationType | "all">("all");
  const groups = useMemo(() => groupNotifications(notifications ?? []), [notifications]);

  const loadNotifications = async (): Promise<void> => {
    const params = new URLSearchParams({ limit: "100" });
    if (readFilter === "unread") params.set("read", "false");
    if (typeFilter !== "all") params.set("type", typeFilter);

    const result = await apiRequest<NotificationItem[]>(`/api/notifications?${params.toString()}`, {}, accessToken);
    if (!result.error) setNotifications(result.data);
  };

  useEffect(() => {
    setNotifications(null);
    void loadNotifications();
  }, [accessToken, readFilter, typeFilter]);

  const markRead = async (notification: NotificationItem): Promise<void> => {
    const result = await apiRequest<NotificationItem>(`/api/notifications/${notification.id}/read`, { method: "PATCH", body: "{}" }, accessToken);
    if (!result.error) {
      setNotifications((current) => (current ?? []).map((item) => (item.id === notification.id ? result.data : item)));
    }
  };

  const deleteNotification = async (notification: NotificationItem): Promise<void> => {
    const result = await apiRequest<{ deleted: boolean }>(`/api/notifications/${notification.id}`, { method: "DELETE" }, accessToken);
    if (!result.error) {
      setNotifications((current) => (current ?? []).filter((item) => item.id !== notification.id));
    }
  };

  const markAllRead = async (): Promise<void> => {
    const result = await apiRequest<{ updated: number }>("/api/notifications/read-all", { method: "PATCH", body: "{}" }, accessToken);
    if (!result.error) {
      setNotifications((current) => (current ?? []).map((item) => ({ ...item, read: true })));
    }
  };

  const openNotification = async (notification: NotificationItem): Promise<void> => {
    if (!notification.read) {
      await markRead(notification);
    }

    if (notification.link !== null) {
      navigate(notification.link);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Centro de avisos</p>
          <h1>Notificaciones</h1>
        </div>
        <button type="button" className="secondary-link" onClick={() => void markAllRead()}>
          <CheckCheck size={16} />
          Marcar todas como leÃ­das
        </button>
      </div>

      <section className="panel notification-filters">
        <div className="segmented-control">
          <button type="button" className={readFilter === "all" ? "active" : ""} onClick={() => setReadFilter("all")}>Todas</button>
          <button type="button" className={readFilter === "unread" ? "active" : ""} onClick={() => setReadFilter("unread")}>No leÃ­das</button>
        </div>
        <label>
          Tipo
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as NotificationType | "all")}>
            <option value="all">Todos los tipos</option>
            {NOTIFICATION_TYPES.map((type) => (
              <option key={type} value={type}>{notificationTypeLabel(type)}</option>
            ))}
          </select>
        </label>
      </section>

      {notifications === null ? <SkeletonBlock height={360} /> : null}
      {notifications !== null && notifications.length === 0 ? <EmptyState title="No hay notificaciones." /> : null}
      {notifications !== null && notifications.length > 0 ? (
        <div className="notification-page-list">
          {groups.map((group) => (
            <section key={group.title} className="panel notification-group">
              <h2>{group.title}</h2>
              {group.items.map((notification) => (
                <article key={notification.id} className={notification.read ? "notification-row" : "notification-row unread"}>
                  <button type="button" className="notification-row-main" onClick={() => void openNotification(notification)}>
                    {notificationIcon(notification.type)}
                    <span>
                      <strong>{notification.title}</strong>
                      <small>{notification.message}</small>
                      <em>{notificationTypeLabel(notification.type)} · {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: es })}</em>
                    </span>
                  </button>
                  <div className="toolbar">
                    {!notification.read ? (
                      <button type="button" className="icon-button" aria-label="Marcar leÃ­da" onClick={() => void markRead(notification)}>
                        <Check size={16} />
                      </button>
                    ) : null}
                    <button type="button" className="icon-button" aria-label="Eliminar notificaciÃ³n" onClick={() => void deleteNotification(notification)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </article>
              ))}
            </section>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function groupNotifications(notifications: readonly NotificationItem[]): Array<{ title: string; items: NotificationItem[] }> {
  const today: { title: string; items: NotificationItem[] } = { title: "Hoy", items: [] };
  const yesterday: { title: string; items: NotificationItem[] } = { title: "Ayer", items: [] };
  const thisWeek: { title: string; items: NotificationItem[] } = { title: "Esta semana", items: [] };
  const previous: { title: string; items: NotificationItem[] } = { title: "Anteriores", items: [] };

  notifications.forEach((notification) => {
    const createdAt = new Date(notification.createdAt);
    if (isToday(createdAt)) today.items.push(notification);
    else if (isYesterday(createdAt)) yesterday.items.push(notification);
    else if (isThisWeek(createdAt, { locale: es })) thisWeek.items.push(notification);
    else previous.items.push(notification);
  });

  return [today, yesterday, thisWeek, previous].filter((group) => group.items.length > 0);
}

function notificationTypeLabel(type: NotificationType): string {
  const labels: Readonly<Record<NotificationType, string>> = {
    INVESTIGATION_ASSIGNED: "AsignaciÃ³n",
    INVESTIGATION_UPDATED: "InvestigaciÃ³n actualizada",
    DOCUMENT_SIGNED: "Documento firmado",
    DOCUMENT_TO_SIGN: "Firma pendiente",
    WARRANT_APPROVED: "Orden aprobada",
    WARRANT_REJECTED: "Orden rechazada",
    SANCTION_ISSUED: "SanciÃ³n",
    MENTION: "MenciÃ³n",
    NOTE_ADDED: "Nota nueva"
  };

  return labels[type];
}
