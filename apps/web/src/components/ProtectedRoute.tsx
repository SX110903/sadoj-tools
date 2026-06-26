import { Navigate, Outlet } from "react-router-dom";
import { useAuth, type Permission } from "../auth/auth-context";
import { ForbiddenPage } from "../pages/errors/ForbiddenPage";
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
    return <ForbiddenPage />;
  }

  return <Outlet />;
}
