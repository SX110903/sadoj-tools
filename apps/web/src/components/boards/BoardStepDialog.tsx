import { Save, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import type { CreateBoardStepPayload } from "../../hooks/useEvidenceBoard";
import type { BoardStep, BoardStepStatus } from "../../types/sadoj";
import { SecureImage } from "../common/SecureImage";
import { FileDropzone } from "../files/FileDropzone";

interface BoardStepDialogProps {
  isMutating: boolean;
  step: BoardStep | null;
  onClose: () => void;
  onSave: (payload: CreateBoardStepPayload, image: File | null) => Promise<boolean>;
}

const STEP_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;

export function BoardStepDialog({ isMutating, step, onClose, onSave }: BoardStepDialogProps): JSX.Element {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<BoardStepStatus>("PENDING");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setTitle(step?.title ?? "");
    setDescription(step?.description ?? "");
    setStatus(step?.status ?? "PENDING");
    setSelectedFiles([]);
  }, [step]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (title.trim().length === 0) return;

    setIsSubmitting(true);
    const saved = await onSave(
      {
        title: title.trim(),
        description: description.trim().length > 0 ? description.trim() : null,
        status
      },
      selectedFiles[0] ?? null
    );
    setIsSubmitting(false);

    if (saved) onClose();
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="board-step-dialog-title">
      <form className="modal-panel board-step-dialog" onSubmit={(event) => void handleSubmit(event)}>
        <header className="actions-row">
          <div>
            <p className="eyebrow">Plan de operación</p>
            <h2 id="board-step-dialog-title">{step === null ? "Añadir paso" : `Editar paso #${step.order}`}</h2>
          </div>
          <button type="button" className="icon-button" aria-label="Cerrar" onClick={onClose}>
            <X size={18} />
          </button>
        </header>
        <label>
          Título
          <input value={title} maxLength={160} placeholder="Ej. Reconocimiento del objetivo" onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label>
          Descripción
          <textarea value={description} maxLength={8000} rows={5} placeholder="Detalla el objetivo, responsables y condiciones de esta fase." onChange={(event) => setDescription(event.target.value)} />
        </label>
        <label>
          Estado
          <select value={status} onChange={(event) => setStatus(event.target.value as BoardStepStatus)}>
            <option value="PENDING">Pendiente</option>
            <option value="IN_PROGRESS">En curso</option>
            <option value="DONE">Hecho</option>
          </select>
        </label>
        {step?.fileId !== null && step?.fileId !== undefined ? (
          <div className="board-step-current-image">
            <span>Imagen actual</span>
            <SecureImage fileId={step.fileId} alt={step.title} />
          </div>
        ) : null}
        <FileDropzone
          files={selectedFiles}
          accept="image/jpeg,image/png,image/webp,image/gif"
          allowedTypes={STEP_IMAGE_TYPES}
          helperText="JPG, PNG, WebP o GIF. Máximo 10 MB."
          isUploading={isSubmitting || isMutating}
          onFilesSelected={setSelectedFiles}
          onClear={() => setSelectedFiles([])}
        />
        <div className="actions-row board-step-dialog-actions">
          <button type="button" className="secondary-link" onClick={onClose}>Cancelar</button>
          <button type="submit" className="primary-button" disabled={title.trim().length === 0 || isSubmitting || isMutating}>
            <Save size={16} />
            Guardar paso
          </button>
        </div>
      </form>
    </div>
  );
}
