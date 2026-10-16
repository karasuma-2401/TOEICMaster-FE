import { NextRequest, NextResponse } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  setSessionCookie,
  type AuthSession,
} from "@/features/auth/server/session";
import { forward } from "./profile-proxy";

function cookie() {
  const response = NextResponse.next();
  const session: AuthSession = {
    accessToken: "access-token",
    accessTokenExpiresAtUtc: new Date(Date.now() + 60_000).toISOString(),
    refreshToken: "refresh-token",
    refreshTokenExpiresAtUtc: new Date(Date.now() + 3_600_000).toISOString(),
    user: { id: "user-1", displayName: "Linh", email: "linh@example.com" },
    rememberMe: false,
  };
  setSessionCookie(response, session);
  return response.headers.get("set-cookie")!.split(";")[0];
}

function request(
  path = "/api/profile",
  sessionCookie = cookie(),
  method = "GET",
) {
  return new NextRequest(`http://localhost${path}`, {
    method,
    headers: {
      ...(sessionCookie ? { Cookie: sessionCookie } : {}),
      ...(method === "GET" ? {} : { Origin: "http://localhost" }),
    },
  });
}

beforeEach(() => {
  vi.stubEnv("AUTH_SESSION_SECRET", Buffer.alloc(32, 7).toString("base64url"));
  vi.stubEnv("API_BASE_URL", "http://backend:5287");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("profile BFF", () => {
  it("forwards with the session Bearer token and preserves JSON response", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(Response.json({ id: "user-1" }));
    vi.stubGlobal("fetch", fetchMock);
    const response = await forward(request(), "/api/v1/users/me", {
      method: "GET",
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ id: "user-1" });
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(String(url)).toBe("http://backend:5287/api/v1/users/me");
    expect(options.cache).toBe("no-store");
    expect(new Headers(options.headers).get("authorization")).toBe(
      "Bearer access-token",
    );
  });

  it("rejects guests without contacting the backend", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = await forward(
      request("/api/profile", ""),
      "/api/v1/users/me",
      { method: "GET" },
    );
    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("preserves 204 and private image responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(new Response(null, { status: 204 }))
        .mockResolvedValueOnce(
          new Response("image", {
            status: 200,
            headers: { "Content-Type": "image/png" },
          }),
        ),
    );
    const removed = await forward(
      request("/api/profile", cookie(), "DELETE"),
      "/api/v1/users/me/avatar",
      { method: "DELETE" },
    );
    expect(removed.status).toBe(204);
    const image = await forward(request(), "/api/v1/users/me/avatar", {
      method: "GET",
    });
    expect(image.headers.get("Content-Type")).toBe("image/png");
    expect(image.headers.get("Cache-Control")).toBe("private, no-store");
    expect(await image.text()).toBe("image");
  });

  it("blocks cross-origin write requests", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const crossOrigin = new NextRequest("http://localhost/api/profile", {
      method: "PUT",
      headers: { Cookie: cookie(), Origin: "http://evil.example" },
    });
    const response = await forward(crossOrigin, "/api/v1/users/me", {
      method: "PUT",
    });
    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
