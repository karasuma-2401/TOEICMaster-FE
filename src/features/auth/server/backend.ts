import { NextRequest, NextResponse } from "next/server";
import type {
  AuthenticatedRole,
  AuthenticatedUser,
  AuthSession,
} from "./session";

type Errors = Record<string, string[]>;

export function problem(status: number, title: string, errors?: Errors) {
  return NextResponse.json(
    { title, status, ...(errors ? { errors } : {}) },
    {
      status,
      headers: {
        "Content-Type": "application/problem+json",
        "Cache-Control": "no-store",
      },
    },
  );
}

export function rateLimited(response: Response) {
  const retryAfter = response.headers.get("retry-after");
  return NextResponse.json(
    {
      title: "Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.",
      status: 429,
    },
    {
      status: 429,
      headers: {
        "Content-Type": "application/problem+json",
        "Cache-Control": "no-store",
        ...(retryAfter ? { "Retry-After": retryAfter } : {}),
      },
    },
  );
}

export function sameOrigin(request: NextRequest): boolean {
  return request.headers.get("origin") === new URL(request.url).origin;
}

export async function readBody(
  request: NextRequest,
): Promise<Record<string, unknown> | null> {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return null;
  const value: unknown = await request.json().catch(() => null);
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export async function postAuth(
  action: string,
  body: object,
): Promise<Response> {
  const base = new URL(process.env.API_BASE_URL ?? "http://localhost:5287");
  if (
    !["http:", "https:"].includes(base.protocol) ||
    base.username ||
    base.password
  )
    throw new Error("Invalid API_BASE_URL");
  const options: RequestInit = {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  };
  const versioned = await fetch(
    new URL(`/api/v1/auth/${action}`, base),
    options,
  );
  if (versioned.status !== 404) return versioned;
  return fetch(new URL(`/api/auth/${action}`, base), options);
}

export async function backendFetch(
  path: string,
  accessToken: string,
  init: RequestInit = {},
): Promise<Response> {
  const base = new URL(process.env.API_BASE_URL ?? "http://localhost:5287");
  if (
    !["http:", "https:"].includes(base.protocol) ||
    base.username ||
    base.password
  )
    throw new Error("Invalid API_BASE_URL");
  const headers = new Headers(init.headers);
  headers.set("Accept", headers.get("Accept") ?? "application/json");
  headers.set("Authorization", `Bearer ${accessToken}`);
  return fetch(new URL(path, base), {
    ...init,
    headers,
    cache: "no-store",
    signal: init.signal ?? AbortSignal.timeout(5000),
  });
}

export async function upstreamProblem(
  response: Response,
  status: number,
  title: string,
) {
  const body: unknown = await response.json().catch(() => null);
  let errors: Errors | undefined;
  if (status === 400 && body && typeof body === "object" && "errors" in body) {
    const candidate = body.errors;
    if (
      candidate &&
      typeof candidate === "object" &&
      !Array.isArray(candidate)
    ) {
      errors = Object.fromEntries(
        Object.entries(candidate).filter(
          ([, messages]) =>
            Array.isArray(messages) &&
            messages.every((message) => typeof message === "string"),
        ),
      );
    }
  }
  return problem(status, title, errors);
}

export async function authenticationResult(
  response: Response,
  rememberMe: boolean,
): Promise<AuthSession> {
  const body: unknown = await response.json();
  if (!body || typeof body !== "object")
    throw new Error("Invalid auth response");
  const value = body as Record<string, unknown>;
  const user = value.user as Record<string, unknown> | undefined;
  const role = user?.role;
  if (
    value.tokenType !== "Bearer" ||
    typeof value.accessToken !== "string" ||
    !value.accessToken ||
    typeof value.refreshToken !== "string" ||
    !value.refreshToken ||
    typeof value.accessTokenExpiresAtUtc !== "string" ||
    !Number.isFinite(Date.parse(value.accessTokenExpiresAtUtc)) ||
    typeof value.refreshTokenExpiresAtUtc !== "string" ||
    Date.parse(value.refreshTokenExpiresAtUtc) <= Date.now() ||
    !user ||
    typeof user.id !== "string" ||
    !user.id ||
    typeof user.displayName !== "string" ||
    typeof user.email !== "string" ||
    (role !== "ADMIN" && role !== "USER")
  )
    throw new Error("Invalid auth response");
  return {
    accessToken: value.accessToken,
    accessTokenExpiresAtUtc: value.accessTokenExpiresAtUtc,
    refreshToken: value.refreshToken,
    refreshTokenExpiresAtUtc: value.refreshTokenExpiresAtUtc,
    user: {
      id: user.id,
      displayName: user.displayName,
      email: user.email,
    } as AuthenticatedUser,
    role: role as AuthenticatedRole,
    rememberMe,
  };
}

export function success(session: AuthSession) {
  return NextResponse.json(
    { user: session.user },
    { headers: { "Cache-Control": "no-store" } },
  );
}
