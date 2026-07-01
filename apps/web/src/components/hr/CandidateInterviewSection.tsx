import { CalendarClock, Save } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import type { InterviewInput } from "../../hooks/useCandidates";
import type { CandidateInterview, InterviewResult } from "../../types/sadoj";

interface CandidateInterviewSectionProps {
  interview: CandidateInterview | null;
  isClosed: boolean;
  onSave: (input: InterviewInput) => Promise<string | null>;
}

export function CandidateInterviewSection({ interview, isClosed, onSave }: CandidateInterviewSectionProps): JSX.Element {
  const [scheduledAt, setScheduledAt] = useState(toLocalDateTime(interview?.scheduledAt ?? null));
  const [conductedAt, setConductedAt] = useState(toLocalDateTime(interview?.conductedAt ?? null));
  const [score, setScore] = useState(interview?.score === null || interview?.score === undefined ? "" : String(interview.score));
  const [result, setResult] = useState<InterviewResult>(interview?.result ?? "PENDING");
  const [feedback, setFeedback] = useState(interview?.feedback ?? "");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setScheduledAt(toLocalDateTime(interview?.scheduledAt ?? null));
    setConductedAt(toLocalDateTime(interview?.conductedAt ?? null));
    setScore(interview?.score === null || interview?.score === undefined ? "" : String(interview.score));
    setResult(interview?.result ?? "PENDING");
    setFeedback(interview?.feedback ?? "");
  }, [interview]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setIsSaving(true);
    const error = await onSave({
      scheduledAt: toIsoDate(scheduledAt),
      conductedAt: toIsoDate(conductedAt),
      score: score === "" ? null : Number(score),
      result,
      feedback: feedback.trim() === "" ? null : feedback.trim()
    });
    setIsSaving(false);
    setErrorMessage(error);
  };

  return (
    <section className="panel stack hr-interview-panel">
      <div className="section-heading">
        <CalendarClock size={20} />
        <div><p className="eyebrow">Evaluación</p><h2>Entrevista</h2></div>
      </div>
      <form className="stack" onSubmit={(event) => void handleSubmit(event)}>
        <div className="form-grid">
          <label>Fecha programada<input type="datetime-local" value={scheduledAt} disabled={isClosed} onChange={(event) => setScheduledAt(event.target.value)} /></label>
          <label>Fecha realizada<input type="datetime-local" value={conductedAt} disabled={isClosed} onChange={(event) => setConductedAt(event.target.value)} /></label>
          <label>Nota (0-100)<input type="number" min={0} max={100} value={score} disabled={isClosed} onChange={(event) => setScore(event.target.value)} /></label>
          <label>Resultado
            <select value={result} disabled={isClosed} onChange={(event) => setResult(event.target.value as InterviewResult)}>
              <option value="PENDING">Pendiente</option>
              <option value="PASSED">Apto</option>
              <option value="FAILED">No apto</option>
            </select>
          </label>
        </div>
        <label>Valoración<textarea rows={5} maxLength={5000} value={feedback} disabled={isClosed} onChange={(event) => setFeedback(event.target.value)} /></label>
        {interview !== null ? <p className="muted">Entrevistador: {interview.interviewer.displayName}</p> : null}
        {errorMessage !== null ? <p className="error-message">{errorMessage}</p> : null}
        {!isClosed ? (
          <button type="submit" className="primary-button align-self-start" disabled={isSaving}>
            <Save size={16} />{isSaving ? "Guardando..." : interview === null ? "Registrar entrevista" : "Guardar entrevista"}
          </button>
        ) : null}
      </form>
    </section>
  );
}

function toLocalDateTime(value: string | null): string {
  if (value === null) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function toIsoDate(value: string): string | null {
  return value === "" ? null : new Date(value).toISOString();
}
