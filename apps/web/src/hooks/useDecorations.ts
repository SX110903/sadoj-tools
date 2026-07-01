import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/auth-context";
import { apiRequest } from "../services/api";
import type { Decoration, DecorationAward } from "../types/sadoj";

interface UserDecorationsState {
  awards: DecorationAward[] | null;
  errorMessage: string | null;
  refresh: () => Promise<void>;
}

export function useUserDecorations(userId: string | null): UserDecorationsState {
  const { accessToken } = useAuth();
  const [awards, setAwards] = useState<DecorationAward[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    if (userId === null) {
      setAwards([]);
      return;
    }

    const result = await apiRequest<DecorationAward[]>(`/api/users/${encodeURIComponent(userId)}/decorations`, { suppressToast: true }, accessToken);

    if (result.error) {
      setAwards([]);
      setErrorMessage(result.message);
      return;
    }

    setAwards(result.data);
    setErrorMessage(null);
  }, [accessToken, userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { awards, errorMessage, refresh };
}

export function useDecorationCatalog(enabled: boolean): { catalog: Decoration[]; refresh: () => Promise<void> } {
  const { accessToken } = useAuth();
  const [catalog, setCatalog] = useState<Decoration[]>([]);

  const refresh = useCallback(async (): Promise<void> => {
    const result = await apiRequest<Decoration[]>("/api/decorations", { suppressToast: true }, accessToken);
    if (!result.error) {
      setCatalog(result.data);
    }
  }, [accessToken]);

  useEffect(() => {
    if (enabled) {
      void refresh();
    }
  }, [enabled, refresh]);

  return { catalog, refresh };
}
