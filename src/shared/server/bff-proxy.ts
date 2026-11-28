import { isIP } from "node:net";
import { NextResponse } from "next/server";
import { readSession, type AuthSession } from "@/features/auth/server/session";

export type BffAuthPolicy = "public" | "optional" | "user" | "admin";
export type BffBodyMode =
  "none" | "json" | "optional-json" | "multipart" | "raw";

export interface BffProxyRouteConfig {
  upstreamPath: string | ((request: Request) => string);
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  auth: BffAuthPolicy;
  sameOrigin?: boolean;
  bodyMode?: BffBodyMode;
  maxBodyBytes?: number;
  timeoutMs?: number;
  extraHeaders?: Record<string, string>;
  missingBaseUrlMessage?: string;
  unreachableMessage?: string;
  timeoutMessage?: string;
  oversizeMessage?: string;
}

const SESSION_COOKIE_NAME = "toeicmaster_session";
const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_BODY_BYTES = 10 * 1024 * 1024;

function problemJson(status: number, title: string): NextResponse {
  return NextResponse.json(
    { title, status },
    {
      status,
      headers: {
        "Content-Type": "application/problem+json",
        "Cache-Control": "no-store",
      },
    },
  );
}

function sanitizeHeaderValue(value: string | null): string | null {
  if (!value) return null;
  const cleaned = value.replace(/[\r\n\0]/g, "").trim();
  return cleaned.length > 0 ? cleaned : null;
}

/** Validates API_BASE_URL (http/https only, no embedded credentials) and returns its origin/base URL or null. */
export function resolveBackendBaseUrl(): string | null {
  const raw = process.env.API_BASE_URL ?? "http://localhost:5287";
  try {
    const parsed = new URL(raw);
    if (
      (parsed.protocol !== "http:" && parsed.protocol !== "https:") ||
      parsed.username ||
      parsed.password
    ) {
      return null;
    }
    return parsed.origin;
  } catch {
    return null;
  }
}

/** Verifies the incoming request Origin header matches the target request origin. */
export function isSameOrigin(request: Request): boolean {
  try {
    return request.headers.get("origin") === new URL(request.url).origin;
  } catch {
    return false;
  }
}

function normalizeIpToken(raw: string): string | null {
  const cleaned = sanitizeHeaderValue(raw);
  if (!cleaned) return null;

  if (cleaned.startsWith("[")) {
    const closeIdx = cleaned.indexOf("]");
    if (closeIdx > 1) {
      const candidate = cleaned.slice(1, closeIdx);
      const rest = cleaned.slice(closeIdx + 1);
      if ((rest === "" || /^:\d+$/.test(rest)) && isIP(candidate) === 6) {
        return candidate;
      }
      return null;
    }
  }

  if (isIP(cleaned) !== 0) {
    return cleaned;
  }

  const lastColon = cleaned.lastIndexOf(":");
  if (lastColon > 0 && cleaned.indexOf(":") === lastColon) {
    const host = cleaned.slice(0, lastColon);
    const port = cleaned.slice(lastColon + 1);
    if (/^\d+$/.test(port) && isIP(host) === 4) {
      return host;
    }
  }

  return null;
}

function parseIpList(raw: string | null): string[] {
  const cleaned = sanitizeHeaderValue(raw);
  if (!cleaned) return [];
  return cleaned
    .split(",")
    .map((part) => normalizeIpToken(part))
    .filter((ip): ip is string => ip !== null);
}

/** Extracts validated client IP and protocol headers for upstream rate limiting. */
export function extractForwardedClientHeaders(
  request: Request,
): Record<string, string> {
  const result: Record<string, string> = {};

  const cfConnectingIp = normalizeIpToken(
    request.headers.get("cf-connecting-ip") ?? "",
  );
  if (cfConnectingIp) {
    result["X-Forwarded-For"] = cfConnectingIp;
  } else {
    const vercelIps = parseIpList(
      request.headers.get("x-vercel-forwarded-for"),
    );
    if (vercelIps.length > 0) {
      result["X-Forwarded-For"] = vercelIps[0];
    } else {
      const realIp = normalizeIpToken(request.headers.get("x-real-ip") ?? "");
      if (realIp) {
        result["X-Forwarded-For"] = realIp;
      } else {
        const forwardedIps = parseIpList(
          request.headers.get("x-forwarded-for"),
        );
        if (forwardedIps.length > 0) {
          result["X-Forwarded-For"] = forwardedIps.join(", ");
        }
      }
    }
  }

  const proto = sanitizeHeaderValue(
    request.headers.get("x-forwarded-proto"),
  )?.toLowerCase();
  if (proto === "http" || proto === "https") {
    result["X-Forwarded-Proto"] = proto;
  }

  return result;
}

