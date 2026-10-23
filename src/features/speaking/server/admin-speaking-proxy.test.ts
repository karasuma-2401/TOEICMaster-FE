import { NextRequest, NextResponse } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { backendFetch } from "@/features/auth/server/backend";
import {
  setSessionCookie,
  type AuthSession,
} from "@/features/auth/server/session";
import { forwardAdminSpeaking } from "./admin-speaking-proxy";

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

describe("Admin Speaking BFF proxy", () => {
  it("requires a signed-in admin", async () => {
    const url = "http://localhost/api/admin/speaking/summary";
    expect(
      (await forwardAdminSpeaking(new NextRequest(url), ["summary"], "GET"))
        .status,
    ).toBe(401);
    expect(
      (
        await forwardAdminSpeaking(
          new NextRequest(url, { headers: { Cookie: cookie("USER") } }),
          ["summary"],
          "GET",
        )
      ).status,
    ).toBe(403);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it("forwards admin requests with the bearer token and query string", async () => {
    vi.mocked(backendFetch).mockResolvedValue(Response.json({ items: [] }));
    const response = await forwardAdminSpeaking(
      new NextRequest(
        "http://localhost/api/admin/speaking/exercises?part=2&pageSize=10",
        { headers: { Cookie: cookie("ADMIN") } },
      ),
      ["exercises"],
      "GET",
    );

    expect(response.status).toBe(200);
    expect(vi.mocked(backendFetch).mock.calls[0].slice(0, 2)).toEqual([
      "/api/v1/admin/speaking/exercises?part=2&pageSize=10",
      "access-token",
    ]);
  });

  it("only allows known paths and methods", async () => {
    const request = new NextRequest("http://localhost/x", {
      headers: { Cookie: cookie("ADMIN") },
    });
    expect((await forwardAdminSpeaking(request, ["users"], "GET")).status).toBe(
      404,
    );
    expect(
      (await forwardAdminSpeaking(request, ["summary"], "DELETE")).status,
    ).toBe(404);
  });
});
