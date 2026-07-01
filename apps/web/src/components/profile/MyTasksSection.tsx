import { CheckCircle2, ExternalLink, PlayCircle, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/auth-context";
import { apiRequest } from "../../services/api";
import type { Task, TaskPriority, TaskStatus } from "../../types/sadoj";
import { formatHubDate } from "../../utils/labels";
import { EmptyState, SkeletonBlock } from "../ui";

const STATUS_LABELS: Readonly<Record<TaskStatus, string>> = {
  PENDING: "Pendiente",
  IN_PROGRESS: "En progreso",
  DONE: "Hecha",
  CANCELLED: "Cancelada"
};

const PRIORITY_LABELS: Readonly<Record<TaskPriority, string>> = {
  LOW: "Baja",
  NORMAL: "Normal",
  HIGH: "Alta",
  URGENT: "Urgente"
};

const STATUS_ORDER: readonly TaskStatus[] = ["PENDING", "IN_PROGRESS", "DONE", "CANCELLED"];

export function MyTasksSection(): JSX.Element {
  const { accessToken } = useAuth();
  const [tasks, setTasks] = useState<Task[] | null>(null);

  const load = useCallback(async (): Promise<void> => {
    const result = await apiRequest<Task[]>("/api/tasks/mine", { suppressToast: true }, accessToken);
    setTasks(result.error ? [] : result.data);
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const changeStatus = async (taskId: string, status: TaskStatus): Promise<void> => {
    const result = await apiRequest<Task>(`/api/tasks/${encodeURIComponent(taskId)}`, { method: "PATCH", body: JSON.stringify({ status }) }, accessToken);
    if (!result.error) {
      await load();
    }
  };

  return (
    <section className="panel stack">
      <div>
        <p className="eyebrow">Bandeja personal</p>
        <h2>Mis tareas</h2>
      </div>
      {tasks === null ? <SkeletonBlock height={160} /> : null}
      {tasks !== null && tasks.length === 0 ? <EmptyState title="No tienes tareas asignadas." /> : null}
      {tasks !== null && tasks.length > 0
        ? STATUS_ORDER.map((status) => {
            const group = tasks.filter((task) => task.status === status);
            if (group.length === 0) return null;

            return (
              <div className="task-group" key={status}>
                <h3 className="task-group-title">{STATUS_LABELS[status]} <span className="muted">({group.length})</span></h3>
                <div className="compact-list">
                  {group.map((task) => (
                    <article className="compact-row task-row" key={task.id}>
                      <div className="actions-row">
                        <strong>{task.title}</strong>
                        <span className={`badge priority-${task.priority.toLowerCase()}`}>{PRIORITY_LABELS[task.priority]}</span>
                      </div>
                      {task.description !== null ? <p>{task.description}</p> : null}
                      <span className="muted">
                        Asignada por {task.assignedBy.displayName}
                        {task.dueDate !== null ? ` · vence ${formatHubDate(task.dueDate)}` : ""}
                      </span>
                      <div className="actions-row task-actions">
                        {task.investigation !== null ? (
                          <Link className="secondary-link compact-button" to={`/investigaciones/${task.investigation.id}`}>
                            <ExternalLink size={14} />
                            {task.investigation.caseNumber}
                          </Link>
                        ) : null}
                        {task.status === "PENDING" ? (
                          <button type="button" className="secondary-link compact-button" onClick={() => void changeStatus(task.id, "IN_PROGRESS")}>
                            <PlayCircle size={14} />
                            Empezar
                          </button>
                        ) : null}
                        {task.status === "PENDING" || task.status === "IN_PROGRESS" ? (
                          <button type="button" className="primary-button compact-button" onClick={() => void changeStatus(task.id, "DONE")}>
                            <CheckCircle2 size={14} />
                            Marcar hecha
                          </button>
                        ) : null}
                        {task.status === "DONE" ? (
                          <button type="button" className="secondary-link compact-button" onClick={() => void changeStatus(task.id, "IN_PROGRESS")}>
                            <RotateCcw size={14} />
                            Reabrir
                          </button>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            );
          })
        : null}
    </section>
  );
}
