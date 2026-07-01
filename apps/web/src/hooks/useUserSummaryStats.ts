import { useEffect, useState } from "react";
import { useAuth } from "../auth/auth-context";
import { apiRequest } from "../services/api";
import type { DecorationAward, Sanction } from "../types/sadoj";

export interface UserSummaryStats {
  investigations: number;
  decorations: number;
  activeSanctions: number;
}

export function useUserSummaryStats(userId: string | null): UserSummaryStats | null {
  const { accessToken } = useAuth();
  const [stats, setStats] = useState<UserSummaryStats | null>(null);

  useEffect(() => {
    if (userId === null) {
      return;
    }

    let active = true;

    const load = async (): Promise<void> => {
      const [investigations, decorations, sanctions] = await Promise.all([
        apiRequest<unknown[]>(`/api/users/${encodeURIComponent(userId)}/investigations`, { suppressToast: true }, accessToken),
        apiRequest<DecorationAward[]>(`/api/users/${encodeURIComponent(userId)}/decorations`, { suppressToast: true }, accessToken),
        apiRequest<Sanction[]>(`/api/sanctions/by-user/${encodeURIComponent(userId)}`, { suppressToast: true }, accessToken)
      ]);

      if (!active) {
        return;
      }

      setStats({
        investigations: investigations.error ? 0 : investigations.data.length,
        decorations: decorations.error ? 0 : decorations.data.length,
        activeSanctions: sanctions.error ? 0 : sanctions.data.filter((sanction) => sanction.active).length
      });
    };

    void load();

    return () => {
      active = false;
    };
  }, [accessToken, userId]);

  return stats;
}
