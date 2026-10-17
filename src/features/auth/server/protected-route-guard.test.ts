import { NextRequest, NextResponse } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setSessionCookie, type AuthSession } from "./session";
import { protectRoute } from "./protected-route-guard";

const paths = ["/dashboard"] as const;

function request(path: string, cookie?: string) {
  return new NextRequest(`http://localhost${path}`, {
    headers: cookie ? { Cookie: cookie } : undefined,
  });
}

function sessionCookie(accessExpiresAt: number, refreshExpiresAt: number) {
  const response = NextResponse.next();
  const session: AuthSession = {
    accessToken: "access-token",
    accessTokenExpiresAtUtc: new Date(accessExpiresAt).toISOString(),
    refreshToken: "refresh-token",
    refreshTokenExpiresAtUtc: new Date(refreshExpiresAt).toISOString(),
    user: { id: "user-id", displayName: "Linh", email: "linh@example.com" },
    rememberMe: false,
  };
  setSessionCookie(response, session);
  return response.headers.get("set-cookie")!.split(";")[0];
}

function adminSessionCookie(role?: string) {
  const response = NextResponse.next();
  const session = {
    accessToken: "access-token",
    accessTokenExpiresAtUtc: new Date(Date.now() + 60_000).toISOString(),
    refreshToken: "refresh-token",
    refreshTokenExpiresAtUtc: new Date(Date.now() + 60_000).toISOString(),
    user: { id: "user-id", displayName: "Linh", email: "linh@example.com" },
    rememberMe: false,
    ...(role ? { role } : {}),
  } as AuthSession;
  setSessionCookie(response, session);
  return response.headers.get("set-cookie")!.split(";")[0];
}

beforeEach(() => {
  vi.stubEnv("AUTH_SESSION_SECRET", Buffer.alloc(32, 7).toString("base64url"));
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("ADMIN_PREVIEW", "false");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("protectRoute", () => {
  it("leaves public paths alone", () => {
    const response = protectRoute(request("/"), paths);

    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("redirects unauthenticated profile navigation to login", () => {
    const response = protectRoute(request("/profile"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost/login?next=%2Fprofile",
    );
  });

  it("redirects a guest to login with the requested path and query", () => {
    const response = protectRoute(request("/dashboard?tab=progress"), paths);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost/login?next=%2Fdashboard%3Ftab%3Dprogress",
    );
  });

  it("allows a session whose refresh lifetime is still valid", () => {
    const cookie = sessionCookie(Date.now() - 1_000, Date.now() + 60_000);
    const response = protectRoute(request("/dashboard", cookie), paths);

    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("redirects a signed-in non-admin away from the admin area", () => {
    const cookie = adminSessionCookie("Student");
    const response = protectRoute(request("/admin/users", cookie));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/");
  });

  it("fails closed when the session has no role", () => {
    const cookie = adminSessionCookie();
    const response = protectRoute(request("/admin/users", cookie));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/");
  });

  it("allows a session with the Admin role", () => {
    const cookie = adminSessionCookie("ADMIN");
    const response = protectRoute(request("/admin/users", cookie));

    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("allows viewing the Admin shell in explicitly enabled local preview", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("ADMIN_PREVIEW", "true");
    const response = protectRoute(request("/admin/users"));
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("redirects when the refresh lifetime has expired", () => {
    const cookie = sessionCookie(Date.now() - 120_000, Date.now() - 60_000);
    const response = protectRoute(request("/dashboard", cookie), paths);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost/login?next=%2Fdashboard",
    );
  });
});
