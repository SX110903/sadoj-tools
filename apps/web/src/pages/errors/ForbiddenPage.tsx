import { ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";

export function ForbiddenPage(): JSX.Element {
  return (
    <div className="page narrow">
      <section className="panel empty-state">
        <div className="empty-icon"><ShieldAlert size={30} /></div>
        <div>
          <p>No tienes acceso a esta sección.</p>
          <small>Tu rol actual no incluye el permiso necesario para abrir esta vista.</small>
        </div>
        <Link className="secondary-link" to="/dashboard">Volver al panel</Link>
      </section>
    </div>
  );
}
