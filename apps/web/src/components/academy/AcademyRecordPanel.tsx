import { Award, CheckCircle2, Clock3, FileQuestion } from "lucide-react";
import { Link } from "react-router-dom";
import type { AcademyRecord, AcademyExamStatus } from "../../types/sadoj";

const EXAM_LABELS: Readonly<Record<AcademyExamStatus, string>> = {
  PENDING: "Pendiente de apertura",
  AVAILABLE: "Disponible",
  PASSED: "Aprobado",
  FAILED: "No aprobado"
};

export function AcademyRecordPanel({ record, heading = "Mi registro académico" }: { record: AcademyRecord; heading?: string }): JSX.Element {
  return (
    <div className="stack">
      <section className="panel stack">
        <div className="academy-progress-heading">
          <div><p className="eyebrow">{heading}</p><h2>{record.attendedClasses}/{record.totalClasses} clases asistidas</h2></div>
          <strong>{record.progressPercent}%</strong>
        </div>
        <div className="academy-progress-track" aria-label={`Progreso ${record.progressPercent}%`}><span style={{ width: `${record.progressPercent}%` }} /></div>
        <div className="academy-record-stats">
          <span><CheckCircle2 size={18} /><strong>{record.attendedClasses}</strong> asistencias</span>
          <span><Award size={18} /><strong>{record.contentCount}</strong> materiales</span>
          <span><FileQuestion size={18} /><strong>{record.exam.score ?? "—"}</strong> nota final</span>
        </div>
      </section>

      <section className="panel stack">
        <div><p className="eyebrow">Fase final</p><h2>Examen final</h2></div>
        <div className="academy-exam-status">
          {record.exam.status === "PENDING" ? <Clock3 size={22} /> : <FileQuestion size={22} />}
          <div><strong>{EXAM_LABELS[record.exam.status]}</strong><span>{record.exam.exam?.title ?? "El administrador abrirá el examen cuando corresponda."}</span></div>
          <Link className="primary-link" to="/examenes">Ir a Exámenes</Link>
        </div>
      </section>
    </div>
  );
}
