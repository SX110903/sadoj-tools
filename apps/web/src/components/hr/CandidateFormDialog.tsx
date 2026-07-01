import { useState, type FormEvent } from "react";
import type { CandidateInput } from "../../hooks/useCandidates";

interface CandidateFormDialogProps {
  onClose: () => void;
  onSubmit: (input: CandidateInput) => Promise<string | null>;
}

export function CandidateFormDialog({ onClose, onSubmit }: CandidateFormDialogProps): JSX.Element {
  const [fullName, setFullName] = useState("");
  const [contact, setContact] = useState("");
  const [notes, setNotes] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setIsSubmitting(true);
    const input: CandidateInput = { fullName: fullName.trim() };
    if (contact.trim() !== "") input.contact = contact.trim();
    if (notes.trim() !== "") input.notes = notes.trim();
    const error = await onSubmit(input);
    setIsSubmitting(false);
    if (error === null) onClose();
    else setErrorMessage(error);
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="candidate-dialog-title">
      <form className="modal-panel" onSubmit={(event) => void handleSubmit(event)}>
        <div className="actions-row">
          <div>
            <p className="eyebrow">Proceso de selección</p>
            <h2 id="candidate-dialog-title">Registrar candidato</h2>
          </div>
          <button type="button" className="secondary-link compact-button" onClick={onClose}>Cerrar</button>
        </div>
        <label>Nombre completo<input required minLength={2} maxLength={160} value={fullName} onChange={(event) => setFullName(event.target.value)} /></label>
        <label>Contacto<input maxLength={240} value={contact} onChange={(event) => setContact(event.target.value)} placeholder="Correo o teléfono" /></label>
        <label>Notas<textarea rows={5} maxLength={5000} value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
        {errorMessage !== null ? <p className="error-message">{errorMessage}</p> : null}
        <div className="actions-row">
          <button type="button" className="secondary-link" onClick={onClose}>Cancelar</button>
          <button type="submit" className="primary-button" disabled={isSubmitting || fullName.trim().length < 2}>
            {isSubmitting ? "Registrando..." : "Registrar candidato"}
          </button>
        </div>
      </form>
    </div>
  );
}
