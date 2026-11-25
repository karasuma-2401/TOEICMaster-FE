import { HttpError, fetchWithAuthRefresh } from "@/shared/api/http";
import { isRecord } from "@/shared/lib/guards";

/** Error raised for any failed Speaking request, carrying problem-details data. */
export class SpeakingApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly fieldErrors: Record<string, string[]> = {},
    public readonly code: string | null = null,
    public readonly traceId: string | null = null,
  ) {
    super(message);
    this.name = "SpeakingApiError";
  }
}

/** Preserve every validation message, including multiple duplicate-content pairs. */
function fieldErrors(body: unknown) {
  if (!isRecord(body) || !isRecord(body.errors)) return {};
  return Object.fromEntries(
    Object.entries(body.errors).flatMap(([key, value]) =>
      Array.isArray(value) && value.some((item) => typeof item === "string")
        ? [
            [
              key.charAt(0).toLowerCase() + key.slice(1),
              value.filter((item): item is string => typeof item === "string"),
            ],
          ]
        : [],
    ),
  );
}

async function failure(response: Response, fallback: string) {
  const body: unknown = await response.json().catch(() => null);
  const title =
    isRecord(body) && typeof body.title === "string" ? body.title : fallback;
  return new SpeakingApiError(
    response.status,
    title,
    fieldErrors(body),
    isRecord(body) && typeof body.code === "string" ? body.code : null,
    isRecord(body) && typeof body.traceId === "string" ? body.traceId : null,
  );
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  json?: unknown;
  form?: FormData;
  signal?: AbortSignal;
  /**
   * Retry once after refreshing the session on 401. Enabled by default for
   * every Speaking request (learner and admin); pass `false` to opt out.
   */
  refresh?: boolean;
  fallback: string;
}

/**
 * Sends a same-origin BFF request through the shared auth-aware client
 * (single-flight 401 refresh + retry) and returns parsed JSON, or `null` for 204.
 */
export async function speakingRequest(
  path: string,
  options: RequestOptions,
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetchWithAuthRefresh(path, {
      method: options.method ?? "GET",
      ...(options.json !== undefined ? { json: options.json } : {}),
      ...(options.form ? { form: options.form } : {}),
      ...(options.signal ? { signal: options.signal } : {}),
      refreshOn401: options.refresh !== false,
    });
  } catch (cause) {
    if (options.signal?.aborted) throw cause;
    if (cause instanceof HttpError && cause.status === 401)
      throw new SpeakingApiError(401, "Your session has expired.");
    throw new SpeakingApiError(502, "Could not connect to the service.");
  }
  if (!response.ok) throw await failure(response, options.fallback);
  if (response.status === 204) return null;
  return response.json().catch(() => {
    throw new SpeakingApiError(502, options.fallback);
  });
}
