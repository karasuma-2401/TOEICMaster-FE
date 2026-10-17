import { NextRequest, NextResponse } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { backendFetch } from "@/features/auth/server/backend";
import {
  setSessionCookie,
  type AuthSession,
} from "@/features/auth/server/session";
import { DELETE, POST } from "./route";

vi.mock("@/features/auth/server/backend", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/auth/server/backend")>();
  return { ...actual, backendFetch: vi.fn() };
});

function adminCookie() {
  const response = NextResponse.next();
  setSessionCookie(response, {
    accessToken: "admin-token",
    accessTokenExpiresAtUtc: new Date().toISOString(),
    refreshToken: "refresh-token",
    refreshTokenExpiresAtUtc: new Date(Date.now() + 60_000).toISOString(),
    user: { id: "admin", displayName: "Admin", email: "admin@example.com" },
    rememberMe: false,
    role: "ADMIN",
  } as AuthSession);
  return response.headers.get("set-cookie")!.split(";")[0];
}

beforeEach(() =>
  vi.stubEnv("AUTH_SESSION_SECRET", Buffer.alloc(32, 4).toString("base64url")),
);
afterEach(() => vi.unstubAllEnvs());

describe("/api/admin/users/[id]/lock", () => {
  it("forwards lock and unlock actions", async () => {
    vi.mocked(backendFetch)
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    const cookie = adminCookie();
    const context = { params: Promise.resolve({ id: "user-1" }) };
    const lockResponse = await POST(
      new NextRequest("http://localhost/api/admin/users/user-1/lock", {
        method: "POST",
        headers: {
          Cookie: cookie,
          Origin: "http://localhost",
        },
      }),
      context,
    );
    const unlockResponse = await DELETE(
      new NextRequest("http://localhost/api/admin/users/user-1/lock", {
        method: "DELETE",
        headers: { Cookie: cookie, Origin: "http://localhost" },
      }),
      context,
    );
    expect(lockResponse.status).toBe(204);
    expect(unlockResponse.status).toBe(204);
    expect(backendFetch).toHaveBeenNthCalledWith(
      1,
      "/api/v1/admin/users/user-1/lock",
      "admin-token",
      expect.objectContaining({ method: "POST" }),
    );
    expect(backendFetch).toHaveBeenNthCalledWith(
      2,
      "/api/v1/admin/users/user-1/lock",
      "admin-token",
      { method: "DELETE" },
    );
  });
});
