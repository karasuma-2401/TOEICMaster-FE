import { NextRequest, NextResponse } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { backendFetch } from "@/features/auth/server/backend";
import {
  setSessionCookie,
  type AuthSession,
} from "@/features/auth/server/session";
import { forwardAdminWriting } from "./admin-writing-proxy";

vi.mock("@/features/auth/server/backend", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/auth/server/backend")>();
  return { ...actual, backendFetch: vi.fn() };
});

function cookie(role?: string) {
  const response = NextResponse.next();
  setSessionCookie(response, {
    accessToken: "access-token",
    accessTokenExpiresAtUtc: new Date(Date.now() + 60_000).toISOString(),
    refreshToken: "refresh-token",
    refreshTokenExpiresAtUtc: new Date(Date.now() + 60_000).toISOString(),
    user: { id: "admin-1", displayName: "Admin", email: "admin@example.com" },
    rememberMe: false,
    ...(role ? { role } : {}),
  } as AuthSession);
  return response.headers.get("set-cookie")!.split(";")[0];
}

beforeEach(() =>
  vi.stubEnv("AUTH_SESSION_SECRET", Buffer.alloc(32, 5).toString("base64url")),
);
afterEach(() => {
  vi.unstubAllEnvs();
  vi.mocked(backendFetch).mockReset();
});

describe("Admin Writing BFF proxy", () => {
  it("requires a signed-in admin", async () => {
    const url = "http://localhost/api/admin/writing/exercises";
    expect(
      (await forwardAdminWriting(new NextRequest(url), ["exercises"], "GET"))
        .status,
    ).toBe(401);
    expect(
      (
        await forwardAdminWriting(
          new NextRequest(url, { headers: { Cookie: cookie("USER") } }),
          ["exercises"],
          "GET",
        )
      ).status,
    ).toBe(403);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it("forwards admin requests with bearer token and query string", async () => {
    vi.mocked(backendFetch).mockResolvedValue(Response.json({ items: [] }));
    const response = await forwardAdminWriting(
      new NextRequest(
        "http://localhost/api/admin/writing/exercises?part=1&pageSize=10",
        { headers: { Cookie: cookie("ADMIN") } },
      ),
      ["exercises"],
      "GET",
    );
    expect(response.status).toBe(200);
    expect(backendFetch).toHaveBeenCalledWith(
      "/api/v1/admin/writing/exercises?part=1&pageSize=10",
      "access-token",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("blocks non-allowlisted routes with 404", async () => {
    const response = await forwardAdminWriting(
      new NextRequest("http://localhost/api/admin/writing/unknown", {
        headers: { Cookie: cookie("ADMIN") },
      }),
      ["unknown"],
      "GET",
    );
    expect(response.status).toBe(404);
  });
});
