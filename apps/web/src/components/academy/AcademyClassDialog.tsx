import { useState, type FormEvent } from "react";
import type { AcademyClassInput } from "../../hooks/useAcademy";
import type { AcademyClass } from "../../types/sadoj";

export function AcademyClassDialog({ academyClass, onClose, onSave }: { academyClass: AcademyClass; onClose: () => void; onSave: (input: AcademyClassInput) => Promise<string | null> }): JSX.Element {
  const [title, setTitle] = useState(academyClass.title);
  const [description, setDescription] = useState(academyClass.description ?? "");
  const [scheduledAt, setScheduledAt] = useState(toLocalDateTime(academyClass.scheduledAt));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const input: AcademyClassInput = { title: title.trim(), description: description.trim() === "" ? null : description.trim(), scheduledAt: scheduledAt === "" ? null : new Date(scheduledAt).toISOString() };
    setIsSaving(true);
    const error = await onSave(input);
    setIsSaving(false);
    if (error === null) onClose();
    else setErrorMessage(error);
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="academy-class-dialog-title">
      <form className="modal-panel" onSubmit={(event) => void handleSubmit(event)}>
        <div><p className="eyebrow">Clase {academyClass.number}</p><h2 id="academy-class-dialog-title">Configurar clase</h2></div>
        <label>Título<input required minLength={3} maxLength={160} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
        <label>Descripción<textarea rows={5} maxLength={10000} value={description} onChange={(event) => setDescription(event.target.value)} /></label>
        <label>Fecha y hora<input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} /></label>
        {errorMessage !== null ? <p className="error-message">{errorMessage}</p> : null}
        <div className="actions-row"><button type="button" className="secondary-link" onClick={onClose}>Cancelar</button><button type="submit" className="primary-button" disabled={isSaving || title.trim().length < 3}>{isSaving ? "Guardando..." : "Guardar clase"}</button></div>
      </form>
    </div>
  );
}

function toLocalDateTime(value: string | null): string {
  if (value === null) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
