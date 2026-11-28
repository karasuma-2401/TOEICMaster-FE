import { NextRequest, NextResponse } from "next/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  setSessionCookie,
  type AuthSession,
} from "@/features/auth/server/session";
import { forwardAdminWriting } from "./admin-writing-proxy";

function adminCookie() {
  const response = NextResponse.next();
  setSessionCookie(response, {
    accessToken: "token",
    accessTokenExpiresAtUtc: new Date(Date.now() + 60_000).toISOString(),
    refreshToken: "refresh",
    refreshTokenExpiresAtUtc: new Date(Date.now() + 60_000).toISOString(),
    user: { id: "admin-1", displayName: "Admin", email: "admin@example.com" },
    rememberMe: false,
    role: "ADMIN",
  } as AuthSession);
  return response.headers.get("set-cookie")!.split(";")[0];
}

beforeEach(() => {
  vi.stubEnv("AUTH_SESSION_SECRET", Buffer.alloc(32, 5).toString("base64url"));
  vi.stubEnv("API_BASE_URL", "http://api:8080");
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

it.each([
  { method: "DELETE" as const, suffix: "?version=3", segments: [] as string[] },
  { method: "POST" as const, suffix: "/archive", segments: ["archive"] },
  { method: "POST" as const, suffix: "/restore", segments: ["restore"] },
])(
  "forwards $method $suffix to the backend",
  async ({ method, suffix, segments }) => {
    const id = "10000000-0000-0000-0000-000000000001";
    const path = `/api/admin/writing/tests/${id}${suffix}`;
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    const request = new NextRequest(`http://localhost${path}`, {
      method,
      headers: {
        Cookie: adminCookie(),
        Origin: "http://localhost",
        ...(method === "POST" ? { "Content-Type": "application/json" } : {}),
      },
      ...(method === "POST" ? { body: JSON.stringify({ version: 3 }) } : {}),
    });
    const response = await forwardAdminWriting(
      request,
      ["tests", id, ...segments],
      method,
    );
    expect(response.status).toBe(204);
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      `http://api:8080/api/v1/admin/writing/tests/${id}${suffix}`,
    );
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.method).toBe(method);
    expect((init.headers as Headers).get("Authorization")).toBe("Bearer token");
  },
);
