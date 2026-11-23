import { refreshSession } from "@/features/auth/api";
import { isNonEmptyString, isRecord, isStringArray } from "@/shared/lib/guards";

const REFRESH_LOCK_NAME = "toeicmaster-refresh";
const DEFAULT_ERROR_MESSAGE = "Unable to connect to the service.";

let inFlightRefresh: Promise<void> | null = null;

/** Normalized HTTP error parsed from RFC 9457 ProblemDetails or network failures. */
export class HttpError extends Error {
  readonly status: number;
  readonly title?: string;
  readonly detail?: string;
  readonly code: string | null;
  readonly traceId: string | null;
  readonly fieldErrors: Record<string, string[]>;
  readonly retryAfterSeconds: number | null;
  readonly raw?: unknown;

  constructor(
    status: number,
    message: string,
    options?: {
      title?: string;
      detail?: string;
      code?: string | null;
      traceId?: string | null;
      fieldErrors?: Record<string, string[]>;
      retryAfterSeconds?: number | null;
      raw?: unknown;
    },
  ) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.title = options?.title;
    this.detail = options?.detail;
    this.code = options?.code ?? null;
    this.traceId = options?.traceId ?? null;
    this.fieldErrors = options?.fieldErrors ?? {};
    this.retryAfterSeconds = options?.retryAfterSeconds ?? null;
    this.raw = options?.raw;
  }

  /** Returns the first error message for each invalid field. */
  firstFieldErrors(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, messages] of Object.entries(this.fieldErrors)) {
      if (messages.length > 0) result[key] = messages[0];
    }
    return result;
  }
}

function parseRetryAfterSeconds(
  retryAfterHeader?: string | null,
): number | null {
  if (!isNonEmptyString(retryAfterHeader)) return null;
  const trimmed = retryAfterHeader.trim();
  if (/^\d+$/.test(trimmed)) {
    const seconds = Number(trimmed);
    return Number.isFinite(seconds) && seconds >= 0 ? seconds : null;
  }
  const timestamp = Date.parse(trimmed);
  if (!Number.isFinite(timestamp)) return null;
  return Math.max(0, Math.ceil((timestamp - Date.now()) / 1000));
}

function normalizeFieldErrors(rawErrors: unknown): Record<string, string[]> {
  if (!isRecord(rawErrors)) return {};
  const normalized: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(rawErrors)) {
    if (!isStringArray(value)) continue;
    const filtered = value.filter((item) => item.length > 0);
    if (filtered.length === 0) continue;
    const lowerKey = key.charAt(0).toLowerCase() + key.slice(1);
    normalized[lowerKey] = filtered;
  }
  return normalized;
}

/** Parses an RFC 9457 ProblemDetails payload into a typed HttpError. */
export function parseProblemDetails(
  raw: unknown,
  status: number,
  fallbackMessage = DEFAULT_ERROR_MESSAGE,
  retryAfterHeader?: string | null,
): HttpError {
  const retryAfterSeconds = parseRetryAfterSeconds(retryAfterHeader);
  if (!isRecord(raw)) {
    return new HttpError(status, fallbackMessage, {
      retryAfterSeconds,
      raw,
    });
  }

  const title = isNonEmptyString(raw.title) ? raw.title : undefined;
  const detail = isNonEmptyString(raw.detail) ? raw.detail : undefined;
  const code = isNonEmptyString(raw.code) ? raw.code : null;
  const traceId = isNonEmptyString(raw.traceId) ? raw.traceId : null;
  const fieldErrors = normalizeFieldErrors(raw.errors);
  const message = title ?? detail ?? fallbackMessage;

  return new HttpError(status, message, {
    title,
    detail,
    code,
    traceId,
    fieldErrors,
    retryAfterSeconds,
    raw,
  });
}

