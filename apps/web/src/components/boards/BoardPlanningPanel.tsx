import { ArrowDown, ArrowUp, Image, Pencil, Plus, Trash2 } from "lucide-react";
import type { BoardStep, BoardStepStatus } from "../../types/sadoj";
import { SecureImage } from "../common/SecureImage";

interface BoardPlanningPanelProps {
  isMutating: boolean;
  steps: readonly BoardStep[];
  onAdd: () => void;
  onDelete: (step: BoardStep) => void;
  onEdit: (step: BoardStep) => void;
  onMove: (stepId: string, direction: -1 | 1) => void;
}

export function BoardPlanningPanel({ isMutating, steps, onAdd, onDelete, onEdit, onMove }: BoardPlanningPanelProps): JSX.Element {
  return (
    <aside className="planning-steps-panel">
      <header className="planning-steps-header">
        <div>
          <p className="eyebrow">Plan de operación</p>
          <h3>Fases</h3>
        </div>
        <button type="button" className="icon-button" title="Añadir paso" aria-label="Añadir paso" disabled={isMutating} onClick={onAdd}>
          <Plus size={18} />
        </button>
      </header>
      {steps.length === 0 ? (
        <div className="planning-steps-empty">
          <Image size={28} />
          <strong>Sin pasos definidos</strong>
          <span>Añade la primera fase del plan.</span>
        </div>
      ) : null}
      <div className="planning-steps-list">
        {steps.map((step, index) => (
          <article className="planning-step-card" key={step.id}>
            <div className="planning-step-number">#{step.order}</div>
            <div className="planning-step-content">
              <div className="planning-step-title-row">
                <div>
                  <span className={`planning-step-status status-${step.status.toLowerCase()}`}>{stepStatusLabel(step.status)}</span>
                  <h4>{step.title}</h4>
                </div>
                <div className="planning-step-actions">
                  <button type="button" className="icon-button" title="Subir paso" aria-label="Subir paso" disabled={isMutating || index === 0} onClick={() => onMove(step.id, -1)}>
                    <ArrowUp size={15} />
                  </button>
                  <button type="button" className="icon-button" title="Bajar paso" aria-label="Bajar paso" disabled={isMutating || index === steps.length - 1} onClick={() => onMove(step.id, 1)}>
                    <ArrowDown size={15} />
                  </button>
                  <button type="button" className="icon-button" title="Editar paso" aria-label="Editar paso" disabled={isMutating} onClick={() => onEdit(step)}>
                    <Pencil size={15} />
                  </button>
                  <button type="button" className="icon-button danger-icon" title="Eliminar paso" aria-label="Eliminar paso" disabled={isMutating} onClick={() => onDelete(step)}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <StepImage step={step} />
              <p>{step.description ?? "Sin descripción."}</p>
            </div>
          </article>
        ))}
      </div>
    </aside>
  );
}

function StepImage({ step }: { step: BoardStep }): JSX.Element | null {
  if (step.fileId !== null && step.file?.mimeType.startsWith("image/") === true) {
    return <SecureImage fileId={step.fileId} alt={step.title} className="planning-step-image" />;
  }

  if (step.imageUrl !== null) {
    return <img src={step.imageUrl} alt={step.title} className="planning-step-image" />;
  }

  return null;
}

export function stepStatusLabel(status: BoardStepStatus): string {
  if (status === "IN_PROGRESS") return "En curso";
  if (status === "DONE") return "Hecho";
  return "Pendiente";
}
