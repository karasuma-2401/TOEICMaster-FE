import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as login } from "./login/route";
import { POST as google } from "./google/route";
import { POST as refresh } from "./refresh/route";
import { POST as logout } from "./logout/route";
import { POST as forgotPassword } from "./forgot-password/route";
import { POST as resendVerification } from "./resend-verification/route";
import { POST as resetPassword } from "./reset-password/route";
import { POST as verifyEmail } from "./verify-email/route";
import { POST as verifyPasswordReset } from "./verify-password-reset/route";
import { GET as session } from "./session/route";
import { readSession } from "@/features/auth/server/session";

const user = {
  id: "user-id",
  displayName: "Linh",
  email: "linh@example.com",
  role: "USER",
};

function authBody(
  refreshToken = "refresh-secret",
  role: "USER" | "ADMIN" = "USER",
) {
  return {
    tokenType: "Bearer",
    accessToken: "access-secret",
    accessTokenExpiresAtUtc: new Date(Date.now() + 15 * 60_000).toISOString(),
    refreshToken,
    refreshTokenExpiresAtUtc: new Date(
      Date.now() + 24 * 60 * 60_000,
    ).toISOString(),
    user: { ...user, role },
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
    expect(await response.json()).toEqual({
      user: {
        id: user.id,
        displayName: user.displayName,
        email: user.email,
        role: "USER",
      },
    });
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=lax");
    expect(cookie).toContain("Max-Age=");
    expect(cookie).not.toContain("refresh-secret");
    expect(cookie).not.toContain("access-secret");
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
    expect(await state.json()).toEqual({
      status: "authenticated",
      user: { id: user.id, displayName: user.displayName, email: user.email },
    });
  });

  it.each([
    {
      entrypoint: "local login",
      path: "login",
      body: {
        email: "admin@example.com",
        password: "password",
        rememberMe: true,
      },
      upstreamPath: "login",
    },
    {
      entrypoint: "Google login",
      path: "google",
      body: { credential: "google-id-token", rememberMe: true },
      upstreamPath: "google",
    },
  ])(
    "preserves ADMIN role through $entrypoint and the encrypted session boundary",
    async ({ path, body, upstreamPath }) => {
      const fetchMock = vi
        .fn()
        .mockResolvedValue(Response.json(authBody("refresh-secret", "ADMIN")));
      vi.stubGlobal("fetch", fetchMock);

      const response = await (path === "login" ? login : google)(
        request(path, body),
      );
      const cookieValue = response.cookies.get("toeicmaster_session")?.value;

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        user: {
          id: user.id,
          displayName: user.displayName,
          email: user.email,
          role: "ADMIN",
        },
      });
      expect(cookieValue).toMatch(/^v1\./);
      expect(cookieValue).not.toContain("access-secret");
      expect(cookieValue).not.toContain("refresh-secret");
      expect(readSession(cookieValue)?.role).toBe("ADMIN");
      expect(readSession(cookieValue)?.user).toEqual({
        id: user.id,
        displayName: user.displayName,
        email: user.email,
      });
      expect(fetchMock.mock.calls[0][0].toString()).toBe(
        `http://backend:8080/api/v1/auth/${upstreamPath}`,
      );
      expect(fetchMock.mock.calls[0][1]).toEqual(
        expect.objectContaining({ method: "POST" }),
      );

      const sessionResponse = await session(
        request("session", undefined, `toeicmaster_session=${cookieValue}`),
      );
      expect(await sessionResponse.json()).toEqual({
        status: "authenticated",
        user: { id: user.id, displayName: user.displayName, email: user.email },
      });
    },
  );

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
    expect(await response.json()).toEqual({
      user: {
        id: user.id,
        displayName: user.displayName,
        email: user.email,
        role: "USER",
      },
    });
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

  it.each([
    { name: "login", handler: login },
    { name: "google", handler: google },
    { name: "forgot-password", handler: forgotPassword },
    { name: "resend-verification", handler: resendVerification },
    { name: "reset-password", handler: resetPassword },
    { name: "verify-email", handler: verifyEmail },
    { name: "verify-password-reset", handler: verifyPasswordReset },
  ])(
    "rejects oversized auth JSON payloads with 413 and cancels the stream on $name",
    async ({ name, handler }) => {
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);
      const cancel = vi.fn(() => Promise.resolve());
      const chunk = new Uint8Array(10_000).fill(97);
      const chunks = [chunk, chunk];
      const body = new ReadableStream<Uint8Array>(
        {
          pull(controller) {
            const next = chunks.shift();
            if (next) controller.enqueue(next);
            else controller.close();
          },
          cancel,
        },
        { highWaterMark: 0 },
      );

      const response = await handler(
        new NextRequest(`http://localhost/api/auth/${name}`, {
          method: "POST",
          headers: {
            Origin: "http://localhost",
            "Content-Type": "application/json",
          },
          body,
        }),
      );

      expect(response.status).toBe(413);
      expect(response.headers.get("content-type")).toBe(
        "application/problem+json",
      );
      expect(cancel).toHaveBeenCalledOnce();
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("forwards validated X-Forwarded-For and X-Forwarded-Proto across all 9 auth routes", async () => {
    const validSessionCookie = await (async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValueOnce(Response.json(authBody())),
      );
      const res = await login(
        request("login", {
          email: "linh@example.com",
          password: "password",
        }),
      );
      return res.headers.get("set-cookie")!.split(";")[0];
    })();

    const cases: Array<{
      name: string;
      handler: (req: NextRequest) => Promise<Response>;
      body?: object;
      cookie?: string;
      upstreamResponse: () => Response;
    }> = [
      {
        name: "login",
        handler: login,
        body: { email: "linh@example.com", password: "password" },
        upstreamResponse: () => Response.json(authBody()),
      },
      {
        name: "logout",
        handler: logout,
        cookie: validSessionCookie,
        upstreamResponse: () => new Response(null, { status: 204 }),
      },
      {
        name: "google",
        handler: google,
        body: { credential: "signed-id-token" },
        upstreamResponse: () => Response.json(authBody()),
      },
      {
        name: "refresh",
        handler: refresh,
        cookie: validSessionCookie,
        upstreamResponse: () => Response.json(authBody()),
      },
      {
        name: "forgot-password",
        handler: forgotPassword,
        body: { email: "linh@example.com" },
        upstreamResponse: () => new Response(null, { status: 202 }),
      },
      {
        name: "resend-verification",
        handler: resendVerification,
        body: { email: "linh@example.com" },
        upstreamResponse: () => new Response(null, { status: 202 }),
      },
      {
        name: "reset-password",
        handler: resetPassword,
        body: { resetToken: "token-123", newPassword: "password123" },
        upstreamResponse: () => new Response(null, { status: 204 }),
      },
      {
        name: "verify-email",
        handler: verifyEmail,
        body: { email: "linh@example.com", code: "123456" },
        upstreamResponse: () => new Response(null, { status: 204 }),
      },
      {
        name: "verify-password-reset",
        handler: verifyPasswordReset,
        body: { email: "linh@example.com", code: "123456" },
        upstreamResponse: () =>
          Response.json({
            resetToken: "token-123",
            expiresAtUtc: new Date(Date.now() + 60_000).toISOString(),
          }),
      },
    ];

    for (const entry of cases) {
      const fetchMock = vi.fn().mockResolvedValueOnce(entry.upstreamResponse());
      vi.stubGlobal("fetch", fetchMock);

      const req = new NextRequest(`http://localhost/api/auth/${entry.name}`, {
        method: "POST",
        headers: {
          Origin: "http://localhost",
          "X-Real-IP": "198.51.100.42",
          "X-Forwarded-Proto": "https",
          ...(entry.body ? { "Content-Type": "application/json" } : {}),
          ...(entry.cookie ? { Cookie: entry.cookie } : {}),
        },
        ...(entry.body ? { body: JSON.stringify(entry.body) } : {}),
      });

      const res = await entry.handler(req);
      expect(res.status).toBeLessThan(400);
      const sentHeaders = fetchMock.mock.calls[0]![1].headers as Record<
        string,
        string
      >;
      expect(sentHeaders["X-Forwarded-For"]).toBe("198.51.100.42");
      expect(sentHeaders["X-Forwarded-Proto"]).toBe("https");
    }
  });
});
