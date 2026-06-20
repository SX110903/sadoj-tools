import { toast } from "sonner";

export interface ApiSuccess<T> {
  error: false;
  data: T;
  message?: string;
  meta?: PaginationMeta;
}

export interface ApiFailure {
  error: true;
  code: string;
  message: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

const DEFAULT_ERROR_MESSAGE = "No se pudo completar la solicitud.";

export async function apiRequest<T>(path: string, options: RequestInit = {}, accessToken: string | null = null): Promise<ApiResult<T>> {
  const headers = new Headers(options.headers);
  const method = (options.method ?? "GET").toUpperCase();
  const hasBody = options.body !== undefined && options.body !== null;
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  if (hasBody && !headers.has("Content-Type") && !isFormData) {
    headers.set("Content-Type", "application/json");
  }

  if (accessToken !== null) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(path, {
    ...options,
    headers,
    credentials: "include"
  });
  const payload = (await response.json()) as ApiResult<T>;

  if (!response.ok) {
    const failure: ApiFailure = payload.error
      ? payload
      : {
          error: true,
          code: "REQUEST_ERROR",
          message: DEFAULT_ERROR_MESSAGE
        };
    toast.error(failure.message);
    return failure;
  }

  if (method !== "GET" && !payload.error && payload.message !== undefined) {
    toast.success(payload.message);
  }

  return payload;
}
