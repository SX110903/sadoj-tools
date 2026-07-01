import { isAcademyOnly, type UserSession } from "../auth/auth-context";

export const ACADEMY_ROUTE = "/academia";
export const DASHBOARD_ROUTE = "/dashboard";
export const LOGIN_ROUTE = "/login";

export function getHomeRoute(user: UserSession): string {
  return isAcademyOnly(user) ? ACADEMY_ROUTE : DASHBOARD_ROUTE;
}

export function getHomeActionLabel(user: UserSession): string {
  return getHomeRoute(user) === ACADEMY_ROUTE ? "Ir a la Academia" : "Volver al panel";
}
