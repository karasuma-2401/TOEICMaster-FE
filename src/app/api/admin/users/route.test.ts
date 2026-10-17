import { NextRequest, NextResponse } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  setSessionCookie,
  type AuthSession,
} from "@/features/auth/server/session";
import { backendFetch } from "@/features/auth/server/backend";
import { GET, POST } from "./route";

vi.mock("@/features/auth/server/backend", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/auth/server/backend")>();
  return { ...actual, backendFetch: vi.fn() };
});

function adminCookie() {
  const response = NextResponse.next();
  const session = {
    accessToken: "access-token",
    accessTokenExpiresAtUtc: new Date().toISOString(),
    refreshToken: "refresh-token",
    refreshTokenExpiresAtUtc: new Date(Date.now() + 60_000).toISOString(),
    user: { id: "admin-1", displayName: "Admin", email: "admin@example.com" },
    rememberMe: false,
    role: "ADMIN",
  } as AuthSession;
  setSessionCookie(response, session);
  return response.headers.get("set-cookie")!.split(";")[0];
}

beforeEach(() => {
  vi.stubEnv("AUTH_SESSION_SECRET", Buffer.alloc(32, 5).toString("base64url"));
});
afterEach(() => vi.unstubAllEnvs());

describe("GET /api/admin/users", () => {
  it("forwards a normalized list query to the backend for an Admin", async () => {
    vi.mocked(backendFetch).mockResolvedValueOnce(
      Response.json({ page: 1, pageSize: 10, items: [] }),
    );
    const response = GET(
      new NextRequest("http://localhost/api/admin/users?page=1&pageSize=10", {
        headers: { Cookie: adminCookie() },
      }),
    );
    await expect(response).resolves.toMatchObject({ status: 200 });
    expect(backendFetch).toHaveBeenCalledWith(
      "/api/v1/admin/users?page=1&pageSize=10&sort=createdAt%3Adesc",
      "access-token",
      { method: "GET" },
    );
  });

  it("forwards create requests to the backend", async () => {
    vi.mocked(backendFetch).mockResolvedValueOnce(
      new Response(null, { status: 204 }),
    );
    const response = await POST(
      new NextRequest("http://localhost/api/admin/users", {
        method: "POST",
        headers: {
          Cookie: adminCookie(),
          Origin: "http://localhost",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fullName: "Mai", email: "mai@example.com" }),
      }),
    );
    expect(response.status).toBe(204);
    expect(backendFetch).toHaveBeenCalledWith(
      "/api/v1/admin/users",
      "access-token",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("returns 401 without a session", async () => {
    await expect(
      GET(new NextRequest("http://localhost/api/admin/users")),
    ).resolves.toMatchObject({ status: 401 });
  });
});