/** Coordinates concurrent session refreshes across tabs (Web Locks) or in-memory single-flight fallback. */
export async function refreshSessionLocked(
  refreshFn: () => Promise<unknown> = refreshSession,
): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.locks) {
    await navigator.locks.request(REFRESH_LOCK_NAME, async () => {
      await refreshFn();
    });
    return;
  }

  if (!inFlightRefresh) {
    inFlightRefresh = (async () => {
      await refreshFn();
    })().finally(() => {
      inFlightRefresh = null;
    });
  }
  await inFlightRefresh;
}

export interface FetchWithAuthOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  json?: unknown;
  form?: FormData;
  headers?: HeadersInit;
  signal?: AbortSignal;
  credentials?: RequestCredentials;
  cache?: RequestCache;
  refreshOn401?: boolean;
  refreshFn?: () => Promise<unknown>;
}

function isAbortError(error: unknown, signal?: AbortSignal): boolean {
  if (signal?.aborted) return true;
  return error instanceof DOMException && error.name === "AbortError";
}

/** Executes fetch with automatic single-retry session refresh on 401 and AbortSignal safety. */
export async function fetchWithAuthRefresh(
  path: string,
  options?: FetchWithAuthOptions,
): Promise<Response> {
  const headers = new Headers(options?.headers);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }
  if (options?.json !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const body =
    options?.form ??
    (options?.json !== undefined ? JSON.stringify(options.json) : undefined);

  const send = () =>
    fetch(path, {
      method: options?.method ?? "GET",
      headers,
      body,
      signal: options?.signal,
      cache: options?.cache ?? "no-store",
      ...(options?.credentials ? { credentials: options.credentials } : {}),
    });

  let response: Response;
  try {
    response = await send();
    if (
      response.status === 401 &&
      options?.refreshOn401 !== false &&
      !options?.signal?.aborted
    ) {
      try {
        await refreshSessionLocked(options?.refreshFn);
      } catch (refreshError) {
        if (isAbortError(refreshError, options?.signal)) throw refreshError;
        throw new HttpError(401, "Your session has expired.");
      }
      if (options?.signal?.aborted) {
        throw (
          options.signal.reason ??
          new DOMException("The operation was aborted.", "AbortError")
        );
      }
      response = await send();
    }
  } catch (cause) {
    if (cause instanceof HttpError) throw cause;
    if (isAbortError(cause, options?.signal)) throw cause;
    throw new HttpError(502, DEFAULT_ERROR_MESSAGE);
  }

  return response;
}

export interface RequestJsonOptions<T> extends FetchWithAuthOptions {
  parse: (raw: unknown) => T;
  fallbackMessage?: string;
  invalidPayloadMessage?: string;
}

/** Sends an auth-aware request, validates non-OK ProblemDetails, and parses JSON via explicit boundary parser. */
export async function requestJson<T>(
  path: string,
  options: RequestJsonOptions<T>,
): Promise<T> {
  const fallback = options.fallbackMessage ?? DEFAULT_ERROR_MESSAGE;
  const response = await fetchWithAuthRefresh(path, options);

  if (!response.ok) {
    const raw: unknown = await response.json().catch(() => null);
    throw parseProblemDetails(
      raw,
      response.status,
      fallback,
      response.headers.get("retry-after"),
    );
  }

  let raw: unknown;
  try {
    raw = await response.json();
  } catch {
    throw new HttpError(
      502,
      options.invalidPayloadMessage ?? "Invalid response payload.",
    );
  }

  try {
    return options.parse(raw);
  } catch (cause) {
    if (cause instanceof HttpError) throw cause;
    throw new HttpError(
      502,
      options.invalidPayloadMessage ?? "Invalid response payload.",
      { raw },
    );
  }
}

/** Sends an auth-aware request where a 204/empty success body is expected. */
export async function requestVoid(
  path: string,
  options?: FetchWithAuthOptions & { fallbackMessage?: string },
): Promise<void> {
  const fallback = options?.fallbackMessage ?? DEFAULT_ERROR_MESSAGE;
  const response = await fetchWithAuthRefresh(path, options);

  if (!response.ok) {
    const raw: unknown = await response.json().catch(() => null);
    throw parseProblemDetails(
      raw,
      response.status,
      fallback,
      response.headers.get("retry-after"),
    );
  }
}
