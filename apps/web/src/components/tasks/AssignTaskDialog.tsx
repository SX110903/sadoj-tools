import { useEffect, useState } from "react";
import { useAuth } from "../../auth/auth-context";
import { apiRequest } from "../../services/api";
import type { InvestigationListItem, Task, TaskPriority } from "../../types/sadoj";

const PRIORITIES: readonly TaskPriority[] = ["LOW", "NORMAL", "HIGH", "URGENT"];
const PRIORITY_LABELS: Readonly<Record<TaskPriority, string>> = {
  LOW: "Baja",
  NORMAL: "Normal",
  HIGH: "Alta",
  URGENT: "Urgente"
};

interface AssignTaskDialogProps {
  assigneeId: string;
  assigneeName: string;
  onClose: () => void;
  onAssigned: () => void;
}

export function AssignTaskDialog({ assigneeId, assigneeName, onClose, onAssigned }: AssignTaskDialogProps): JSX.Element {
  const { accessToken } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("NORMAL");
  const [dueDate, setDueDate] = useState("");
  const [investigationId, setInvestigationId] = useState("");
  const [investigations, setInvestigations] = useState<InvestigationListItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadInvestigations = async (): Promise<void> => {
      const result = await apiRequest<InvestigationListItem[]>("/api/investigations?limit=100", { suppressToast: true }, accessToken);
      if (!result.error) {
        setInvestigations(result.data);
      }
    };

    void loadInvestigations();
  }, [accessToken]);

  const handleSubmit = async (): Promise<void> => {
    if (title.trim().length < 3) {
      setErrorMessage("El título debe tener al menos 3 caracteres.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    const result = await apiRequest<Task>(
      "/api/tasks",
      {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() === "" ? undefined : description.trim(),
          assignedToId: assigneeId,
          priority,
          investigationId: investigationId === "" ? undefined : investigationId,
          dueDate: dueDate === "" ? undefined : new Date(dueDate).toISOString()
        })
      },
      accessToken
    );
    setIsSubmitting(false);

    if (result.error) {
      setErrorMessage(result.message);
      return;
    }

    onAssigned();
    onClose();
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <section className="modal-panel">
        <div className="actions-row">
          <div>
            <p className="eyebrow">Asignación de trabajo</p>
            <h2>Asignar tarea a {assigneeName}</h2>
          </div>
          <button type="button" className="secondary-link compact-button" onClick={onClose}>Cerrar</button>
        </div>
        <label>Título<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Revisar el expediente…" /></label>
        <label>Descripción<textarea value={description} rows={4} onChange={(event) => setDescription(event.target.value)} /></label>
        <div className="form-grid">
          <label>
            Prioridad
            <select value={priority} onChange={(event) => setPriority(event.target.value as TaskPriority)}>
              {PRIORITIES.map((value) => <option key={value} value={value}>{PRIORITY_LABELS[value]}</option>)}
            </select>
          </label>
          <label>Fecha límite<input type="datetime-local" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></label>
        </div>
        <label>
          Investigación (opcional)
          <select value={investigationId} onChange={(event) => setInvestigationId(event.target.value)}>
            <option value="">Sin investigación</option>
            {investigations.map((investigation) => (
              <option key={investigation.id} value={investigation.id}>{investigation.caseNumber} — {investigation.title}</option>
            ))}
          </select>
        </label>
        {errorMessage !== null ? <p className="error-message">{errorMessage}</p> : null}
        <div className="actions-row">
          <button type="button" className="secondary-link" onClick={onClose}>Cancelar</button>
          <button type="button" className="primary-button" disabled={isSubmitting} onClick={() => void handleSubmit()}>Asignar tarea</button>
        </div>
      </section>
    </div>
  );
}
