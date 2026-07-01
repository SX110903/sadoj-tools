import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../auth/auth-context";
import { apiRequest } from "../../services/api";
import type { ExamResult } from "../../types/sadoj";
import { formatHubDate } from "../../utils/labels";
import { EmptyState, SkeletonBlock } from "../ui";

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

interface ExamResultsSectionProps {
  userId?: string;
  title?: string;
}

export function ExamResultsSection({ userId, title = "Mis resultados" }: ExamResultsSectionProps): JSX.Element {
  const { accessToken } = useAuth();
  const [results, setResults] = useState<ExamResult[] | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    const path = userId === undefined ? "/api/exams/results/mine" : `/api/users/${encodeURIComponent(userId)}/exam-results`;
    const result = await apiRequest<ExamResult[]>(path, { suppressToast: true }, accessToken);
    setResults(result.error ? [] : result.data);
  }, [accessToken, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="panel stack">
      <div>
        <p className="eyebrow">Transparencia de notas</p>
        <h2>{title}</h2>
      </div>
      {results === null ? <SkeletonBlock height={140} /> : null}
      {results !== null && results.length === 0 ? <EmptyState title="Sin resultados de exámenes todavía." /> : null}
      {results !== null && results.length > 0 ? (
        <div className="compact-list">
          {results.map((result) => (
            <article className="compact-row" key={result.id}>
              <div className="actions-row">
                <strong>{result.exam.title}</strong>
                <span className={`badge ${result.passed ? "status-active" : "status-inactive"}`}>{result.passed ? "Apto" : "No apto"} · {result.score}%</span>
              </div>
              <span className="muted">{result.correctCount}/{result.totalQuestions} correctas · {formatHubDate(result.submittedAt)}</span>
              <div className="actions-row">
                <button type="button" className="secondary-link compact-button" onClick={() => setExpandedId((current) => (current === result.id ? null : result.id))}>
                  {expandedId === result.id ? "Ocultar revisión" : "Ver revisión"}
                </button>
              </div>
              {expandedId === result.id ? (
                <div className="exam-review-inline">
                  {result.review.map((entry, index) => (
                    <div key={index} className={`exam-review-card ${entry.isCorrect ? "correct" : "wrong"}`}>
                      <span className="eyebrow">Pregunta {index + 1} — {entry.isCorrect ? "Correcta" : entry.selected === null ? "Sin responder" : "Incorrecta"}</span>
                      <strong>{entry.q}</strong>
                      <div className="exam-options">
                        {entry.options.map((option, optionIndex) => {
                          const classes = ["exam-review-option"];
                          if (option === entry.correct) classes.push("is-correct");
                          else if (option === entry.selected) classes.push("is-wrong");
                          return (
                            <div key={option} className={classes.join(" ")}>
                              <span className="exam-option-letter">{OPTION_LETTERS[optionIndex] ?? "?"}</span>
                              <span>{option}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
