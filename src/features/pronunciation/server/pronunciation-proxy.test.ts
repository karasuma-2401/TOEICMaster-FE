import { NextRequest, NextResponse } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  setSessionCookie,
  type AuthSession,
} from "@/features/auth/server/session";
import {
  forwardPronunciationAssessment,
  maxAssessmentBytes,
} from "./pronunciation-proxy";
import { backendBase } from "./upstream";

const origin = "http://localhost:3000";

function authCookie() {
  const response = NextResponse.next();
  const session: AuthSession = {
    accessToken: "access-token",
    accessTokenExpiresAtUtc: new Date(Date.now() + 60_000).toISOString(),
    refreshToken: "refresh-token",
    refreshTokenExpiresAtUtc: new Date(Date.now() + 60_000).toISOString(),
    user: { id: "user-1", displayName: "Learner", email: "user@example.com" },
    role: "USER",
    rememberMe: false,
  };
  setSessionCookie(response, session);
  return response.headers.get("set-cookie")!.split(";")[0];
}

function request(
  init: {
    origin?: string;
    cookie?: string;
    body?: BodyInit;
    type?: string;
  } = {},
) {
  const headers = new Headers({
    "content-type": init.type ?? "multipart/form-data; boundary=x",
    origin: init.origin ?? origin,
  });
  if (init.cookie) headers.set("cookie", init.cookie);
  return new NextRequest(`${origin}/api/pronunciation/assessments`, {
    method: "POST",
    headers,
    body: init.body ?? "--x--",
  });
}

beforeEach(() => {
  vi.stubEnv("AUTH_SESSION_SECRET", Buffer.alloc(32, 5).toString("base64url"));
  vi.stubEnv("API_BASE_URL", "http://api:8080");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("forwardPronunciationAssessment", () => {
  it("rejects cross-origin requests", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = await forwardPronunciationAssessment(
      request({ origin: "https://evil.example" }),
    );
    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("requires multipart and enforces the size limit", async () => {
    vi.stubGlobal("fetch", vi.fn());
    expect(
      (
        await forwardPronunciationAssessment(
          request({ type: "application/json" }),
        )
      ).status,
    ).toBe(400);
    const big = new Uint8Array(maxAssessmentBytes + 1);
    expect(
      (await forwardPronunciationAssessment(request({ body: big }))).status,
    ).toBe(413);
  });

  it("forwards with the bearer token and relays the response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('{"ok":true}', {
        status: 200,
        headers: { "content-type": "application/json", "x-internal": "1" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const response = await forwardPronunciationAssessment(
      request({ cookie: authCookie() }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-internal")).toBeNull();
    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.toString()).toBe(
      "http://api:8080/api/v1/pronunciation/assessments",
    );
    const headers = new Headers(init.headers);
    expect(headers.get("authorization")).toBe("Bearer access-token");
    expect(headers.get("content-type")).toContain("multipart/form-data");
  });

  it("forwards anonymous requests so the backend can answer 401", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);
    const response = await forwardPronunciationAssessment(request());
    expect(response.status).toBe(401);
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(new Headers(init.headers).has("authorization")).toBe(false);
  });

  it("maps timeouts to 504 and network errors to 502 without details", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new DOMException("slow", "TimeoutError")),
    );
    const timeout = await forwardPronunciationAssessment(request());
    expect(timeout.status).toBe(504);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("connect ECONNREFUSED 10.0.0.1")),
    );
    const failed = await forwardPronunciationAssessment(request());
    expect(failed.status).toBe(502);
    expect(await failed.text()).not.toContain("ECONNREFUSED");
  });

  it("refuses an API_BASE_URL that is not http(s)", () => {
    vi.stubEnv("API_BASE_URL", "file:///etc/passwd");
    expect(() => backendBase()).toThrow();
    vi.stubEnv("API_BASE_URL", "http://user:pass@api");
    expect(() => backendBase()).toThrow();
  });
});
