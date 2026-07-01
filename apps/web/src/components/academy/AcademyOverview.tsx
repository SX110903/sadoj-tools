import { BookOpen, ClipboardCheck, FileQuestion, Library } from "lucide-react";
import { Link } from "react-router-dom";
import type { AcademyClass, AcademyContent, AcademyRecord } from "../../types/sadoj";

export type AcademyView = "home" | "classes" | "library" | "record";

export function AcademyOverview({ classes, content, record, onNavigate }: { classes: AcademyClass[]; content: AcademyContent[]; record: AcademyRecord | null; onNavigate: (view: AcademyView) => void }): JSX.Element {
  const cards = [
    { view: "classes" as const, icon: <BookOpen size={24} />, title: "Clases", value: `${classes.length}/5`, description: "Programa formativo y contenido de cada sesión" },
    { view: "library" as const, icon: <Library size={24} />, title: "Material de estudio", value: String(content.length), description: "Notas, vídeos, documentos y normativa" },
    { view: "record" as const, icon: <ClipboardCheck size={24} />, title: "Mi registro académico", value: record === null ? "—" : `${record.attendedClasses}/5`, description: "Asistencia y progreso personal" }
  ];

  return (
    <div className="stack">
      <section className="academy-overview-grid">
        {cards.map((card) => (
          <button key={card.view} type="button" className="academy-overview-card" onClick={() => onNavigate(card.view)}>
            <span>{card.icon}</span><div><p>{card.title}</p><strong>{card.value}</strong><small>{card.description}</small></div>
          </button>
        ))}
      </section>
      <section className="panel academy-final-card">
        <span><FileQuestion size={28} /></span>
        <div><p className="eyebrow">Última fase</p><h2>Examen final</h2><p className="muted">Realiza el examen cuando el administrador lo habilite.</p></div>
        <Link className="primary-link" to="/examenes">Abrir Exámenes</Link>
      </section>
    </div>
  );
}
