import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../auth/auth-context";
import { apiRequest } from "../../services/api";
import type { ExamSubmitResult, TakeExam } from "../../types/sadoj";
import { EmptyState, SkeletonBlock } from "../ui";

type RunnerPhase = "loading" | "start" | "taking" | "results" | "review";

interface ExamRunnerProps {
  assignmentId: string;
  onExit: () => void;
  onCompleted: () => void;
}

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

export function ExamRunner({ assignmentId, onExit, onCompleted }: ExamRunnerProps): JSX.Element {
  const { accessToken } = useAuth();
  const [phase, setPhase] = useState<RunnerPhase>("loading");
  const [exam, setExam] = useState<TakeExam | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [answers, setAnswers] = useState<(string | null)[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [result, setResult] = useState<ExamSubmitResult | null>(null);

  const startedAtRef = useRef<string | null>(null);
  const answersRef = useRef<(string | null)[]>([]);
  const submittingRef = useRef(false);

  answersRef.current = answers;

  useEffect(() => {
    const load = async (): Promise<void> => {
      const response = await apiRequest<TakeExam>(`/api/exams/take/${encodeURIComponent(assignmentId)}`, { suppressToast: true }, accessToken);
      if (response.error) {
        setErrorMessage(response.message);
        setPhase("start");
        return;
      }
      setExam(response.data);
      setAnswers(new Array(response.data.questions.length).fill(null));
      setPhase("start");
    };

    void load();
  }, [accessToken, assignmentId]);

  const submit = useCallback(async (): Promise<void> => {
    if (exam === null || submittingRef.current) return;
    submittingRef.current = true;

    const payloadAnswers = exam.questions.map((question, index) => ({ q: question.q, selected: answersRef.current[index] ?? null }));
    const response = await apiRequest<ExamSubmitResult>(
      `/api/exams/take/${encodeURIComponent(assignmentId)}`,
      { method: "POST", body: JSON.stringify({ startedAt: startedAtRef.current ?? undefined, answers: payloadAnswers }) },
      accessToken
    );

    if (response.error) {
      setErrorMessage(response.message);
      submittingRef.current = false;
      return;
    }

    setResult(response.data);
    setPhase("results");
    onCompleted();
  }, [accessToken, assignmentId, exam, onCompleted]);

  useEffect(() => {
    if (phase !== "taking") return;

    const interval = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(interval);
          void submit();
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [phase, submit]);

  const startExam = (): void => {
    if (exam === null) return;
    startedAtRef.current = new Date().toISOString();
    setSecondsLeft(exam.exam.durationMin * 60);
    setCurrentQ(0);
    setPhase("taking");
  };

  const selectOption = (optionText: string): void => {
    setAnswers((current) => {
      const next = [...current];
      next[currentQ] = optionText;
      return next;
    });
  };

  const answeredCount = useMemo(() => answers.filter((answer) => answer !== null).length, [answers]);

  if (phase === "loading") {
    return <div className="panel"><SkeletonBlock height={320} /></div>;
  }

  if (exam === null) {
    return <EmptyState title={errorMessage ?? "No se pudo cargar el examen."} action={<button type="button" className="secondary-link" onClick={onExit}>Volver</button>} />;
  }

  if (phase === "start") {
    return (
      <section className="panel stack exam-start">
        <p className="eyebrow">Examen oficial</p>
        <h2>{exam.exam.title}</h2>
        {exam.exam.description !== null ? <p className="muted">{exam.exam.description}</p> : null}
        <div className="exam-meta-row">
          <span><Clock size={16} /> {exam.exam.durationMin} minutos</span>
          <span>{exam.questions.length} preguntas</span>
          <span>Aprobado: {exam.exam.passScore}%</span>
        </div>
        {errorMessage !== null ? <p className="error-message">{errorMessage}</p> : null}
        <div className="actions-row">
          <button type="button" className="secondary-link" onClick={onExit}>Cancelar</button>
          <button type="button" className="primary-button" onClick={startExam}>Comenzar examen</button>
        </div>
      </section>
    );
  }

  if (phase === "results" && result !== null) {
    return <ExamResultView result={result} onReview={() => setPhase("review")} onExit={onExit} />;
  }

  if (phase === "review" && result !== null) {
    return <ExamReviewView result={result} onBack={() => setPhase("results")} />;
  }

  const question = exam.questions[currentQ];
  if (question === undefined) {
    return <EmptyState title="Pregunta no disponible." action={<button type="button" className="secondary-link" onClick={onExit}>Volver</button>} />;
  }

  const isLast = currentQ === exam.questions.length - 1;

  return (
    <section className="panel stack exam-taking">
      <div className="exam-taking-header">
        <span className="muted">{answeredCount}/{exam.questions.length} respondidas</span>
        <span className={timerClassName(secondsLeft)}><Clock size={16} /> {formatSeconds(secondsLeft)}</span>
      </div>
      <div className="exam-progress-track"><span style={{ width: `${((currentQ + 1) / exam.questions.length) * 100}%` }} /></div>
      <div className="exam-question">
        <p className="eyebrow">Pregunta {currentQ + 1} de {exam.questions.length}</p>
        <h3>{question.q}</h3>
        <div className="exam-options">
          {question.o.map((option, index) => (
            <button
              key={option}
              type="button"
              className={answers[currentQ] === option ? "exam-option selected" : "exam-option"}
              onClick={() => selectOption(option)}
            >
              <span className="exam-option-letter">{OPTION_LETTERS[index] ?? "?"}</span>
              <span>{option}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="actions-row exam-nav">
        <button type="button" className="secondary-link" disabled={currentQ === 0} onClick={() => setCurrentQ((current) => Math.max(0, current - 1))}>Anterior</button>
        {isLast ? (
          <button type="button" className="primary-button" onClick={() => void submit()}>Enviar examen</button>
        ) : (
          <button type="button" className="primary-button" onClick={() => setCurrentQ((current) => Math.min(exam.questions.length - 1, current + 1))}>Siguiente</button>
        )}
      </div>
      <div className="exam-grid">
        {exam.questions.map((_, index) => (
          <button
            key={index}
            type="button"
            className={`exam-dot${answers[index] !== null ? " answered" : ""}${index === currentQ ? " current" : ""}`}
            onClick={() => setCurrentQ(index)}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </section>
  );
}

function ExamResultView({ result, onReview, onExit }: { result: ExamSubmitResult; onReview: () => void; onExit: () => void }): JSX.Element {
  return (
    <section className="panel stack exam-results">
      <p className="eyebrow">Resultado del examen</p>
      <div className={`exam-badge ${result.passed ? "pass" : "fail"}`}>
        {result.passed ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
        {result.passed ? "APTO" : "NO APTO"} — {result.score}%
      </div>
      <div className="exam-stat-row">
        <span><strong>{result.correctCount}</strong>Correctas</span>
        <span><strong>{result.totalQuestions}</strong>Total</span>
        <span><strong>{result.score}%</strong>Nota</span>
      </div>
      <div className="actions-row">
        <button type="button" className="secondary-link" onClick={onReview}>Ver revisión</button>
        <button type="button" className="primary-button" onClick={onExit}>Volver a exámenes</button>
      </div>
    </section>
  );
}

function ExamReviewView({ result, onBack }: { result: ExamSubmitResult; onBack: () => void }): JSX.Element {
  return (
    <section className="panel stack exam-review">
      <div className="actions-row">
        <div><p className="eyebrow">Revisión</p><h2>Revisión del examen</h2></div>
        <button type="button" className="secondary-link compact-button" onClick={onBack}>Volver a resultados</button>
      </div>
      {result.review.map((entry, index) => (
        <article key={index} className={`exam-review-card ${entry.isCorrect ? "correct" : "wrong"}`}>
          <div className="actions-row">
            <span className="eyebrow">Pregunta {index + 1}</span>
            <span className={`badge ${entry.isCorrect ? "status-active" : "status-inactive"}`}>{entry.isCorrect ? "Correcta" : entry.selected === null ? "Sin responder" : "Incorrecta"}</span>
          </div>
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
        </article>
      ))}
    </section>
  );
}

function formatSeconds(total: number): string {
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes < 10 ? "0" : ""}${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

function timerClassName(secondsLeft: number): string {
  if (secondsLeft <= 60) return "exam-timer danger";
  if (secondsLeft <= 300) return "exam-timer warn";
  return "exam-timer";
}
