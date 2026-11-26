import { NextRequest, NextResponse } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  setSessionCookie,
  type AuthSession,
} from "@/features/auth/server/session";
import {
  createBffProxy,
  extractForwardedClientHeaders,
  forwardBffRequest,
  readBoundedJson,
  relayUpstreamResponse,
  resolveBackendBaseUrl,
} from "./bff-proxy";

const ORIGIN = "http://localhost:3000";

function makeSessionCookie(overrides: Partial<AuthSession> = {}): string {
  const response = NextResponse.next();
  const session: AuthSession = {
    accessToken: "access-token",
    accessTokenExpiresAtUtc: new Date(Date.now() + 60_000).toISOString(),
    refreshToken: "refresh-token",
    refreshTokenExpiresAtUtc: new Date(Date.now() + 300_000).toISOString(),
    user: { id: "user-1", displayName: "Learner", email: "user@example.com" },
    role: "USER",
    rememberMe: false,
    ...overrides,
  };
  setSessionCookie(response, session);
  return response.headers.get("set-cookie")!.split(";")[0];
}

function makeRequest(
  init: {
    method?: string;
    origin?: string | null;
    cookie?: string;
    headers?: Record<string, string>;
    body?: BodyInit;
    signal?: AbortSignal;
  } = {},
) {
  const headers = new Headers(init.headers);
  if (init.origin !== null) {
    headers.set("origin", init.origin ?? ORIGIN);
  }
  if (init.cookie) {
    headers.set("cookie", init.cookie);
  }
  return new NextRequest(`${ORIGIN}/api/test`, {
    method: init.method ?? "POST",
    headers,
    body: init.body,
    signal: init.signal,
  });
}

