import { NextRequest, NextResponse } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { backendFetch } from "@/features/auth/server/backend";
import {
  setSessionCookie,
  type AuthSession,
} from "@/features/auth/server/session";
import { DELETE, GET, PATCH } from "./route";

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

describe("/api/admin/users/[id]", () => {
  it("forwards detail reads to the matching backend resource", async () => {
    vi.mocked(backendFetch).mockResolvedValueOnce(Response.json({ id: "u1" }));
    const response = await GET(
      new NextRequest("http://localhost/api/admin/users/u1", {
        headers: { Cookie: adminCookie() },
      }),
      { params: Promise.resolve({ id: "u1" }) },
    );
    expect(response.status).toBe(200);
    expect(backendFetch).toHaveBeenCalledWith(
      "/api/v1/admin/users/u1",
      "admin-token",
      { method: "GET" },
    );
  });

  it("forwards role changes and deletes", async () => {
    vi.mocked(backendFetch)
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    const cookie = adminCookie();
    const patchResponse = await PATCH(
      new NextRequest("http://localhost/api/admin/users/u1", {
        method: "PATCH",
        headers: {
          Cookie: cookie,
          Origin: "http://localhost",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: "ADMIN" }),
      }),
      { params: Promise.resolve({ id: "u1" }) },
    );
    const deleteResponse = await DELETE(
      new NextRequest("http://localhost/api/admin/users/u1", {
        method: "DELETE",
        headers: { Cookie: cookie, Origin: "http://localhost" },
      }),
      { params: Promise.resolve({ id: "u1" }) },
    );
    expect(patchResponse.status).toBe(204);
    expect(deleteResponse.status).toBe(204);
    expect(backendFetch).toHaveBeenNthCalledWith(
      1,
      "/api/v1/admin/users/u1",
      "admin-token",
      expect.objectContaining({ method: "PATCH" }),
    );
    expect(backendFetch).toHaveBeenNthCalledWith(
      2,
      "/api/v1/admin/users/u1",
      "admin-token",
      { method: "DELETE" },
    );
  });
});
