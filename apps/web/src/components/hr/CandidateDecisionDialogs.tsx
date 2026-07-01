import { useState, type FormEvent } from "react";
import type { ApprovalInput } from "../../hooks/useCandidates";

interface ApprovalDialogProps {
  candidateName: string;
  onClose: () => void;
  onApprove: (input: ApprovalInput) => Promise<string | null>;
}

export function CandidateApprovalDialog({ candidateName, onClose, onApprove }: ApprovalDialogProps): JSX.Element {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [badgeNumber, setBadgeNumber] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setIsSubmitting(true);
    const input: ApprovalInput = { username: username.trim(), password };
    if (email.trim() !== "") input.email = email.trim();
    if (badgeNumber.trim() !== "") input.badgeNumber = badgeNumber.trim();
    const error = await onApprove(input);
    setIsSubmitting(false);
    if (error === null) onClose();
    else setErrorMessage(error);
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="approval-dialog-title">
      <form className="modal-panel" onSubmit={(event) => void handleSubmit(event)}>
        <div><p className="eyebrow">Alta de personal</p><h2 id="approval-dialog-title">Aprobar a {candidateName}</h2></div>
        <p className="muted">Se creará una cuenta de Legal Staff con acceso limitado a Academia, perfil y exámenes.</p>
        <div className="form-grid">
          <label>Usuario<input required minLength={3} maxLength={40} autoComplete="off" value={username} onChange={(event) => setUsername(event.target.value)} /></label>
          <label>Número de placa<input maxLength={40} value={badgeNumber} onChange={(event) => setBadgeNumber(event.target.value)} /></label>
        </div>
        <label>Correo electrónico<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <label>Contraseña temporal<input required type="password" minLength={8} maxLength={128} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        <p className="hint">Debe incluir mayúsculas, minúsculas, números y símbolos.</p>
        {errorMessage !== null ? <p className="error-message">{errorMessage}</p> : null}
        <div className="actions-row">
          <button type="button" className="secondary-link" onClick={onClose}>Cancelar</button>
          <button type="submit" className="primary-button" disabled={isSubmitting || username.trim().length < 3 || password.length < 8}>
            {isSubmitting ? "Creando cuenta..." : "Aprobar y crear cuenta"}
          </button>
        </div>
      </form>
    </div>
  );
}

export function CandidateRejectDialog({ onClose, onReject }: { onClose: () => void; onReject: (reason?: string) => Promise<string | null> }): JSX.Element {
  const [reason, setReason] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReject = async (): Promise<void> => {
    setIsSubmitting(true);
    const error = await onReject(reason.trim() === "" ? undefined : reason.trim());
    setIsSubmitting(false);
    if (error === null) onClose();
    else setErrorMessage(error);
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="reject-dialog-title">
      <section className="modal-panel">
        <div><p className="eyebrow">Cerrar proceso</p><h2 id="reject-dialog-title">Rechazar candidato</h2></div>
        <label>Motivo<textarea rows={4} maxLength={1000} value={reason} onChange={(event) => setReason(event.target.value)} /></label>
        {errorMessage !== null ? <p className="error-message">{errorMessage}</p> : null}
        <div className="actions-row">
          <button type="button" className="secondary-link" onClick={onClose}>Cancelar</button>
          <button type="button" className="danger-button" disabled={isSubmitting} onClick={() => void handleReject()}>{isSubmitting ? "Rechazando..." : "Confirmar rechazo"}</button>
        </div>
      </section>
    </div>
  );
}
