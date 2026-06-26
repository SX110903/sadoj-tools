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

export interface ApiRequestOptions extends RequestInit {
  suppressToast?: boolean;
}

export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

const DEFAULT_ERROR_MESSAGE = "No se pudo completar la solicitud.";
const AUTH_REFRESHED_EVENT = "sadoj:auth-refreshed";
const AUTH_EXPIRED_EVENT = "sadoj:auth-expired";
const NETWORK_RETRY_DELAY_MS = 350;
const MAX_NETWORK_RETRIES = 1;

interface AuthRefreshPayload {
  accessToken: string;
  user: unknown;
}

let refreshPromise: Promise<AuthRefreshPayload | null> | null = null;

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}, accessToken: string | null = null): Promise<ApiResult<T>> {
  return sendRequest(path, options, accessToken, true, 0);
}

async function sendRequest<T>(
  path: string,
  options: ApiRequestOptions,
  accessToken: string | null,
  allowRefresh: boolean,
  networkRetryCount: number
): Promise<ApiResult<T>> {
  const { suppressToast = false, ...requestOptions } = options;
  const headers = new Headers(requestOptions.headers);
  const method = (requestOptions.method ?? "GET").toUpperCase();
  const hasBody = requestOptions.body !== undefined && requestOptions.body !== null;
  const isFormData = typeof FormData !== "undefined" && requestOptions.body instanceof FormData;

  if (hasBody && !headers.has("Content-Type") && !isFormData) {
    headers.set("Content-Type", "application/json");
  }

  if (accessToken !== null) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  let response: Response;

  try {
    response = await fetch(path, {
      ...requestOptions,
      headers,
      credentials: "include"
    });
  } catch {
    if (canRetryNetworkRequest(method, requestOptions.signal, networkRetryCount)) {
      await delay(NETWORK_RETRY_DELAY_MS);
      return sendRequest(path, options, accessToken, allowRefresh, networkRetryCount + 1);
    }

    const failure = buildFailure("NETWORK_ERROR", "No se pudo conectar con el servidor.");
    showErrorToast(failure, suppressToast);
    return failure;
  }

  let parsedPayload: unknown;

  try {
    parsedPayload = await parseResponsePayload(response);
  } catch {
    const failure = buildFailure("INVALID_RESPONSE", DEFAULT_ERROR_MESSAGE);
    showErrorToast(failure, suppressToast);
    return failure;
  }

  if (!response.ok) {
    if (response.status === 401 && accessToken !== null && allowRefresh && canRefreshForPath(path)) {
      const refreshed = await refreshAccessToken();

      if (refreshed !== null) {
        return sendRequest<T>(path, options, refreshed.accessToken, false, networkRetryCount);
      }
    }

    const failure = isApiFailure(parsedPayload) ? parsedPayload : buildFailure("REQUEST_ERROR", DEFAULT_ERROR_MESSAGE);
    showErrorToast(failure, suppressToast);
    return failure;
  }

  if (!isRecord(parsedPayload)) {
    const failure = buildFailure("INVALID_RESPONSE", DEFAULT_ERROR_MESSAGE);
    showErrorToast(failure, suppressToast);
    return failure;
  }

  const payload = parsedPayload as unknown as ApiResult<T>;

  if (method !== "GET" && !payload.error && payload.message !== undefined) {
    toast.success(payload.message);
  }

  return payload;
}

async function refreshAccessToken(): Promise<AuthRefreshPayload | null> {
  if (refreshPromise === null) {
    refreshPromise = requestTokenRefresh().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

async function requestTokenRefresh(): Promise<AuthRefreshPayload | null> {
  let response: Response;

  try {
    response = await fetch("/api/auth/refresh", {
      method: "POST",
      body: "{}",
      headers: { "Content-Type": "application/json" },
      credentials: "include"
    });
  } catch {
    dispatchAuthExpired();
    return null;
  }

  let parsedPayload: unknown;

  try {
    parsedPayload = await response.json();
  } catch {
    dispatchAuthExpired();
    return null;
  }

  if (!response.ok) {
    dispatchAuthExpired();
    return null;
  }

  if (!isApiSuccess(parsedPayload) || !isAuthRefreshPayload(parsedPayload.data)) {
    dispatchAuthExpired();
    return null;
  }

  dispatchAuthRefreshed(parsedPayload.data);
  return parsedPayload.data;
}

function buildFailure(code: string, message: string): ApiFailure {
  return { error: true, code, message };
}

async function parseResponsePayload(response: Response): Promise<unknown> {
  const text = await response.text();

  if (text.trim().length === 0) {
    return response.ok ? { error: false, data: null } : buildFailure("EMPTY_RESPONSE", DEFAULT_ERROR_MESSAGE);
  }

  return JSON.parse(text) as unknown;
}

function canRetryNetworkRequest(method: string, signal: AbortSignal | null | undefined, retryCount: number): boolean {
  return method === "GET" && retryCount < MAX_NETWORK_RETRIES && signal?.aborted !== true;
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

function showErrorToast(failure: ApiFailure, suppressToast: boolean): void {
  if (!suppressToast) {
    toast.error(failure.message);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isApiFailure(value: unknown): value is ApiFailure {
  return isRecord(value) && value.error === true && typeof value.code === "string" && typeof value.message === "string";
}

function isApiSuccess(value: unknown): value is ApiSuccess<unknown> {
  return isRecord(value) && value.error === false && "data" in value;
}

function isAuthRefreshPayload(value: unknown): value is AuthRefreshPayload {
  return isRecord(value) && typeof value.accessToken === "string" && "user" in value;
}

function canRefreshForPath(path: string): boolean {
  return !path.startsWith("/api/auth/");
}

function dispatchAuthRefreshed(payload: AuthRefreshPayload): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent<AuthRefreshPayload>(AUTH_REFRESHED_EVENT, { detail: payload }));
  }
}

function dispatchAuthExpired(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
  }
}
