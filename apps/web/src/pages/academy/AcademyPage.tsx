import { GraduationCap, Plus } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../auth/auth-context";
import { AcademyAttendanceDialog } from "../../components/academy/AcademyAttendanceDialog";
import { AcademyClassDialog } from "../../components/academy/AcademyClassDialog";
import { AcademyClassesSection } from "../../components/academy/AcademyClassesSection";
import { AcademyLibrary } from "../../components/academy/AcademyLibrary";
import { AcademyOverview, type AcademyView } from "../../components/academy/AcademyOverview";
import { AcademyRecordPanel } from "../../components/academy/AcademyRecordPanel";
import { PublishAcademyContentDialog } from "../../components/academy/PublishAcademyContentDialog";
import { EmptyState, RetryButton, SkeletonBlock } from "../../components/ui";
import { useAcademyClasses, useAcademyContent, useAcademyRecord, type AcademyContentInput } from "../../hooks/useAcademy";
import type { AcademyClass } from "../../types/sadoj";

const VIEWS: ReadonlyArray<{ value: AcademyView; label: string }> = [
  { value: "home", label: "Inicio" },
  { value: "classes", label: "Clases" },
  { value: "library", label: "Material de estudio" },
  { value: "record", label: "Mi registro académico" }
];

export function AcademyPage(): JSX.Element {
  const { user, hasPermission } = useAuth();
  const contentState = useAcademyContent();
  const classesState = useAcademyClasses();
  const recordState = useAcademyRecord();
  const [view, setView] = useState<AcademyView>("home");
  const [publishOpen, setPublishOpen] = useState(false);
  const [attendanceClass, setAttendanceClass] = useState<AcademyClass | null>(null);
  const [editClass, setEditClass] = useState<AcademyClass | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const canPublish = hasPermission("PUBLISH_ACADEMY");
  const canManage = hasPermission("MANAGE_ACADEMY");

  if (contentState.isLoading || classesState.isLoading || recordState.isLoading) return <div className="page"><SkeletonBlock height={520} /></div>;
  const loadError = contentState.errorMessage ?? classesState.errorMessage ?? recordState.errorMessage;
  if (loadError !== null) return <div className="page"><EmptyState title={loadError} action={<RetryButton onRetry={() => void refreshAll(contentState.refresh, classesState.refresh, recordState.refresh)} />} /></div>;

  const handlePublish = async (input: AcademyContentInput, file: File | null): Promise<string | null> => {
    const error = await contentState.publishContent(input, file);
    if (error === null) await classesState.refresh();
    return error;
  };

  const handleDelete = async (id: string): Promise<void> => {
    if (!window.confirm("¿Eliminar este contenido de Academia?")) return;
    const error = await contentState.deleteContent(id);
    setActionError(error);
    if (error === null) await classesState.refresh();
  };

  return (
    <div className="page academy-page">
      <div className="page-header">
        <div className="academy-title"><span><GraduationCap size={26} /></span><div><p className="eyebrow">Formación interna</p><h1>Academia</h1></div></div>
        {canPublish ? <button type="button" className="primary-button" onClick={() => setPublishOpen(true)}><Plus size={17} />Publicar contenido</button> : null}
      </div>
      <nav className="tab-list academy-nav" aria-label="Secciones de Academia">
        {VIEWS.map((item) => <button key={item.value} type="button" className={view === item.value ? "active" : ""} onClick={() => setView(item.value)}>{item.label}</button>)}
      </nav>
      {actionError !== null ? <p className="error-message">{actionError}</p> : null}
      {view === "home" ? <AcademyOverview classes={classesState.classes} content={contentState.content} record={recordState.record} onNavigate={setView} /> : null}
      {view === "classes" ? <AcademyClassesSection classes={classesState.classes} canManage={canManage} canPublish={canPublish} currentUserId={user?.id ?? null} onAttendance={setAttendanceClass} onEditClass={setEditClass} onDeleteContent={handleDelete} /> : null}
      {view === "library" ? <AcademyLibrary content={contentState.content} currentUserId={user?.id ?? null} canPublish={canPublish} onDelete={handleDelete} /> : null}
      {view === "record" && recordState.record !== null ? <AcademyRecordPanel record={recordState.record} /> : null}
      {publishOpen ? <PublishAcademyContentDialog classes={classesState.classes} onClose={() => setPublishOpen(false)} onPublish={handlePublish} /> : null}
      {editClass !== null ? <AcademyClassDialog academyClass={editClass} onClose={() => setEditClass(null)} onSave={(input) => classesState.updateClass(editClass.id, input)} /> : null}
      {attendanceClass !== null ? <AcademyAttendanceDialog academyClass={attendanceClass} onClose={() => setAttendanceClass(null)} onSaved={recordState.refresh} /> : null}
    </div>
  );
}

async function refreshAll(...refreshers: Array<() => Promise<void>>): Promise<void> {
  await Promise.all(refreshers.map((refresh) => refresh()));
}
