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
  | "SYSTEM_CONFIG";

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

interface AuthContextValue {
  accessToken: string | null;
  user: UserSession | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    window.history.replaceState({}, document.title, window.location.pathname);
    void refreshUser().finally(() => setIsLoading(false));
  }, []);

  const refreshUser = async (): Promise<void> => {
    const result = await apiRequest<AuthPayload>("/api/auth/refresh", {
      method: "POST",
      body: "{}"
    });

    if (!result.error) {
      setAccessToken(result.data.accessToken);
      setUser(result.data.user);
    }
  };

  const login = async (username: string, password: string): Promise<string | null> => {
    const result = await apiRequest<AuthPayload>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password })
    });

    if (result.error) {
      return result.message;
    }

    setAccessToken(result.data.accessToken);
    setUser(result.data.user);
    return null;
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

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (context === null) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}

