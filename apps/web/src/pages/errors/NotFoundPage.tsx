import { SearchX } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/auth-context";
import { getHomeActionLabel, getHomeRoute, LOGIN_ROUTE } from "../../utils/home";

export function NotFoundPage(): JSX.Element {
  const { user } = useAuth();
  const homeRoute = user === null ? LOGIN_ROUTE : getHomeRoute(user);
  const actionLabel = user === null ? "Iniciar sesión" : getHomeActionLabel(user);

  return (
    <div className="page narrow">
      <section className="panel empty-state">
        <div className="empty-icon"><SearchX size={30} /></div>
        <div>
          <p>La ruta solicitada no existe.</p>
          <small>Revisa la dirección o vuelve a una sección disponible del sistema.</small>
        </div>
        <Link className="secondary-link" to={homeRoute}>{actionLabel}</Link>
      </section>
    </div>
  );
}
