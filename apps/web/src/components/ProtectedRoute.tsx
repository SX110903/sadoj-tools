import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isAcademyOnly, useAuth, type Permission } from "../auth/auth-context";
import { ForbiddenPage } from "../pages/errors/ForbiddenPage";
import { ACADEMY_ROUTE, LOGIN_ROUTE } from "../utils/home";
import { SkeletonBlock } from "./ui";

// Routes available to Academy-only users (rank 0).
const ACADEMY_ONLY_ALLOWED_PREFIXES = [ACADEMY_ROUTE, "/examenes", "/perfil", "/notificaciones"];

function isAcademyAllowedPath(pathname: string): boolean {
  return ACADEMY_ONLY_ALLOWED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function ProtectedRoute({ permission }: { permission?: Permission }): JSX.Element {
  const { user, isLoading, hasPermission } = useAuth();
  const location = useLocation();

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
    return <Navigate to={LOGIN_ROUTE} replace />;
  }

  if (isAcademyOnly(user) && !isAcademyAllowedPath(location.pathname)) {
    return <ForbiddenPage />;
  }

  if (permission !== undefined && !hasPermission(permission)) {
    return <ForbiddenPage />;
  }

  return <Outlet />;
}