beforeEach(() => {
  vi.stubEnv("AUTH_SESSION_SECRET", Buffer.alloc(32, 7).toString("base64url"));
  vi.stubEnv("API_BASE_URL", "http://api:8080");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("shared/server/bff-proxy", () => {
  it.each(["json", "raw"] as const)(
    "bounds streamed %s bodies before parsing or forwarding",
    async (bodyMode) => {
      const fetch = vi.fn();
      vi.stubGlobal("fetch", fetch);
      let chunks = 0;
      const cancel = vi.fn();
      const request = new NextRequest(`${ORIGIN}/api/test`, {
        method: "POST",
        duplex: "half",
        headers: { "Content-Type": "application/json" },
        body: new ReadableStream({
          pull(controller) {
            if (++chunks < 4) controller.enqueue(new Uint8Array(11));
            else controller.close();
          },
          cancel,
        }),
      });
      const response = await forwardBffRequest(request, {
        upstreamPath: "/api/test",
        auth: "public",
        sameOrigin: false,
        bodyMode,
        maxBodyBytes: 10,
      });
      expect(response.status).toBe(413);
      expect(cancel).toHaveBeenCalled();
      expect(fetch).not.toHaveBeenCalled();
    },
  );

  it("validates API_BASE_URL safely", () => {
    expect(resolveBackendBaseUrl()).toBe("http://api:8080");
    vi.stubEnv("API_BASE_URL", "file:///etc/passwd");
    expect(resolveBackendBaseUrl()).toBeNull();
    vi.stubEnv("API_BASE_URL", "http://user:pass@api:8080");
    expect(resolveBackendBaseUrl()).toBeNull();
  });

  it("enforces auth policies (public, optional HIGH-04, user, admin)", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      );
    vi.stubGlobal("fetch", fetchMock);

    // public forwards without auth
    const pub = await forwardBffRequest(makeRequest({ method: "GET" }), {
      upstreamPath: "/api/v1/public",
      method: "GET",
      auth: "public",
    });
    expect(pub.status).toBe(200);
    expect(
      new Headers((fetchMock.mock.calls[0][1] as RequestInit).headers).has(
        "authorization",
      ),
    ).toBe(false);

    // optional: valid refresh + expired access -> 401 (HIGH-04) without hitting upstream
    const expiredAccessCookie = makeSessionCookie({
      accessTokenExpiresAtUtc: new Date(Date.now() - 10_000).toISOString(),
      refreshTokenExpiresAtUtc: new Date(Date.now() + 60_000).toISOString(),
    });
    const optionalExpired = await forwardBffRequest(
      makeRequest({ method: "GET", cookie: expiredAccessCookie }),
      {
        upstreamPath: "/api/v1/optional",
        method: "GET",
        auth: "optional",
      },
    );
    expect(optionalExpired.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // user: anonymous -> 401
    const userAnon = await forwardBffRequest(makeRequest({ method: "GET" }), {
      upstreamPath: "/api/v1/me",
      method: "GET",
      auth: "user",
    });
    expect(userAnon.status).toBe(401);

    // admin: USER role -> 403, ADMIN role -> 200
    const userCookie = makeSessionCookie({ role: "USER" });
    const adminDenied = await forwardBffRequest(
      makeRequest({ method: "GET", cookie: userCookie }),
      {
        upstreamPath: "/api/v1/admin",
        method: "GET",
        auth: "admin",
      },
    );
    expect(adminDenied.status).toBe(403);

    const adminCookie = makeSessionCookie({ role: "ADMIN" });
    const adminAllowed = await forwardBffRequest(
      makeRequest({ method: "GET", cookie: adminCookie }),
      {
        upstreamPath: "/api/v1/admin",
        method: "GET",
        auth: "admin",
      },
    );
    expect(adminAllowed.status).toBe(200);
  });

  it("enforces sameOrigin on mutating requests", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const proxy = createBffProxy({
      upstreamPath: "/api/v1/items",
      method: "POST",
      auth: "public",
    });

    const res = await proxy(
      makeRequest({ origin: "https://attacker.example" }),
    );
    expect(res.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("streams multipart bodies and cancels oversized streams with 413", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const cancel = vi.fn(() => Promise.resolve());
    const chunks = [new Uint8Array(64), new Uint8Array(64)];
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

    const res = await forwardBffRequest(
      makeRequest({
        headers: {
          "content-type": "multipart/form-data; boundary=x",
          "content-length": "10",
        },
        body,
      }),
      {
        upstreamPath: "/api/v1/upload",
        method: "POST",
        auth: "public",
        bodyMode: "multipart",
        maxBodyBytes: 100,
      },
    );

    expect(res.status).toBe(413);
    expect(cancel).toHaveBeenCalledOnce();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("forwards sanitized X-Forwarded-For / X-Real-IP / X-Forwarded-Proto headers", async () => {
    const fakeHeaderRequest = {
      headers: new Map<string, string>([
        ["x-forwarded-for", "203.0.113.10\r\n, 10.0.0.1"],
        ["x-forwarded-proto", "https"],
      ]),
    };
    const forwarded = extractForwardedClientHeaders(
      fakeHeaderRequest as unknown as Request,
    );
    expect(forwarded).toEqual({
      "X-Forwarded-For": "203.0.113.10, 10.0.0.1",
      "X-Forwarded-Proto": "https",
    });

    const fallback = extractForwardedClientHeaders(
      makeRequest({ headers: { "x-real-ip": "198.51.100.7" } }),
    );
    expect(fallback).toEqual({ "X-Forwarded-For": "198.51.100.7" });
  });

  it("maps timeouts to 504 and upstream errors to sanitized 502 without leaking internals", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValueOnce(new DOMException("Slow", "TimeoutError")),
    );
    const timeoutRes = await forwardBffRequest(makeRequest({ method: "GET" }), {
      upstreamPath: "/api/v1/slow",
      method: "GET",
      auth: "public",
    });
    expect(timeoutRes.status).toBe(504);

    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockRejectedValueOnce(
          new Error("connect ECONNREFUSED http://api:8080"),
        ),
    );
    const failedRes = await forwardBffRequest(makeRequest({ method: "GET" }), {
      upstreamPath: "/api/v1/down",
      method: "GET",
      auth: "public",
    });
    expect(failedRes.status).toBe(502);
    const text = await failedRes.text();
    expect(text).not.toContain("ECONNREFUSED");
    expect(text).not.toContain("http://api:8080");
  });

  it("relays media headers (nosniff, private no-store, Content-Length) and 204 cleanly", async () => {
    const media = await relayUpstreamResponse(
      new Response(new Uint8Array([1, 2, 3]), {
        status: 200,
        headers: {
          "content-type": "image/png",
          "content-length": "3",
          "content-disposition": 'inline; filename="chart.png"',
          "retry-after": "30",
        },
      }),
    );
    expect(media.status).toBe(200);
    expect(media.headers.get("cache-control")).toBe("private, no-store");
    expect(media.headers.get("x-content-type-options")).toBe("nosniff");
    expect(media.headers.get("content-length")).toBe("3");
    expect(media.headers.get("content-disposition")).toBe(
      'inline; filename="chart.png"',
    );
    expect(media.headers.get("retry-after")).toBe("30");

    const empty = await relayUpstreamResponse(
      new Response(null, { status: 204 }),
    );
    expect(empty.status).toBe(204);
    expect(empty.headers.get("cache-control")).toBe("no-store");
    expect(empty.body).toBeNull();
  });

  it("handles optional auth with valid session vs fully expired session, and user auth with expired access", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      );
    vi.stubGlobal("fetch", fetchMock);

    // optional with valid session forwards Authorization
    const validCookie = makeSessionCookie();
    const optValid = await forwardBffRequest(
      makeRequest({ method: "GET", cookie: validCookie }),
      { upstreamPath: "/api/v1/optional", method: "GET", auth: "optional" },
    );
    expect(optValid.status).toBe(200);
    expect(
      new Headers((fetchMock.mock.calls[0][1] as RequestInit).headers).get(
        "authorization",
      ),
    ).toBe("Bearer access-token");

    // optional with BOTH expired access and expired refresh degrades to anonymous (not 401)
    const fullyExpiredCookie = makeSessionCookie({
      accessTokenExpiresAtUtc: new Date(Date.now() - 20_000).toISOString(),
      refreshTokenExpiresAtUtc: new Date(Date.now() - 10_000).toISOString(),
    });
    const optExpiredBoth = await forwardBffRequest(
      makeRequest({ method: "GET", cookie: fullyExpiredCookie }),
      { upstreamPath: "/api/v1/optional", method: "GET", auth: "optional" },
    );
    expect(optExpiredBoth.status).toBe(200);
    expect(
      new Headers((fetchMock.mock.calls[1][1] as RequestInit).headers).has(
        "authorization",
      ),
    ).toBe(false);

    // user with expired access + valid refresh returns 401 without calling upstream
    const expiredAccessCookie = makeSessionCookie({
      accessTokenExpiresAtUtc: new Date(Date.now() - 10_000).toISOString(),
      refreshTokenExpiresAtUtc: new Date(Date.now() + 60_000).toISOString(),
    });
    const userExpiredAccess = await forwardBffRequest(
      makeRequest({ method: "GET", cookie: expiredAccessCookie }),
      { upstreamPath: "/api/v1/me", method: "GET", auth: "user" },
    );
    expect(userExpiredAccess.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("enforces sameOrigin on mutating methods and handles missing API_BASE_URL safely", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    for (const method of ["PUT", "PATCH", "DELETE"] as const) {
      const missingOrigin = await forwardBffRequest(
        makeRequest({ method, origin: null }),
        { upstreamPath: "/api/v1/items", method, auth: "public" },
      );
      expect(missingOrigin.status).toBe(403);
    }
    expect(fetchMock).not.toHaveBeenCalled();

    vi.stubEnv("API_BASE_URL", "");
    const missingBase = await forwardBffRequest(
      makeRequest({ method: "GET" }),
      {
        upstreamPath: "/api/v1/items",
        method: "GET",
        auth: "public",
        missingBaseUrlMessage: "Backend is not configured",
      },
    );
    expect(missingBase.status).toBe(503);
    expect(await missingBase.text()).toContain("Backend is not configured");
  });

  it("cancels oversized chunked streams early with 413 in json, optional-json, raw, and readBoundedJson modes", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const makeChunkedRequest = (contentType: string) => {
      const cancel = vi.fn(() => Promise.resolve());
      const chunks = [new Uint8Array(64), new Uint8Array(64)];
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
      return {
        cancel,
        request: makeRequest({
          headers: { "content-type": contentType },
          body,
        }),
      };
    };

    for (const bodyMode of ["json", "optional-json", "raw"] as const) {
      const { cancel, request } = makeChunkedRequest("application/json");
      const res = await forwardBffRequest(request, {
        upstreamPath: "/api/v1/items",
        method: "POST",
        auth: "public",
        bodyMode,
        maxBodyBytes: 80,
      });
      expect(res.status).toBe(413);
      expect(res.headers.get("content-type")).toBe("application/problem+json");
      expect(cancel).toHaveBeenCalledOnce();
    }

    const { cancel, request } = makeChunkedRequest("application/json");
    const bounded = await readBoundedJson(request, 80);
    expect(bounded.ok).toBe(false);
    if (!bounded.ok) {
      expect(bounded.response.status).toBe(413);
    }
    expect(cancel).toHaveBeenCalledOnce();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("validates IPv4/IPv6 tokens, header precedence, and strips malformed tokens in extractForwardedClientHeaders", () => {
    expect(
      extractForwardedClientHeaders(
        makeRequest({
          headers: {
            "cf-connecting-ip": "[2001:db8::1]:443",
            "x-vercel-forwarded-for": "198.51.100.2",
            "x-real-ip": "198.51.100.3",
            "x-forwarded-for": "evil-header, 203.0.113.5",
            "x-forwarded-proto": "HTTPS",
          },
        }),
      ),
    ).toEqual({
      "X-Forwarded-For": "2001:db8::1",
      "X-Forwarded-Proto": "https",
    });

    expect(
      extractForwardedClientHeaders(
        makeRequest({
          headers: {
            "cf-connecting-ip": "not-an-ip",
            "x-vercel-forwarded-for": "198.51.100.2:8080, 10.0.0.1",
          },
        }),
      ),
    ).toEqual({
      "X-Forwarded-For": "198.51.100.2",
    });

    expect(
      extractForwardedClientHeaders(
        makeRequest({
          headers: {
            "x-forwarded-for": "spoofed, 203.0.113.9, ::ffff:192.0.2.1",
            "x-forwarded-proto": "javascript",
          },
        }),
      ),
    ).toEqual({
      "X-Forwarded-For": "203.0.113.9, ::ffff:192.0.2.1",
    });
  });

  it.each([
    "//evil.test/api/v1/x",
    "https://evil.test/api/v1/x",
    "/admin/secret",
    "/api/../secret",
  ])(
    "rejects unsafe upstreamPath %s before calling fetch",
    async (upstreamPath) => {
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);

      const res = await forwardBffRequest(makeRequest({ method: "GET" }), {
        upstreamPath,
        method: "GET",
        auth: "public",
      });
      expect(res.status).toBe(400);
      expect(res.headers.get("content-type")).toBe("application/problem+json");
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("rejects declared Content-Length exceeding maxBodyBytes with 413 before calling fetch", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    for (const bodyMode of ["json", "optional-json", "raw"] as const) {
      const res = await forwardBffRequest(
        makeRequest({
          headers: {
            "content-type": "application/json",
            "content-length": "512",
          },
          body: JSON.stringify({ hello: "world" }),
        }),
        {
          upstreamPath: "/api/v1/items",
          method: "POST",
          auth: "public",
          bodyMode,
          maxBodyBytes: 64,
        },
      );
      expect(res.status).toBe(413);
      expect(res.headers.get("content-type")).toBe("application/problem+json");
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("ignores all-malformed IP tokens and unsupported protocols in extractForwardedClientHeaders", () => {
    expect(
      extractForwardedClientHeaders(
        makeRequest({
          headers: {
            "x-forwarded-for": "not-an-ip, bad_host, 999.999.999.999",
            "x-forwarded-proto": "ftp",
          },
        }),
      ),
    ).toEqual({});

    expect(
      extractForwardedClientHeaders(
        makeRequest({
          headers: {
            "x-forwarded-proto": "HTTP",
          },
        }),
      ),
    ).toEqual({
      "X-Forwarded-Proto": "http",
    });
  });
});
