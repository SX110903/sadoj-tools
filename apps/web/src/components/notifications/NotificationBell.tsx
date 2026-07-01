import { Bell, CheckCheck, FileSignature, FileText, Gavel, MessageSquareText, ShieldAlert, Trash2, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io, type Socket } from "socket.io-client";
import { toast } from "sonner";
import { useAuth } from "../../auth/auth-context";
import { apiRequest } from "../../services/api";
import type { NotificationItem, NotificationType } from "../../types/sadoj";

interface NotificationCount {
  count: number;
}

interface NotificationServerToClientEvents {
  notification: (payload: NotificationItem) => void;
  "notification-count": (payload: NotificationCount) => void;
  error: (payload: { code: string; message: string }) => void;
}

interface NotificationClientToServerEvents {
  ping: () => void;
}

type NotificationSocket = Socket<NotificationServerToClientEvents, NotificationClientToServerEvents>;

const SOCKET_URL = "http://127.0.0.1:3000/notifications";

export function NotificationBell(): JSX.Element {
  const { accessToken, refreshUser } = useAuth();
  const navigate = useNavigate();
  const socketRef = useRef<NotificationSocket | null>(null);
  const connectionWarnedRef = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadCount = async (): Promise<void> => {
    const result = await apiRequest<NotificationCount>("/api/notifications/unread-count", {}, accessToken);
    if (!result.error) setCount(result.data.count);
  };

  const loadNotifications = async (): Promise<void> => {
    setIsLoading(true);
    const result = await apiRequest<NotificationItem[]>("/api/notifications?limit=8", {}, accessToken);
    if (!result.error) setNotifications(result.data);
    setIsLoading(false);
  };

  useEffect(() => {
    if (accessToken === null) return;

    void loadCount();
    const socket: NotificationSocket = io(SOCKET_URL, {
      auth: { token: accessToken },
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelayMax: 10_000
    });

    socketRef.current = socket;
    socket.io.on("reconnect_attempt", () => {
      socket.auth = { token: accessToken };
    });
    socket.on("connect", () => {
      connectionWarnedRef.current = false;
      void loadCount();
    });
    socket.on("notification", (notification) => {
      setNotifications((current) => [notification, ...current.filter((item) => item.id !== notification.id)].slice(0, 8));
      if (!notification.read) {
        toast(notification.title, { description: notification.message });
      }
    });
    socket.on("notification-count", (payload) => setCount(payload.count));
    socket.on("error", (payload) => toast.error(payload.message));
    socket.on("connect_error", () => {
      if (!connectionWarnedRef.current) {
        toast.error("No se pudo conectar con notificaciones. Reintentando...");
        connectionWarnedRef.current = true;
      }
      void refreshUser();
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken]);

  const toggleOpen = (): void => {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    if (nextOpen) void loadNotifications();
  };

  const handleNotificationClick = async (notification: NotificationItem): Promise<void> => {
    if (!notification.read) {
      const result = await apiRequest<NotificationItem>(`/api/notifications/${notification.id}/read`, { method: "PATCH", body: "{}" }, accessToken);
      if (!result.error) {
        setNotifications((current) => current.map((item) => (item.id === notification.id ? result.data : item)));
        setCount((current) => Math.max(0, current - 1));
      }
    }

    setIsOpen(false);
    if (notification.link !== null) {
      navigate(notification.link);
    }
  };

  const markAllRead = async (): Promise<void> => {
    const result = await apiRequest<{ updated: number }>("/api/notifications/read-all", { method: "PATCH", body: "{}" }, accessToken);
    if (!result.error) {
      setCount(0);
      setNotifications((current) => current.map((item) => ({ ...item, read: true })));
    }
  };

  return (
    <div className="notification-bell">
      <button type="button" className="icon-button notification-trigger" aria-label="Notificaciones" onClick={toggleOpen}>
        <Bell size={18} />
        {count > 0 ? <span className="notification-badge">{count > 99 ? "99+" : count}</span> : null}
      </button>
      {isOpen ? (
        <div className="notification-popover">
          <div className="notification-popover-header">
            <strong>Notificaciones</strong>
            <button type="button" className="secondary-link compact-button" onClick={() => void markAllRead()}>
              <CheckCheck size={14} />
              Marcar todas
            </button>
          </div>
          <div className="notification-list">
            {isLoading ? <p className="muted">Cargando notificaciones...</p> : null}
            {!isLoading && notifications.length === 0 ? <p className="muted">No tienes notificaciones.</p> : null}
            {notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                className={notification.read ? "notification-item" : "notification-item unread"}
                onClick={() => void handleNotificationClick(notification)}
              >
                {notificationIcon(notification.type)}
                <span>
                  <strong>{notification.title}</strong>
                  <small>{notification.message}</small>
                  <em>{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: es })}</em>
                </span>
                {!notification.read ? <i aria-label="No leída" /> : null}
              </button>
            ))}
          </div>
          <button type="button" className="notification-footer" onClick={() => { setIsOpen(false); navigate("/notificaciones"); }}>
            Ver todas
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function notificationIcon(type: NotificationType): JSX.Element {
  if (type === "INVESTIGATION_ASSIGNED" || type === "INVESTIGATION_UPDATED") return <Users size={17} />;
  if (type === "DOCUMENT_SIGNED") return <FileSignature size={17} />;
  if (type === "DOCUMENT_TO_SIGN") return <FileText size={17} />;
  if (type === "WARRANT_APPROVED" || type === "WARRANT_REJECTED") return <Gavel size={17} />;
  if (type === "SANCTION_ISSUED") return <ShieldAlert size={17} />;
  if (type === "MENTION" || type === "NOTE_ADDED") return <MessageSquareText size={17} />;
  return <Trash2 size={17} />;
}
