import type { FormEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/auth-context";
import { ImageUrlInput } from "../../components/common/ImageUrlInput";
import { apiRequest } from "../../services/api";
import { DANGER_LABELS, STATUS_LABELS } from "../../utils/labels";

const DANGER_OPTIONS = ["LOW", "MEDIUM", "HIGH", "EXTREME"] as const;
const STATUS_OPTIONS = ["FREE", "WANTED", "UNDER_SURVEILLANCE", "ARRESTED", "INDICTED", "CONVICTED"] as const;

interface CreateSubjectResponse {
  id: string;
}

export function SubjectCreatePage(): JSX.Element {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [photoUrl, setPhotoUrl] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);

    const result = await apiRequest<CreateSubjectResponse>(
      "/api/subjects",
      {
        method: "POST",
        body: JSON.stringify({
          firstName: String(formData.get("firstName") ?? ""),
          lastName: String(formData.get("lastName") ?? ""),
          alias: String(formData.get("alias") ?? "") || undefined,
          nationality: String(formData.get("nationality") ?? "") || undefined,
          occupation: String(formData.get("occupation") ?? "") || undefined,
          phone: String(formData.get("phone") ?? "") || undefined,
          address: String(formData.get("address") ?? "") || undefined,
          photoUrl: photoUrl.length > 0 ? photoUrl : undefined,
          dangerLevel: String(formData.get("dangerLevel") ?? "LOW"),
          status: String(formData.get("status") ?? "FREE")
        })
      },
      accessToken
    );

    setIsSubmitting(false);

    if (result.error) {
      setErrorMessage(result.message);
      return;
    }

    navigate(`/sujetos/${result.data.id}`);
  };

  return (
    <div className="page narrow">
      <div className="page-header">
        <div>
          <p className="eyebrow">Nuevo sujeto</p>
          <h1>Registrar sujeto</h1>
        </div>
      </div>
      <form className="panel form-grid" onSubmit={(event) => void handleSubmit(event)}>
        <label>Nombre<input name="firstName" required /></label>
        <label>Apellido<input name="lastName" required /></label>
        <label>Alias<input name="alias" /></label>
        <label>Nacionalidad<input name="nationality" /></label>
        <label>Ocupación<input name="occupation" /></label>
        <label>Teléfono<input name="phone" /></label>
        <label className="span-full">Dirección<input name="address" /></label>
        <label>
          Estado
          <select name="status" defaultValue="FREE">
            {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}
          </select>
        </label>
        <label>
          Nivel de peligro
          <select name="dangerLevel" defaultValue="LOW">
            {DANGER_OPTIONS.map((danger) => <option key={danger} value={danger}>{DANGER_LABELS[danger]}</option>)}
          </select>
        </label>
        <div className="span-full">
          <ImageUrlInput value={photoUrl} onChange={setPhotoUrl} shape="circle" label="Foto del sujeto" />
        </div>
        {errorMessage !== null ? <p className="error-message">{errorMessage}</p> : null}
        <button className="primary-button" type="submit" disabled={isSubmitting}>{isSubmitting ? "Guardando..." : "Registrar sujeto"}</button>
      </form>
    </div>
  );
}