async function readBoundedBytes(
  request: Request,
  maxBytes: number,
  oversizeMessage = "Uploaded payload exceeds the size limit.",
): Promise<ArrayBuffer | NextResponse> {
  const declaredHeader = request.headers.get("content-length");
  if (declaredHeader !== null) {
    const declared = Number(declaredHeader);
    if (Number.isFinite(declared) && declared > maxBytes) {
      return problemJson(413, oversizeMessage);
    }
  }

  const reader = request.body?.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  if (reader) {
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > maxBytes) {
          void reader.cancel().catch(() => {});
          return problemJson(413, oversizeMessage);
        }
        if (value.byteLength > 0) chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
  }

  const body = new ArrayBuffer(total);
  const bytes = new Uint8Array(body);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

export async function readBoundedBody(
  request: Request,
  maxBytes: number,
  oversizeMessage = "Uploaded payload exceeds the size limit.",
): Promise<{ body: ArrayBuffer; contentType: string } | Response> {
  const body = await readBoundedBytes(request, maxBytes, oversizeMessage);
  if (body instanceof Response) return body;
  return { body, contentType: request.headers.get("content-type") ?? "" };
}

export interface ReadBoundedJsonOk {
  ok: true;
  data: unknown;
}

export interface ReadBoundedJsonError {
  ok: false;
  response: NextResponse;
}

/** Streams and parses a JSON request body while enforcing a hard byte limit before parsing. */
export async function readBoundedJson(
  request: Request,
  maxBytes: number,
  options?: {
    oversizeMessage?: string;
    invalidMessage?: string;
    requireJsonHeader?: boolean;
  },
): Promise<ReadBoundedJsonOk | ReadBoundedJsonError> {
  const invalidMessage = options?.invalidMessage ?? "Invalid JSON payload.";
  if (options?.requireJsonHeader) {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return {
        ok: false,
        response: problemJson(
          400,
          options.invalidMessage ?? "Request body must be in JSON format.",
        ),
      };
    }
  }

  const bytes = await readBoundedBytes(
    request,
    maxBytes,
    options?.oversizeMessage ?? "Request payload exceeds the size limit.",
  );
  if (bytes instanceof NextResponse) {
    return { ok: false, response: bytes };
  }

  const text = new TextDecoder().decode(bytes);
  if (!text.trim()) {
    return { ok: false, response: problemJson(400, invalidMessage) };
  }

  try {
    return { ok: true, data: JSON.parse(text) as unknown };
  } catch {
    return { ok: false, response: problemJson(400, invalidMessage) };
  }
}

/** Streams a multipart request body while enforcing a hard byte limit without full-body over-buffering. */
export async function readMultipartStream(
  request: Request,
  maxBytes: number,
  oversizeMessage = "Uploaded payload exceeds the size limit.",
): Promise<{ body: ArrayBuffer; contentType: string } | Response> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.startsWith("multipart/form-data")) {
    return problemJson(400, "Multipart form data is required.");
  }

  const body = await readBoundedBytes(request, maxBytes, oversizeMessage);
  if (body instanceof Response) {
    return body;
  }
  return { body, contentType };
}

