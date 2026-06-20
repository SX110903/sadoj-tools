import { useEffect, useState } from "react";
import { useAuth } from "../auth/auth-context";
import { apiRequest } from "../services/api";

interface SignedUrlPayload {
  url: string;
}

interface SignedUrlState {
  signedUrl: string | null;
  isLoading: boolean;
}

const SIGNED_URL_CACHE = new Map<string, { url: string; expiresAt: number }>();
const CACHE_TTL_MS = 45 * 60 * 1000;

export function useSignedUrl(fileId: string | null | undefined): SignedUrlState {
  const { accessToken } = useAuth();
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (fileId === null || fileId === undefined || fileId.length === 0) {
      setSignedUrl(null);
      setIsLoading(false);
      return;
    }

    const cached = SIGNED_URL_CACHE.get(fileId);

    if (cached !== undefined && cached.expiresAt > Date.now()) {
      setSignedUrl(cached.url);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    const loadSignedUrl = async (): Promise<void> => {
      const result = await apiRequest<SignedUrlPayload>(`/api/files/${fileId}/download`, {}, accessToken);

      if (!isMounted) return;

      if (result.error) {
        setSignedUrl(null);
      } else {
        SIGNED_URL_CACHE.set(fileId, { url: result.data.url, expiresAt: Date.now() + CACHE_TTL_MS });
        setSignedUrl(result.data.url);
      }

      setIsLoading(false);
    };

    void loadSignedUrl();

    return () => {
      isMounted = false;
    };
  }, [accessToken, fileId]);

  return { signedUrl, isLoading };
}
