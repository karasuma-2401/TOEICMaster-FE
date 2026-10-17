import { NextRequest, NextResponse } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { backendFetch } from "@/features/auth/server/backend";
import {
  setSessionCookie,
  type AuthSession,
} from "@/features/auth/server/session";
import { adminUserPath, forwardAdminUsers } from "./admin-users-proxy";

vi.mock("@/features/auth/server/backend", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/auth/server/backend")>();
  return { ...actual, backendFetch: vi.fn() };
});

function cookie(role?: string) {
  const response = NextResponse.next();
  const session = {
    accessToken: "access-token",
    accessTokenExpiresAtUtc: new Date(Date.now() + 60_000).toISOString(),
    refreshToken: "refresh-token",
    refreshTokenExpiresAtUtc: new Date(Date.now() + 60_000).toISOString(),
    user: { id: "admin-1", displayName: "Admin", email: "admin@example.com" },
    rememberMe: false,
    ...(role ? { role } : {}),
  } as AuthSession;
  setSessionCookie(response, session);
  return response.headers.get("set-cookie")!.split(";")[0];
}

function request(authCookie?: string) {
  return new NextRequest("http://localhost/api/admin/users", {
    headers: authCookie ? { Cookie: authCookie } : undefined,
  });
}

beforeEach(() =>
  vi.stubEnv("AUTH_SESSION_SECRET", Buffer.alloc(32, 5).toString("base64url")),
);
afterEach(() => {
  vi.unstubAllEnvs();
});

describe("forwardAdminUsers", () => {
  it("requires a valid session", async () => {
    await expect(
      forwardAdminUsers(request(), "/api/v1/admin/users", "GET"),
    ).resolves.toMatchObject({ status: 401 });
  });

  it("rejects a session without an Admin role", async () => {
    const response = await forwardAdminUsers(
      request(cookie("USER")),
      "/api/v1/admin/users",
      "GET",
    );
    expect(response.status).toBe(403);
  });

  it("forwards the bearer session to the backend and preserves its response", async () => {
    vi.mocked(backendFetch).mockResolvedValueOnce(
      Response.json({ items: [], page: 1 }),
    );
    const response = await forwardAdminUsers(
      request(cookie("ADMIN")),
      "/api/v1/admin/users?page=1",
      "GET",
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ items: [], page: 1 });
    expect(backendFetch).toHaveBeenCalledWith(
      "/api/v1/admin/users?page=1",
      "access-token",
      { method: "GET" },
    );
  });

  it("rejects writes from a different origin", async () => {
    const crossOrigin = new NextRequest("http://localhost/api/admin/users", {
      method: "POST",
      headers: {
        Cookie: cookie("ADMIN"),
        Origin: "http://evil.example",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fullName: "A", email: "a@example.com" }),
    });
    expect(
      (await forwardAdminUsers(crossOrigin, "/api/v1/admin/users", "POST"))
        .status,
    ).toBe(403);
  });

  it("builds encoded paths for user actions", () => {
    expect(adminUserPath("id/part", "lock")).toBe(
      "/api/v1/admin/users/id%2Fpart/lock",
    );
  });
});
