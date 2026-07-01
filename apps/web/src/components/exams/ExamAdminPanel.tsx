import { Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../auth/auth-context";
import { apiRequest } from "../../services/api";
import type { ExamAssignmentSummary, ExamSummary, RoleType } from "../../types/sadoj";
import { formatHubDate, roleLabel } from "../../utils/labels";
import { EmptyState, SkeletonBlock } from "../ui";

const QUESTIONS_TEMPLATE = '[\n  { "q": "Pregunta de ejemplo", "o": ["Opción A", "Opción B", "Opción C", "Opción D"], "a": 0 }\n]';

interface AssigneeOption {
  id: string;
  displayName: string;
  role: RoleType;
  badgeNumber: string | null;
}

export function ExamAdminPanel(): JSX.Element {
  const { accessToken } = useAuth();
  const [exams, setExams] = useState<ExamSummary[] | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [manageExam, setManageExam] = useState<ExamSummary | null>(null);

  const loadExams = useCallback(async (): Promise<void> => {
    const result = await apiRequest<ExamSummary[]>("/api/exams", { suppressToast: true }, accessToken);
    setExams(result.error ? [] : result.data);
  }, [accessToken]);

  useEffect(() => {
    void loadExams();
  }, [loadExams]);

  const handleDeleteExam = async (examId: string): Promise<void> => {
    if (!window.confirm("¿Eliminar este examen y todas sus asignaciones?")) return;
    const result = await apiRequest<{ deleted: boolean }>(`/api/exams/${encodeURIComponent(examId)}`, { method: "DELETE" }, accessToken);
    if (!result.error) await loadExams();
  };

  return (
    <section className="panel stack">
      <div className="actions-row">
        <div>
          <p className="eyebrow">Administración</p>
          <h2>Plantillas de examen</h2>
        </div>
        <button type="button" className="primary-button" onClick={() => setCreateOpen(true)}>
          <Plus size={16} />
          Crear examen
        </button>
      </div>
      {exams === null ? <SkeletonBlock height={160} /> : null}
      {exams !== null && exams.length === 0 ? <EmptyState title="No hay exámenes. Crea uno o ejecuta el seed." /> : null}
      {exams !== null && exams.length > 0 ? (
        <div className="compact-list">
          {exams.map((exam) => (
            <article className="compact-row" key={exam.id}>
              <div className="actions-row">
                <strong>{exam.title}</strong>
                <span className={`badge ${exam.isActive ? "status-active" : "status-inactive"}`}>{exam.isActive ? "Activo" : "Archivado"}</span>
              </div>
              <span className="muted">{exam.questionCount} preguntas · {exam.durationMin} min · aprobado {exam.passScore}% · {exam.assignmentCount ?? 0} asignaciones</span>
              <div className="actions-row">
                <button type="button" className="secondary-link compact-button" onClick={() => setManageExam(exam)}>Gestionar asignaciones</button>
                <button type="button" className="danger-link compact-button" onClick={() => void handleDeleteExam(exam.id)}>
                  <Trash2 size={14} />
                  Eliminar
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}
      {createOpen ? <CreateExamDialog onClose={() => setCreateOpen(false)} onCreated={() => { setCreateOpen(false); void loadExams(); }} /> : null}
      {manageExam !== null ? <ManageAssignmentsDialog exam={manageExam} onClose={() => { setManageExam(null); void loadExams(); }} /> : null}
    </section>
  );
}

function CreateExamDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }): JSX.Element {
  const { accessToken } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationMin, setDurationMin] = useState(20);
  const [passScore, setPassScore] = useState(70);
  const [questionsText, setQuestionsText] = useState(QUESTIONS_TEMPLATE);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (): Promise<void> => {
    let questions: unknown;
    try {
      questions = JSON.parse(questionsText);
    } catch {
      setErrorMessage("El banco de preguntas no es un JSON válido.");
      return;
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      setErrorMessage("El banco de preguntas debe ser una lista con al menos una pregunta.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    const result = await apiRequest<ExamSummary>(
      "/api/exams",
      {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() === "" ? undefined : description.trim(),
          durationMin,
          passScore,
          questions
        })
      },
      accessToken
    );
    setIsSubmitting(false);

    if (result.error) {
      setErrorMessage(result.message);
      return;
    }

    onCreated();
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <section className="modal-panel">
        <div className="actions-row">
          <div>
            <p className="eyebrow">Nueva plantilla</p>
            <h2>Crear examen</h2>
          </div>
          <button type="button" className="secondary-link compact-button" onClick={onClose}>Cerrar</button>
        </div>
        <label>Título<input value={title} onChange={(event) => setTitle(event.target.value)} /></label>
        <label>Descripción<input value={description} onChange={(event) => setDescription(event.target.value)} /></label>
        <div className="form-grid">
          <label>Duración (min)<input type="number" min={1} max={180} value={durationMin} onChange={(event) => setDurationMin(Number(event.target.value))} /></label>
          <label>Aprobado (%)<input type="number" min={1} max={100} value={passScore} onChange={(event) => setPassScore(Number(event.target.value))} /></label>
        </div>
        <label>
          Banco de preguntas (JSON: {"{ q, o[], a }"})
          <textarea className="exam-json" value={questionsText} rows={10} onChange={(event) => setQuestionsText(event.target.value)} />
        </label>
        {errorMessage !== null ? <p className="error-message">{errorMessage}</p> : null}
        <div className="actions-row">
          <button type="button" className="secondary-link" onClick={onClose}>Cancelar</button>
          <button type="button" className="primary-button" disabled={isSubmitting || title.trim().length < 3} onClick={() => void handleSubmit()}>Crear examen</button>
        </div>
      </section>
    </div>
  );
}

function ManageAssignmentsDialog({ exam, onClose }: { exam: ExamSummary; onClose: () => void }): JSX.Element {
  const { accessToken } = useAuth();
  const [assignments, setAssignments] = useState<ExamAssignmentSummary[] | null>(null);
  const [assignees, setAssignees] = useState<AssigneeOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const loadAssignments = useCallback(async (): Promise<void> => {
    const result = await apiRequest<ExamAssignmentSummary[]>(`/api/exams/${encodeURIComponent(exam.id)}/assignments`, { suppressToast: true }, accessToken);
    setAssignments(result.error ? [] : result.data);
  }, [accessToken, exam.id]);

  useEffect(() => {
    void loadAssignments();
    const loadUsers = async (): Promise<void> => {
      const result = await apiRequest<AssigneeOption[]>("/api/users?limit=100", { suppressToast: true }, accessToken);
      if (!result.error) setAssignees(result.data);
    };
    void loadUsers();
  }, [accessToken, loadAssignments]);

  const openForUser = async (): Promise<void> => {
    if (selectedUserId === "") return;
    const result = await apiRequest<ExamAssignmentSummary>(`/api/exams/${encodeURIComponent(exam.id)}/assignments`, { method: "POST", body: JSON.stringify({ userId: selectedUserId }) }, accessToken);
    setMessage(result.error ? result.message : "Examen abierto para el fiscal.");
    if (!result.error) {
      setSelectedUserId("");
      await loadAssignments();
    }
  };

  const closeAssignment = async (assignmentId: string): Promise<void> => {
    const result = await apiRequest<ExamAssignmentSummary>(`/api/exams/assignments/${encodeURIComponent(assignmentId)}`, { method: "PATCH", body: JSON.stringify({ status: "CLOSED" }) }, accessToken);
    if (!result.error) await loadAssignments();
  };

  const deleteAssignment = async (assignmentId: string): Promise<void> => {
    const result = await apiRequest<{ deleted: boolean }>(`/api/exams/assignments/${encodeURIComponent(assignmentId)}`, { method: "DELETE" }, accessToken);
    if (!result.error) await loadAssignments();
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <section className="modal-panel">
        <div className="actions-row">
          <div>
            <p className="eyebrow">{exam.title}</p>
            <h2>Asignaciones</h2>
          </div>
          <button type="button" className="secondary-link compact-button" onClick={onClose}>Cerrar</button>
        </div>
        <div className="actions-row exam-assign-form">
          <select value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)} aria-label="Fiscal">
            <option value="">Selecciona un fiscal…</option>
            {assignees.map((user) => <option key={user.id} value={user.id}>{user.displayName} · {roleLabel(user.role)}</option>)}
          </select>
          <button type="button" className="primary-button" disabled={selectedUserId === ""} onClick={() => void openForUser()}>Abrir examen</button>
        </div>
        {message !== null ? <p className="hint">{message}</p> : null}
        {assignments === null ? <SkeletonBlock height={140} /> : null}
        {assignments !== null && assignments.length === 0 ? <EmptyState title="Sin asignaciones todavía." /> : null}
        {assignments !== null && assignments.length > 0 ? (
          <div className="compact-list">
            {assignments.map((assignment) => (
              <article className="compact-row" key={assignment.id}>
                <div className="actions-row">
                  <strong>{assignment.user.displayName}</strong>
                  <span className={`badge ${assignmentStatusClass(assignment.status)}`}>{assignmentStatusLabel(assignment.status)}</span>
                </div>
                <span className="muted">
                  {roleLabel(assignment.user.role)} · abierto {formatHubDate(assignment.openedAt)}
                  {assignment.attempt !== null ? ` · nota ${assignment.attempt.score}% (${assignment.attempt.passed ? "apto" : "no apto"})` : ""}
                </span>
                <div className="actions-row">
                  {assignment.status === "OPEN" ? (
                    <button type="button" className="secondary-link compact-button" onClick={() => void closeAssignment(assignment.id)}>Cerrar</button>
                  ) : null}
                  <button type="button" className="danger-link compact-button" onClick={() => void deleteAssignment(assignment.id)}>
                    <Trash2 size={14} />
                    Eliminar
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}

function assignmentStatusLabel(status: ExamAssignmentSummary["status"]): string {
  if (status === "OPEN") return "Abierto";
  if (status === "COMPLETED") return "Completado";
  return "Cerrado";
}

function assignmentStatusClass(status: ExamAssignmentSummary["status"]): string {
  if (status === "OPEN") return "status-active";
  if (status === "COMPLETED") return "priority-normal";
  return "status-inactive";
}
