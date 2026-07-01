import { ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/auth-context";
import { getHomeActionLabel, getHomeRoute, LOGIN_ROUTE } from "../../utils/home";

export function ForbiddenPage(): JSX.Element {
  const { user } = useAuth();
  const homeRoute = user === null ? LOGIN_ROUTE : getHomeRoute(user);
  const actionLabel = user === null ? "Iniciar sesión" : getHomeActionLabel(user);

  return (
    <div className="page narrow">
      <section className="panel empty-state">
        <div className="empty-icon"><ShieldAlert size={30} /></div>
        <div>
          <p>No tienes acceso a esta sección.</p>
          <small>Tu rol actual no incluye el permiso necesario para abrir esta vista.</small>
        </div>
        <Link className="secondary-link" to={homeRoute}>{actionLabel}</Link>
      </section>
    </div>
  );
}
