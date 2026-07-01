import { Clock, FileQuestion } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../auth/auth-context";
import { ExamAdminPanel } from "../../components/exams/ExamAdminPanel";
import { ExamResultsSection } from "../../components/exams/ExamResultsSection";
import { ExamRunner } from "../../components/exams/ExamRunner";
import { EmptyState, SkeletonBlock } from "../../components/ui";
import { apiRequest } from "../../services/api";
import type { AvailableExam } from "../../types/sadoj";

export function ExamsPage(): JSX.Element {
  const { accessToken, hasPermission } = useAuth();
  const canManage = hasPermission("MANAGE_USERS");
  const [available, setAvailable] = useState<AvailableExam[] | null>(null);
  const [activeAssignmentId, setActiveAssignmentId] = useState<string | null>(null);
  const [resultsKey, setResultsKey] = useState(0);

  const loadAvailable = useCallback(async (): Promise<void> => {
    const result = await apiRequest<AvailableExam[]>("/api/exams/available", { suppressToast: true }, accessToken);
    setAvailable(result.error ? [] : result.data);
  }, [accessToken]);

  useEffect(() => {
    void loadAvailable();
  }, [loadAvailable]);

  if (activeAssignmentId !== null) {
    return (
      <div className="page narrow">
        <ExamRunner
          assignmentId={activeAssignmentId}
          onExit={() => { setActiveAssignmentId(null); void loadAvailable(); setResultsKey((current) => current + 1); }}
          onCompleted={() => { void loadAvailable(); setResultsKey((current) => current + 1); }}
        />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Formación y evaluación</p>
          <h1>Exámenes</h1>
        </div>
      </div>

      {canManage ? <ExamAdminPanel /> : null}

      <section className="panel stack">
        <div>
          <p className="eyebrow">Disponibles para ti</p>
          <h2>Exámenes disponibles</h2>
        </div>
        {available === null ? <SkeletonBlock height={120} /> : null}
        {available !== null && available.length === 0 ? <EmptyState title="No tienes exámenes abiertos. El administrador debe habilitarte uno." /> : null}
        {available !== null && available.length > 0 ? (
          <div className="exam-available-grid">
            {available.map((item) => (
              <article className="exam-available-card" key={item.assignmentId}>
                <div className="exam-available-icon"><FileQuestion size={22} /></div>
                <div className="stack-tight">
                  <strong>{item.exam.title}</strong>
                  {item.exam.description !== null ? <span className="muted">{item.exam.description}</span> : null}
                  <span className="muted exam-meta-row">
                    <span><Clock size={14} /> {item.exam.durationMin} min</span>
                    <span>{item.exam.questionCount} preguntas</span>
                    <span>Aprobado {item.exam.passScore}%</span>
                  </span>
                </div>
                <button type="button" className="primary-button" onClick={() => setActiveAssignmentId(item.assignmentId)}>Comenzar</button>
              </article>
            ))}
          </div>
        ) : null}
      </section>

      <ExamResultsSection key={resultsKey} />
    </div>
  );
}