/** Copies safe headers and response body from upstream while enforcing anti-sniff and cache controls. */
export async function relayUpstreamResponse(
  response: Response,
): Promise<Response> {
  const contentType = response.headers.get("content-type");
  const isMedia = Boolean(
    contentType &&
    (contentType.startsWith("image/") || contentType.startsWith("audio/")),
  );

  const headers = new Headers({
    "Cache-Control": isMedia ? "private, no-store" : "no-store",
  });
  if (contentType) headers.set("Content-Type", contentType);

  const retryAfter = response.headers.get("retry-after");
  if (retryAfter) headers.set("Retry-After", retryAfter);

  const contentDisposition = response.headers.get("content-disposition");
  if (contentDisposition) {
    headers.set("Content-Disposition", contentDisposition);
  }

  if (isMedia) {
    headers.set("X-Content-Type-Options", "nosniff");
    const contentLength = response.headers.get("content-length");
    if (contentLength) headers.set("Content-Length", contentLength);
  }

  return new NextResponse(response.status === 204 ? null : response.body, {
    status: response.status,
    headers,
  });
}

function extractSessionCookieValue(request: Request): string | undefined {
  const maybeNext = request as Request & {
    cookies?: { get(name: string): { value: string } | undefined };
  };
  if (typeof maybeNext.cookies?.get === "function") {
    const value = maybeNext.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (value !== undefined) return value;
  }

  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(";")) {
    const eqIndex = part.indexOf("=");
    if (eqIndex === -1) continue;
    if (part.slice(0, eqIndex).trim() !== SESSION_COOKIE_NAME) continue;
    const raw = part.slice(eqIndex + 1).trim();
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }
  return undefined;
}

function readSafeSession(request: Request): AuthSession | null {
  const raw = extractSessionCookieValue(request);
  if (!raw) return null;
  try {
    return readSession(raw);
  } catch {
    return null;
  }
}

function resolveAuthHeaders(
  request: Request,
  policy: BffAuthPolicy,
): { ok: true; authorization?: string } | { ok: false; response: Response } {
  if (policy === "public") return { ok: true };

  const session = readSafeSession(request);
  const now = Date.now();
  const refreshValid =
    session !== null && Date.parse(session.refreshTokenExpiresAtUtc) > now;
  const accessValid =
    session !== null && Date.parse(session.accessTokenExpiresAtUtc) > now;

  if (policy === "optional") {
    if (!refreshValid) return { ok: true };
    if (!accessValid) {
      return {
        ok: false,
        response: problemJson(401, "Your session has expired."),
      };
    }
    return { ok: true, authorization: `Bearer ${session.accessToken}` };
  }

  if (!refreshValid || !accessValid) {
    return {
      ok: false,
      response: problemJson(401, "Please sign in to continue."),
    };
  }

  if (policy === "admin" && session.role !== "ADMIN") {
    return {
      ok: false,
      response: problemJson(
        403,
        "You do not have permission to access this resource.",
      ),
    };
  }

  return { ok: true, authorization: `Bearer ${session.accessToken}` };
}

export function authorizeBffRequest(
  request: Request,
  config: Pick<BffProxyRouteConfig, "auth" | "method" | "sameOrigin">,
): { ok: true; authorization?: string } | { ok: false; response: Response } {
  const method = (config.method ?? request.method).toUpperCase();
  const enforceSameOrigin =
    config.sameOrigin ?? (method !== "GET" && method !== "HEAD");
  if (enforceSameOrigin && !isSameOrigin(request)) {
    return { ok: false, response: problemJson(403, "Invalid request.") };
  }
  return resolveAuthHeaders(request, config.auth);
}

async function resolveRequestBody(
  request: Request,
  bodyMode: BffBodyMode,
  maxBodyBytes: number,
  oversizeMessage?: string,
): Promise<
  | { ok: true; body?: BodyInit; contentType?: string }
  | { ok: false; response: Response }
