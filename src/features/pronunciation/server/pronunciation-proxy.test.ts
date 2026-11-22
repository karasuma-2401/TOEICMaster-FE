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
    length?: string;
    signal?: AbortSignal;
    type?: string;
  } = {},
) {
  const headers = new Headers({
    "content-type": init.type ?? "multipart/form-data; boundary=x",
    origin: init.origin ?? origin,
  });
  if (init.cookie) headers.set("cookie", init.cookie);
  if (init.length !== undefined) headers.set("content-length", init.length);
  return new NextRequest(`${origin}/api/pronunciation/assessments`, {
    method: "POST",
    headers,
    body: init.body ?? "--x--",
    signal: init.signal,
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

  it.each([
    { label: "missing", length: undefined },
    { label: "malformed", length: "invalid" },
    { label: "understated", length: "16" },
  ])(
    "cancels an oversized stream with $label Content-Length",
    async ({ length }) => {
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);
      const cancel = vi.fn(() => Promise.withResolvers<void>().promise);
      const chunks = [new Uint8Array(maxAssessmentBytes), new Uint8Array(1)];
      const pull = vi.fn(
        (controller: ReadableStreamDefaultController<Uint8Array>) => {
          const chunk = chunks.shift();
          if (chunk) controller.enqueue(chunk);
          else controller.close();
        },
      );
      const body = new ReadableStream({ pull, cancel }, { highWaterMark: 0 });

      const response = await forwardPronunciationAssessment(
        request({ body, length }),
      );

      expect(response.status).toBe(413);
      expect(cancel).toHaveBeenCalledOnce();
      expect(pull).toHaveBeenCalledTimes(2);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("forwards all streamed bytes when the size equals the limit", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    const prefix = new TextEncoder().encode("--x\r\n");
    const rest = new Uint8Array(maxAssessmentBytes - prefix.byteLength).fill(
      42,
    );
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(prefix);
        controller.enqueue(rest);
        controller.close();
      },
    });

    const response = await forwardPronunciationAssessment(request({ body }));

    expect(response.status).toBe(204);
    const [, init] = fetchMock.mock.calls[0] as [URL, { body: ArrayBuffer }];
    expect(Buffer.from(init.body).equals(Buffer.concat([prefix, rest]))).toBe(
      true,
    );
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

  it("aborts the in-flight upstream fetch when the client disconnects", async () => {
    const client = new AbortController();
    const started = Promise.withResolvers<AbortSignal>();
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockImplementation((_input, init) => {
        const signal = init?.signal;
        if (!signal) throw new Error("Expected an upstream signal");
        started.resolve(signal);
        return new Promise((_, reject) => {
          signal.addEventListener("abort", () => reject(signal.reason), {
            once: true,
          });
        });
      }),
    );

    const response = forwardPronunciationAssessment(
      request({ signal: client.signal }),
    );
    const upstreamSignal = await started.promise;
    expect(upstreamSignal.aborted).toBe(false);

    client.abort();

    expect(upstreamSignal.reason).toBe(client.signal.reason);
    expect((await response).status).toBe(502);
  });

  it("forwards X-Forwarded-For and X-Forwarded-Proto client headers via bff-proxy", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response('{"ok":true}', { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const headers = new Headers({
      "content-type": "multipart/form-data; boundary=x",
      origin,
      "x-forwarded-for": "203.0.113.42, 10.0.0.2",
      "x-forwarded-proto": "https",
    });
    const req = new NextRequest(`${origin}/api/pronunciation/assessments`, {
      method: "POST",
      headers,
      body: "--x--",
    });

    const response = await forwardPronunciationAssessment(req);
    expect(response.status).toBe(200);
    const forwardedHeaders = new Headers(
      (fetchMock.mock.calls[0][1] as RequestInit).headers,
    );
    expect(forwardedHeaders.get("x-forwarded-for")).toBe(
      "203.0.113.42, 10.0.0.2",
    );
    expect(forwardedHeaders.get("x-forwarded-proto")).toBe("https");
  });

  it("refuses an API_BASE_URL that is not http(s)", () => {
    vi.stubEnv("API_BASE_URL", "file:///etc/passwd");
    expect(() => backendBase()).toThrow();
    vi.stubEnv("API_BASE_URL", "http://user:pass@api");
    expect(() => backendBase()).toThrow();
  });
});
