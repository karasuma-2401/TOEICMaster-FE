import { refreshSession } from "@/features/auth/api";

export class KnowledgeApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = "KnowledgeApiError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function extractFieldErrors(body: unknown): Record<string, string> {
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
  return new KnowledgeApiError(
    response.status,
    title,
    extractFieldErrors(body),
  );
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

export interface KnowledgeRequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  json?: unknown;
  form?: FormData;
  signal?: AbortSignal;
  fallback: string;
}

export async function knowledgeAdminRequest<T>(
  path: string,
  options: KnowledgeRequestOptions,
): Promise<T> {
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
    if (response.status === 401 && !options.signal?.aborted) {
      try {
        await refreshOnce();
      } catch {
        throw new KnowledgeApiError(401, "Phiên đăng nhập đã hết hạn.");
      }
      response = await send();
    }
  } catch (cause) {
    if (cause instanceof KnowledgeApiError) throw cause;
    if (options.signal?.aborted) throw cause;
    throw new KnowledgeApiError(502, "Không thể kết nối dịch vụ.");
  }

  if (!response.ok) throw await failure(response, options.fallback);
  if (response.status === 204) return undefined as T;
  return (await response.json().catch(() => {
    throw new KnowledgeApiError(502, options.fallback);
  })) as T;
}
