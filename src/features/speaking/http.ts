import { refreshSession } from "@/features/auth/api";

/** Error raised for any failed Speaking request, carrying problem-details data. */
export class SpeakingApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = "SpeakingApiError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/** Maps `{ errors: { Field: ["msg"] } }` to `{ field: "msg" }`. */
function fieldErrors(body: unknown) {
  if (!isRecord(body) || !isRecord(body.errors)) return {};
  return Object.fromEntries(
    Object.entries(body.errors).flatMap(([key, value]) =>
      Array.isArray(value) && typeof value[0] === "string"
        ? [[key.charAt(0).toLowerCase() + key.slice(1), value[0]]]
        : [],
    ),
  );
}

async function failure(response: Response, fallback: string) {
  const body: unknown = await response.json().catch(() => null);
  const title =
    isRecord(body) && typeof body.title === "string" ? body.title : fallback;
  return new SpeakingApiError(response.status, title, fieldErrors(body));
}

async function refreshOnce() {
  if (typeof navigator !== "undefined" && navigator.locks) {
    await navigator.locks.request("toeicmaster-refresh", () =>
      refreshSession(),
    );
    return;
  }
  await refreshSession();
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  json?: unknown;
  form?: FormData;
  signal?: AbortSignal;
  /** Retry once after refreshing the session on 401 (admin endpoints). */
  refresh?: boolean;
  fallback: string;
}

/** Sends a same-origin BFF request and returns parsed JSON, or `null` for 204. */
export async function speakingRequest(
  path: string,
  options: RequestOptions,
): Promise<unknown> {
  const send = () =>
    fetch(path, {
      method: options.method ?? "GET",
      headers: {
        Accept: "application/json",
        ...(options.json !== undefined
          ? { "Content-Type": "application/json" }
          : {}),
      },
      body:
        options.form ??
        (options.json !== undefined ? JSON.stringify(options.json) : undefined),
      signal: options.signal,
      cache: "no-store",
    });
  let response: Response;
  try {
    response = await send();
    if (
      response.status === 401 &&
      options.refresh &&
      !options.signal?.aborted
    ) {
      try {
        await refreshOnce();
      } catch {
        throw new SpeakingApiError(401, "Phiên đăng nhập đã hết hạn.");
      }
      response = await send();
    }
  } catch (cause) {
    if (cause instanceof SpeakingApiError) throw cause;
    if (options.signal?.aborted) throw cause;
    throw new SpeakingApiError(502, "Không thể kết nối dịch vụ.");
  }
  if (!response.ok) throw await failure(response, options.fallback);
  if (response.status === 204) return null;
  return response.json().catch(() => {
    throw new SpeakingApiError(502, options.fallback);
  });
}
