import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as login } from "./login/route";
import { POST as google } from "./google/route";
import { POST as refresh } from "./refresh/route";
import { POST as logout } from "./logout/route";
import { GET as session } from "./session/route";
import { readSession } from "@/features/auth/server/session";

const user = { id: "user-id", displayName: "Linh", email: "linh@example.com" };

function authBody(refreshToken = "refresh-secret") {
  return {
    tokenType: "Bearer",
    accessToken: "access-secret",
    accessTokenExpiresAtUtc: new Date(Date.now() + 15 * 60_000).toISOString(),
    refreshToken,
    refreshTokenExpiresAtUtc: new Date(
      Date.now() + 24 * 60 * 60_000,
    ).toISOString(),
    user: { ...user, role: "ADMIN" },
  };
}

function request(
  path: string,
  body?: object,
  cookie?: string,
  origin = "http://localhost",
) {
  return new NextRequest(`http://localhost/api/auth/${path}`, {
    method: path === "session" ? "GET" : "POST",
    headers: {
      Origin: origin,
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

beforeEach(() => {
  vi.stubEnv("API_BASE_URL", "http://backend:8080");
  vi.stubEnv("AUTH_SESSION_SECRET", Buffer.alloc(32, 7).toString("base64url"));
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("auth BFF", () => {
  it("keeps backend tokens in an encrypted HttpOnly cookie", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(authBody()));
    vi.stubGlobal("fetch", fetchMock);
    const response = await login(
      request("login", {
        email: "  linh@example.com  ",
        password: " password ",
        rememberMe: true,
      }),
    );
    const cookie = response.headers.get("set-cookie") ?? "";

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ user });
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=lax");
    expect(cookie).toContain("Max-Age=");
    expect(cookie).not.toContain("refresh-secret");
    expect(cookie).not.toContain("access-secret");
    expect(readSession(cookie.split(";")[0].split("=")[1])).toMatchObject({
      role: "ADMIN",
    });
    expect(fetchMock.mock.calls[0][0].toString()).toBe(
      "http://backend:8080/api/v1/auth/login",
    );
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      email: "linh@example.com",
      password: " password ",
      rememberMe: true,
    });
    const state = await session(
      request("session", undefined, cookie.split(";")[0]),
    );
    expect(await state.json()).toEqual({ status: "authenticated", user });
  });

  it("falls back to the legacy local auth route only when the versioned route is absent", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(Response.json(authBody()));
    vi.stubGlobal("fetch", fetchMock);

    const response = await login(
      request("login", {
        email: "linh@example.com",
        password: "password",
      }),
    );

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([
      "http://backend:8080/api/v1/auth/login",
      "http://backend:8080/api/auth/login",
    ]);
  });

  it("rejects invalid input, cross-origin requests, and invalid upstream payloads", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ user }));
    vi.stubGlobal("fetch", fetchMock);
    expect(
      (await login(request("login", { email: "bad", password: "" }))).status,
    ).toBe(400);
    expect(
      (
        await login(
          request(
            "login",
            { email: "linh@example.com", password: "password" },
            undefined,
            "http://other",
          ),
        )
      ).status,
    ).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
    const result = await login(
      request("login", { email: "linh@example.com", password: "password" }),
    );
    expect(result.status).toBe(502);
    expect(result.headers.get("set-cookie")).toBeNull();
  });

  it("maps credential and Google linking failures without leaking upstream details", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          Response.json({ detail: "secret" }, { status: 401 }),
        )
        .mockResolvedValueOnce(
          Response.json({ detail: "secret" }, { status: 409 }),
        ),
    );
    const invalid = await login(
      request("login", { email: "linh@example.com", password: "wrong" }),
    );
    expect(invalid.status).toBe(401);
    expect(await invalid.text()).not.toContain("secret");
    const conflict = await google(
      request("google", { credential: "signed-id-token", rememberMe: false }),
    );
    expect(conflict.status).toBe(409);
    expect(await conflict.text()).not.toContain("secret");
  });

  it("accepts a Google credential and returns only the user", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(authBody()));
    vi.stubGlobal("fetch", fetchMock);
    const response = await google(
      request("google", {
        credential: "signed-id-token",
        rememberMe: false,
      }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ user });
    expect(fetchMock.mock.calls[0][0].toString()).toBe(
      "http://backend:8080/api/v1/auth/google",
    );
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      credential: "signed-id-token",
      rememberMe: false,
    });
  });

  it("rotates the refresh token and revokes it on logout", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json(authBody("first-token")))
      .mockResolvedValueOnce(Response.json(authBody("second-token")))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    const signedIn = await login(
      request("login", {
        email: "linh@example.com",
        password: "password",
        rememberMe: false,
      }),
    );
    const firstCookie = signedIn.headers.get("set-cookie")!.split(";")[0];
    expect(signedIn.headers.get("set-cookie")).not.toContain("Max-Age=");
    const renewed = await refresh(request("refresh", {}, firstCookie));
    expect(renewed.status).toBe(200);
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({
      refreshToken: "first-token",
    });
    const secondCookie = renewed.headers.get("set-cookie")!.split(";")[0];
    const signedOut = await logout(request("logout", {}, secondCookie));
    expect(signedOut.status).toBe(204);
    expect(JSON.parse(fetchMock.mock.calls[2][1].body)).toEqual({
      refreshToken: "second-token",
    });
    expect(signedOut.headers.get("set-cookie")).toContain("Max-Age=0");
  });

  it("returns the backend retry interval for rate-limited login attempts", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(null, { status: 429, headers: { "Retry-After": "12" } }),
        ),
    );

    const response = await login(
      request("login", { email: "linh@example.com", password: "password" }),
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("12");
  });
});
