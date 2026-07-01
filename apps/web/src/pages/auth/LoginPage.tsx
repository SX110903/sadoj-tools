import { Eye, EyeOff } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/auth-context";
import { getHomeRoute } from "../../utils/home";

export function LoginPage(): JSX.Element {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user !== null) {
    return <Navigate to={getHomeRoute(user)} replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const result = await login(username, password);

      if (!result.success) {
        setErrorMessage(result.message);
        return;
      }

      navigate(getHomeRoute(result.user), { replace: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login-screen">
      <section className="login-card" aria-label="Inicio de sesión">
        <img className="login-logo" src="/logo.webp" alt="SADOJ Fiscalía" />
        <p className="agency-title">SAN ANDREAS DEPARTMENT OF JUSTICE</p>
        <h1>Fiscalía — Sistema Interno</h1>
        <form onSubmit={(event) => void handleSubmit(event)}>
          <label htmlFor="username">Usuario</label>
          <input id="username" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
          <label htmlFor="password">Contraseña</label>
          <div className="password-field">
            <input
              id="password"
              value={password}
              type={showPassword ? "text" : "password"}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
            <button type="button" className="icon-button" aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} onClick={() => setShowPassword((current) => !current)}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errorMessage !== null ? <p className="error-message">{errorMessage}</p> : null}
          <button type="submit" className="primary-button" disabled={isSubmitting}>
            {isSubmitting ? "Iniciando sesión..." : "Iniciar sesión"}
          </button>
        </form>
      </section>
    </main>
  );
}
