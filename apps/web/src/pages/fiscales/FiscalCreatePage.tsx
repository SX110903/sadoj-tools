import type { FormEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/auth-context";
import { ImageUrlInput } from "../../components/common/ImageUrlInput";
import { apiRequest } from "../../services/api";

const ROLE_OPTIONS = [
  ["FISCAL_GENERAL", "Fiscal General"],
  ["FISCAL_ADJUNTO", "Fiscal General Adjunto"],
  ["FISCAL_DIVISION", "Fiscal de División"],
  ["FISCAL_SUPERIOR", "Fiscal Superior"],
  ["FISCAL_JEFE", "Fiscal Jefe"],
  ["FISCAL", "Fiscal"],
  ["FISCAL_AUXILIAR", "Fiscal Auxiliar"],
  ["INVESTIGADOR_SENIOR", "Investigador Senior"],
  ["INVESTIGADOR_JUNIOR", "Investigador Junior"],
  ["PASANTE", "Pasante"]
] as const;

interface CreateUserResponse {
  id: string;
}

export function FiscalCreatePage(): JSX.Element {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      setErrorMessage("Las contraseñas no coinciden.");
      setIsSubmitting(false);
      return;
    }

    const result = await apiRequest<CreateUserResponse>(
      "/api/users",
      {
        method: "POST",
        body: JSON.stringify({
          displayName: String(formData.get("displayName") ?? ""),
          username: String(formData.get("username") ?? ""),
          password,
          email: String(formData.get("email") ?? "") || undefined,
          avatarUrl: avatarUrl.length > 0 ? avatarUrl : undefined,
          badgeNumber: String(formData.get("badgeNumber") ?? "") || undefined,
          division: String(formData.get("division") ?? "") || undefined,
          role: String(formData.get("role") ?? "PASANTE")
        })
      },
      accessToken
    );

    setIsSubmitting(false);

    if (result.error) {
      setErrorMessage(result.message);
      return;
    }

    navigate(`/fiscales/${result.data.id}`);
  };

  return (
    <div className="page narrow">
      <div className="page-header">
        <div>
          <p className="eyebrow">Nuevo perfil</p>
          <h1>Crear Fiscal</h1>
        </div>
      </div>
      <form className="panel form-grid" onSubmit={(event) => void handleSubmit(event)}>
        <label>Nombre visible<input name="displayName" required /></label>
        <label>Usuario<input name="username" required /></label>
        <label>Contraseña<input name="password" type="password" required /></label>
        <label>Confirmar contraseña<input name="confirmPassword" type="password" required /></label>
        <label>Email<input name="email" type="email" /></label>
        <label>Nº Placa<input name="badgeNumber" /></label>
        <label>División<input name="division" /></label>
        <div className="span-full">
          <ImageUrlInput value={avatarUrl} onChange={setAvatarUrl} shape="circle" label="Avatar del fiscal" />
        </div>
        <label>
          Rol
          <select name="role" defaultValue="PASANTE">
            {ROLE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        {errorMessage !== null ? <p className="error-message">{errorMessage}</p> : null}
        <button className="primary-button" type="submit" disabled={isSubmitting}>{isSubmitting ? "Guardando..." : "Guardar fiscal"}</button>
      </form>
    </div>
  );
}
