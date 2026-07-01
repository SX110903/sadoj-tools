import { CalendarDays, CheckSquare, Settings2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { AcademyClass } from "../../types/sadoj";
import { shortDateTime } from "../../utils/labels";
import { EmptyState } from "../ui";
import { AcademyContentCard } from "./AcademyContentCard";

interface AcademyClassesSectionProps {
  classes: AcademyClass[];
  canManage: boolean;
  canPublish: boolean;
  currentUserId: string | null;
  onAttendance: (academyClass: AcademyClass) => void;
  onDeleteContent: (id: string) => Promise<void>;
  onEditClass: (academyClass: AcademyClass) => void;
}

export function AcademyClassesSection(props: AcademyClassesSectionProps): JSX.Element {
  const [selectedId, setSelectedId] = useState(props.classes[0]?.id ?? null);
  useEffect(() => {
    if (selectedId === null && props.classes.length > 0) setSelectedId(props.classes[0]?.id ?? null);
  }, [props.classes, selectedId]);
  const selectedClass = useMemo(() => props.classes.find((item) => item.id === selectedId) ?? null, [props.classes, selectedId]);

  if (props.classes.length === 0) return <EmptyState title="Las clases aún no están definidas." />;

  return (
    <div className="academy-classes-layout">
      <aside className="academy-class-list" aria-label="Clases de Academia">
        {props.classes.map((academyClass) => (
          <button key={academyClass.id} type="button" className={academyClass.id === selectedId ? "active" : ""} onClick={() => setSelectedId(academyClass.id)}>
            <span>{academyClass.number}</span><div><strong>{academyClass.title}</strong><small>{academyClass.contents.length} materiales</small></div>
          </button>
        ))}
      </aside>
      {selectedClass !== null ? <AcademyClassDetail academyClass={selectedClass} {...props} /> : null}
    </div>
  );
}

function AcademyClassDetail({ academyClass, canManage, canPublish, currentUserId, onAttendance, onDeleteContent, onEditClass }: AcademyClassesSectionProps & { academyClass: AcademyClass }): JSX.Element {
  return (
    <section className="stack academy-class-detail">
      <div className="page-header">
        <div><p className="eyebrow">Clase {academyClass.number} de 5</p><h2>{academyClass.title}</h2></div>
        {canManage ? <div className="actions-row"><button type="button" className="secondary-link" onClick={() => onEditClass(academyClass)}><Settings2 size={16} />Configurar</button><button type="button" className="primary-button" onClick={() => onAttendance(academyClass)}><CheckSquare size={16} />Pasar lista</button></div> : null}
      </div>
      <p className="muted">{academyClass.description ?? "Sin descripción."}</p>
      <div className="academy-class-meta"><span><CalendarDays size={16} />{academyClass.scheduledAt === null ? "Fecha pendiente" : shortDateTime(academyClass.scheduledAt)}</span><span>Instructor: {academyClass.instructor?.displayName ?? "Pendiente"}</span></div>
      {academyClass.contents.length === 0 ? <EmptyState title="Esta clase todavía no tiene contenido." /> : (
        <div className="academy-content-grid">
          {academyClass.contents.map((content) => <AcademyContentCard key={content.id} content={content} canDelete={canPublish && content.publishedById === currentUserId} onDelete={onDeleteContent} />)}
        </div>
      )}
    </section>
  );
}
