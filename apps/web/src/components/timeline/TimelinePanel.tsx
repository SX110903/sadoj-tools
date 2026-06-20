import { ClipboardList, FileText, FolderOpen, Gavel, MapPin, MessageSquareText, Paperclip, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/auth-context";
import { apiRequest } from "../../services/api";
import type { TimelineEvent, TimelineEventType } from "../../types/sadoj";
import { shortDateTime } from "../../utils/labels";
import { EmptyState, SkeletonBlock } from "../ui";

interface TimelinePanelProps {
  endpoint: string;
}

export function TimelinePanel({ endpoint }: TimelinePanelProps): JSX.Element {
  const { accessToken } = useAuth();
  const [events, setEvents] = useState<TimelineEvent[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadTimeline = async (): Promise<void> => {
      setEvents(null);
      setErrorMessage(null);
      const result = await apiRequest<TimelineEvent[]>(endpoint, {}, accessToken);

      if (result.error) {
        setErrorMessage(result.message);
        return;
      }

      setEvents(result.data);
    };

    void loadTimeline();
  }, [accessToken, endpoint]);

  if (errorMessage !== null) return <EmptyState title={errorMessage} />;
  if (events === null) return <SkeletonBlock height={360} />;
  if (events.length === 0) return <EmptyState title="No hay eventos registrados." />;

  return (
    <section className="timeline-panel">
      {events.map((event) => (
        <article className="timeline-event" key={event.id}>
          <div className={`timeline-event-icon timeline-event-${event.type}`}>{iconForEvent(event.type)}</div>
          <div>
            <div className="timeline-event-heading">
              <strong>{event.title}</strong>
              <span>{shortDateTime(event.occurredAt)}</span>
            </div>
            <p>{event.description}</p>
            <div className="timeline-event-meta">
              {event.actorName !== null ? <span>{event.actorName}</span> : null}
              {event.href !== null ? (
                event.href.startsWith("/") ? (
                  <Link to={event.href}>Abrir registro</Link>
                ) : (
                  <a href={event.href} target="_blank" rel="noreferrer">
                    Abrir archivo
                  </a>
                )
              ) : null}
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}

function iconForEvent(type: TimelineEventType): JSX.Element {
  if (type === "audit") return <ShieldCheck size={16} />;
  if (type === "document") return <FileText size={16} />;
  if (type === "note") return <MessageSquareText size={16} />;
  if (type === "file") return <Paperclip size={16} />;
  if (type === "investigation") return <FolderOpen size={16} />;
  if (type === "warrant") return <Gavel size={16} />;
  if (type === "map") return <MapPin size={16} />;
  return <ClipboardList size={16} />;
}
