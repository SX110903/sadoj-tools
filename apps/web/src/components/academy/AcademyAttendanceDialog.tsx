import { useEffect, useState } from "react";
import { useClassAttendance } from "../../hooks/useAcademy";
import type { AcademyClass } from "../../types/sadoj";
import { EmptyState, SkeletonBlock } from "../ui";

export function AcademyAttendanceDialog({ academyClass, onClose, onSaved }: { academyClass: AcademyClass; onClose: () => void; onSaved: () => Promise<void> }): JSX.Element {
  const { roster, errorMessage, isLoading, save } = useClassAttendance(academyClass.id);
  const [presence, setPresence] = useState<Readonly<Record<string, boolean>>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (roster === null) return;
    setPresence(Object.fromEntries(roster.students.map((student) => [student.id, student.attendance?.present ?? false])));
  }, [roster]);

  const handleSave = async (): Promise<void> => {
    if (roster === null) return;
    setIsSaving(true);
    const error = await save(roster.students.map((student) => ({ userId: student.id, present: presence[student.id] ?? false })));
    setIsSaving(false);
    setSaveError(error);
    if (error === null) { await onSaved(); onClose(); }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="attendance-dialog-title">
      <section className="modal-panel academy-attendance-dialog">
        <div className="actions-row"><div><p className="eyebrow">Clase {academyClass.number}</p><h2 id="attendance-dialog-title">Pasar lista</h2></div><button type="button" className="secondary-link compact-button" onClick={onClose}>Cerrar</button></div>
        {isLoading ? <SkeletonBlock height={220} /> : null}
        {!isLoading && errorMessage !== null ? <p className="error-message">{errorMessage}</p> : null}
        {!isLoading && roster !== null && roster.students.length === 0 ? <EmptyState title="No hay alumnos de Legal Staff activos." /> : null}
        {roster !== null && roster.students.length > 0 ? (
          <div className="academy-attendance-list">
            {roster.students.map((student) => (
              <label key={student.id}><input type="checkbox" checked={presence[student.id] ?? false} onChange={(event) => setPresence((current) => ({ ...current, [student.id]: event.target.checked }))} /><span><strong>{student.displayName}</strong><small>{student.badgeNumber ?? student.username}</small></span></label>
            ))}
          </div>
        ) : null}
        {saveError !== null ? <p className="error-message">{saveError}</p> : null}
        <div className="actions-row"><button type="button" className="secondary-link" onClick={onClose}>Cancelar</button><button type="button" className="primary-button" disabled={isSaving || roster === null || roster.students.length === 0} onClick={() => void handleSave()}>{isSaving ? "Guardando..." : "Guardar asistencia"}</button></div>
      </section>
    </div>
  );
}
