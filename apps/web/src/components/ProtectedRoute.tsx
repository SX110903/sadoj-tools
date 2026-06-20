import { Navigate, Outlet } from "react-router-dom";
import { useAuth, type Permission } from "../auth/auth-context";
import { SkeletonBlock } from "./ui";

export function ProtectedRoute({ permission }: { permission?: Permission }): JSX.Element {
  const { user, isLoading, hasPermission } = useAuth();

  if (isLoading) {
    return (
      <main className="app-shell">
        <section className="login-panel">
          <SkeletonBlock height={180} />
        </section>
      </main>
    );
  }

  if (user === null) {
    return <Navigate to="/login" replace />;
  }

  if (permission !== undefined && !hasPermission(permission)) {
    return (
      <div className="page">
        <h1>Sin permisos</h1>
        <p className="muted">No tienes permisos para acceder a esta sección.</p>
      </div>
    );
  }

  return <Outlet />;
}

