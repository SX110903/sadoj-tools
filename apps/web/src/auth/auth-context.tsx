import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../services/api";

export type Permission =
  | "MANAGE_USERS"
  | "MANAGE_ROLES"
  | "MANAGE_SANCTIONS"
  | "CREATE_INVESTIGATION"
  | "VIEW_ALL_INVESTIGATIONS"
  | "VIEW_ASSIGNED_INVESTIGATIONS"
  | "EDIT_INVESTIGATION"
  | "DELETE_INVESTIGATION"
  | "SHARE_INVESTIGATION"
  | "MANAGE_SUBJECTS"
  | "VIEW_SUBJECTS"
  | "ADD_NOTES"
  | "VIEW_NOTES"
  | "MANAGE_ZONES"
  | "UPLOAD_FILES"
  | "MANAGE_WARRANTS"
  | "VIEW_AUDIT_LOG"
  | "SYSTEM_CONFIG"
  | "MANAGE_HR"
  | "PUBLISH_ACADEMY"
  | "MANAGE_ACADEMY"
  | "VIEW_ACADEMY";

export interface UserSession {
  id: string;
  username: string;
  displayName: string;
  email: string | null;
  avatar: string | null;
  badgeNumber: string | null;
  division: string | null;
  bio: string | null;
  active: boolean;
  role: string;
  permissions: readonly Permission[];
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AuthPayload {
  accessToken: string;
  user: UserSession;
}

type LoginResult =
  | { success: true; user: UserSession }
  | { success: false; message: string };

interface AuthContextValue {
  accessToken: string | null;
  user: UserSession | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const AUTH_REFRESHED_EVENT = "sadoj:auth-refreshed";
const AUTH_EXPIRED_EVENT = "sadoj:auth-expired";

export function AuthProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    removeLoginCredentialParams();
    const handleAuthRefreshed = (event: Event): void => {
      const detail = (event as CustomEvent<unknown>).detail;

      if (isAuthPayload(detail)) {
        setAccessToken(detail.accessToken);
        setUser(detail.user);
      }
    };
    const handleAuthExpired = (): void => {
      setAccessToken(null);
      setUser(null);
    };

    window.addEventListener(AUTH_REFRESHED_EVENT, handleAuthRefreshed);
    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    void refreshUser().finally(() => setIsLoading(false));

    return () => {
      window.removeEventListener(AUTH_REFRESHED_EVENT, handleAuthRefreshed);
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    };
  }, []);

  const refreshUser = async (): Promise<void> => {
    const result = await apiRequest<AuthPayload>("/api/auth/refresh", {
      method: "POST",
      body: "{}",
      suppressToast: true
    });

    if (!result.error) {
      setAccessToken(result.data.accessToken);
      setUser(result.data.user);
    }
  };

  const login = async (username: string, password: string): Promise<LoginResult> => {
    const result = await apiRequest<AuthPayload>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password })
    });

    if (result.error) {
      return { success: false, message: result.message };
    }

    setAccessToken(result.data.accessToken);
    setUser(result.data.user);
    return { success: true, user: result.data.user };
  };

  const logout = async (): Promise<void> => {
    if (accessToken !== null) {
      await apiRequest<{ loggedOut: boolean }>("/api/auth/logout", { method: "POST", body: "{}" }, accessToken);
    }

    setAccessToken(null);
    setUser(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      accessToken,
      user,
      isLoading,
      login,
      logout,
      refreshUser,
      hasPermission: (permission) => user?.permissions.includes(permission) ?? false
    }),
    [accessToken, isLoading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function removeLoginCredentialParams(): void {
  const url = new URL(window.location.href);
  const shouldCleanCredentials = url.pathname === "/login" && (url.searchParams.has("username") || url.searchParams.has("password"));

  if (!shouldCleanCredentials) {
    return;
  }

  url.searchParams.delete("username");
  url.searchParams.delete("password");
  window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
}

function isAuthPayload(value: unknown): value is AuthPayload {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const payload = value as Record<string, unknown>;
  return typeof payload.accessToken === "string" && isUserSession(payload.user);
}

function isUserSession(value: unknown): value is UserSession {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const user = value as Record<string, unknown>;
  return (
    typeof user.id === "string" &&
    typeof user.username === "string" &&
    typeof user.displayName === "string" &&
    Array.isArray(user.permissions)
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (context === null) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}

// Rank 0 (Legal Staff) has no operational access and is limited to Academy, profile, and exams.
export function isAcademyOnly(user: UserSession | null): boolean {
  return user !== null && !user.permissions.includes("VIEW_ASSIGNED_INVESTIGATIONS");
}