> {
  if (bodyMode === "none") return { ok: true };

  if (bodyMode === "multipart") {
    const result = await readMultipartStream(
      request,
      maxBodyBytes,
      oversizeMessage,
    );
    if (result instanceof Response) return { ok: false, response: result };
    return {
      ok: true,
      body: result.body,
      contentType: result.contentType,
    };
  }

  if (bodyMode === "json" || bodyMode === "optional-json") {
    const contentType = request.headers.get("content-type") ?? "";
    const hasJsonHeader = contentType.includes("application/json");
    if (bodyMode === "json" && !hasJsonHeader) {
      return {
        ok: false,
        response: problemJson(400, "Request body must be in JSON format."),
      };
    }

    const bytes = await readBoundedBytes(
      request,
      maxBodyBytes,
      oversizeMessage ?? "Request payload exceeds the size limit.",
    );
    if (bytes instanceof Response) {
      return { ok: false, response: bytes };
    }

    const text = new TextDecoder().decode(bytes);
    if (!text.trim()) {
      if (bodyMode === "optional-json") {
        return { ok: true };
      }
      return {
        ok: false,
        response: problemJson(400, "Invalid JSON payload."),
      };
    }

    try {
      JSON.parse(text);
    } catch {
      return {
        ok: false,
        response: problemJson(400, "Invalid JSON payload."),
      };
    }
    return { ok: true, body: text, contentType: "application/json" };
  }

  // raw mode
  const rawBuffer = await readBoundedBytes(
    request,
    maxBodyBytes,
    oversizeMessage ?? "Uploaded payload exceeds the size limit.",
  );
  if (rawBuffer instanceof Response) {
    return { ok: false, response: rawBuffer };
  }
  const contentType = request.headers.get("content-type") ?? undefined;
  return {
    ok: true,
    body: rawBuffer.byteLength > 0 ? rawBuffer : undefined,
    contentType,
  };
}

/** Forwards an incoming Next.js BFF request to the backend API with auth, origin, size, and timeout guarantees. */
export async function forwardBffRequest(
  request: Request,
  config: BffProxyRouteConfig,
): Promise<Response> {
  const method = (config.method ?? request.method).toUpperCase();
  const authResult = authorizeBffRequest(request, config);
  if (!authResult.ok) return authResult.response;

  const bodyMode = config.bodyMode ?? "none";
  const maxBodyBytes = config.maxBodyBytes ?? DEFAULT_MAX_BODY_BYTES;
  const bodyResult = await resolveRequestBody(
    request,
    bodyMode,
    maxBodyBytes,
    config.oversizeMessage,
  );
  if (!bodyResult.ok) return bodyResult.response;

  const baseUrl = resolveBackendBaseUrl();
  if (!baseUrl) {
    return problemJson(
      503,
      config.missingBaseUrlMessage ?? "The service is temporarily unavailable.",
    );
  }

  const path =
    typeof config.upstreamPath === "function"
      ? config.upstreamPath(request)
      : config.upstreamPath;
  if (
    !path.startsWith("/api/") ||
    path.startsWith("//") ||
    path.includes("\\")
  ) {
    return problemJson(400, "Invalid request.");
  }
  let targetUrl: URL;
  try {
    targetUrl = new URL(path, baseUrl);
  } catch {
    return problemJson(
      503,
      config.missingBaseUrlMessage ?? "The service is temporarily unavailable.",
    );
  }
  if (
    targetUrl.origin !== new URL(baseUrl).origin ||
    !targetUrl.pathname.startsWith("/api/")
  ) {
    return problemJson(400, "Invalid request.");
  }

  const headers = new Headers({ Accept: "application/json" });
  if (bodyResult.contentType) {
    headers.set("Content-Type", bodyResult.contentType);
  }
  if (authResult.authorization) {
    headers.set("Authorization", authResult.authorization);
  }
  for (const [key, value] of Object.entries(
    extractForwardedClientHeaders(request),
  )) {
    headers.set(key, value);
  }
  if (config.extraHeaders) {
    for (const [key, value] of Object.entries(config.extraHeaders)) {
      headers.set(key, value);
    }
  }

  const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  try {
    const upstream = await fetch(targetUrl, {
      method,
      headers,
      ...(bodyResult.body !== undefined ? { body: bodyResult.body } : {}),
      cache: "no-store",
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(timeoutMs)]),
    });
    return await relayUpstreamResponse(upstream);
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      return problemJson(
        504,
        config.timeoutMessage ?? "The service took too long to respond.",
      );
    }
    return problemJson(
      502,
      config.unreachableMessage ?? "Unable to connect to the service.",
    );
  }
}

/** Creates a Next.js App Router BFF proxy handler bound to a static route configuration. */
export function createBffProxy(
  config: BffProxyRouteConfig,
): (request: Request) => Promise<Response> {
  return (request: Request) => forwardBffRequest(request, config);
}
