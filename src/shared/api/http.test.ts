import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, getJson } from "./client";
import {
  fetchWithAuthRefresh,
  HttpError,
  parseProblemDetails,
  refreshSessionLocked,
  requestJson,
  requestVoid,
} from "./http";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("shared/api/http", () => {
  it("parses RFC 9457 ProblemDetails with lowercased fieldErrors and numeric/date Retry-After", () => {
    const err = parseProblemDetails(
      {
        title: "Invalid input",
        detail: "Invalid email format",
        code: "VALIDATION_FAILED",
        traceId: "trace-123",
        errors: {
          Email: ["Invalid email"],
          NewPassword: ["Password is too short", "Uppercase letter required"],
        },
      },
      400,
      "Fallback",
      "45",
    );

    expect(err).toBeInstanceOf(HttpError);
    expect(err.status).toBe(400);
    expect(err.title).toBe("Invalid input");
    expect(err.detail).toBe("Invalid email format");
    expect(err.code).toBe("VALIDATION_FAILED");
    expect(err.traceId).toBe("trace-123");
    expect(err.retryAfterSeconds).toBe(45);
    expect(err.fieldErrors).toEqual({
      email: ["Invalid email"],
      newPassword: ["Password is too short", "Uppercase letter required"],
    });
    expect(err.firstFieldErrors()).toEqual({
      email: "Invalid email",
      newPassword: "Password is too short",
    });

    const futureDate = new Date(Date.now() + 10_000).toUTCString();
    const dateErr = parseProblemDetails(
      null,
      429,
      "Too many requests",
      futureDate,
    );
    expect(dateErr.message).toBe("Too many requests");
    expect(dateErr.retryAfterSeconds).toBeGreaterThanOrEqual(8);
    expect(dateErr.retryAfterSeconds).toBeLessThanOrEqual(11);
  });

  it("coordinates concurrent refreshSessionLocked via navigator.locks when available", async () => {
    const requestMock = vi.fn(
      async (_name: string, callback: () => Promise<void>) => callback(),
    );
    vi.stubGlobal("navigator", { locks: { request: requestMock } });
    const refreshFn = vi.fn().mockResolvedValue({ id: "u1" });

    await refreshSessionLocked(refreshFn);

    expect(requestMock).toHaveBeenCalledWith(
      "toeicmaster-refresh",
      expect.any(Function),
    );
    expect(refreshFn).toHaveBeenCalledTimes(1);
  });

  it("deduplicates concurrent refreshSessionLocked calls when navigator.locks is unavailable", async () => {
    vi.stubGlobal("navigator", {});
    let resolveRefresh!: () => void;
    const refreshFn = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveRefresh = resolve;
        }),
    );

    const p1 = refreshSessionLocked(refreshFn);
    const p2 = refreshSessionLocked(refreshFn);
    expect(refreshFn).toHaveBeenCalledTimes(1);

    resolveRefresh();
    await Promise.all([p1, p2]);
  });

  it("retries once after 401 when refresh succeeds and deduplicates concurrent 401s", async () => {
    vi.stubGlobal("navigator", {});
    let callCount = 0;
    const fetchMock = vi.fn().mockImplementation(async () => {
      callCount += 1;
      if (callCount <= 2) {
        return new Response(null, { status: 401 });
      }
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    let resolveRefresh!: () => void;
    const refreshFn = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveRefresh = resolve;
        }),
    );

    const req1 = fetchWithAuthRefresh("/api/a", { refreshFn });
    const req2 = fetchWithAuthRefresh("/api/b", { refreshFn });

    await vi.waitFor(() => {
      expect(refreshFn).toHaveBeenCalledTimes(1);
    });
    resolveRefresh();

    const [res1, res2] = await Promise.all([req1, req2]);
    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("rethrows AbortError without triggering refresh or wrapping in 502", async () => {
    const controller = new AbortController();
    const refreshFn = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((_input, init?: RequestInit) => {
        return new Promise((_resolve, reject) => {
          init?.signal?.addEventListener(
            "abort",
            () => reject(new DOMException("Aborted", "AbortError")),
            { once: true },
          );
        });
      }),
    );

    const pending = fetchWithAuthRefresh("/api/slow", {
      signal: controller.signal,
      refreshFn,
    });
    controller.abort();

    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    expect(refreshFn).not.toHaveBeenCalled();
  });

  it("requestJson enforces boundary parse function and rejects invalid payloads with HttpError", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ id: "item-1" }), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ id: 123 }), { status: 200 }),
        ),
    );

    const parse = (raw: unknown) => {
      if (
        typeof raw !== "object" ||
        raw === null ||
        typeof (raw as { id?: unknown }).id !== "string"
      ) {
        throw new Error("Invalid id");
      }
      return raw as { id: string };
    };

    const valid = await requestJson("/api/item", { parse });
    expect(valid).toEqual({ id: "item-1" });

    await expect(requestJson("/api/item", { parse })).rejects.toMatchObject({
      name: "HttpError",
      status: 502,
    });
  });

  it.each([200, 403])(
    "propagates caller cancellation while reading a streamed JSON response with status %s",
    async (status) => {
      const controller = new AbortController();
      const abortError = new DOMException("Caller cancelled", "AbortError");
      const response = new Response(
        new ReadableStream<Uint8Array>({
          start(bodyController) {
            bodyController.enqueue(new TextEncoder().encode("{"));
            controller.signal.addEventListener(
              "abort",
              () => bodyController.error(controller.signal.reason),
              { once: true },
            );
          },
        }),
        { status },
      );
      const jsonSpy = vi.spyOn(response, "json");
      const parse = vi.fn((raw: unknown) => raw);
      const refreshFn = vi.fn();
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

      const pending = requestJson("/api/stream", {
        signal: controller.signal,
        parse,
        refreshFn,
      });
      const rejection = expect(pending).rejects.toBe(abortError);
      await vi.waitFor(() => expect(jsonSpy).toHaveBeenCalledOnce());
      controller.abort(abortError);

      await rejection;
      expect(parse).not.toHaveBeenCalled();
      expect(refreshFn).not.toHaveBeenCalled();
    },
  );

  it("preserves AbortError from requestVoid error-body parsing", async () => {
    const abortError = new DOMException("Caller cancelled", "AbortError");
    const response = new Response(null, { status: 403 });
    vi.spyOn(response, "json").mockRejectedValue(abortError);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

    await expect(requestVoid("/api/action")).rejects.toBe(abortError);
  });

  it("preserves Error-shaped AbortError from fetch and JSON decoding without a signal", async () => {
    const abortError = new Error("Caller cancelled");
    abortError.name = "AbortError";
    const response = new Response(null, { status: 200 });
    vi.spyOn(response, "json").mockRejectedValue(abortError);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValueOnce(abortError).mockResolvedValueOnce(response),
    );

    await expect(fetchWithAuthRefresh("/api/item")).rejects.toBe(abortError);
    await expect(
      requestJson("/api/item", { parse: (raw) => raw }),
    ).rejects.toBe(abortError);
  });

  it("requestVoid handles 204 No Content and empty 200 responses cleanly", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(new Response(null, { status: 204 }))
        .mockResolvedValueOnce(new Response(null, { status: 200 }))
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ title: "Forbidden" }), { status: 403 }),
        ),
    );

    await expect(
      requestVoid("/api/action", { method: "DELETE" }),
    ).resolves.toBeUndefined();
    await expect(
      requestVoid("/api/action", { method: "POST" }),
    ).resolves.toBeUndefined();
    await expect(
      requestVoid("/api/action", { method: "POST" }),
    ).rejects.toMatchObject({ status: 403, message: "Forbidden" });
  });

  it("retries at most once on 401 and skips refresh when refreshOn401 is false or signal is pre-aborted", async () => {
    vi.stubGlobal("navigator", {});
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);
    const refreshFn = vi.fn().mockResolvedValue(undefined);

    const retried = await fetchWithAuthRefresh("/api/protected", { refreshFn });
    expect(retried.status).toBe(401);
    expect(refreshFn).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    refreshFn.mockClear();
    fetchMock.mockClear();
    const noRefresh = await fetchWithAuthRefresh("/api/protected", {
      refreshOn401: false,
      refreshFn,
    });
    expect(noRefresh.status).toBe(401);
    expect(refreshFn).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const preAborted = new AbortController();
    preAborted.abort();
    fetchMock.mockRejectedValueOnce(new DOMException("Aborted", "AbortError"));
    await expect(
      fetchWithAuthRefresh("/api/protected", {
        signal: preAborted.signal,
        refreshFn,
      }),
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(refreshFn).not.toHaveBeenCalled();
  });

  it("requestJson maps HTTP error ProblemDetails into HttpError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            title: "Invalid request",
            code: "BAD_INPUT",
            traceId: "tr-9",
            errors: { Title: ["Cannot be empty"] },
          }),
          { status: 422, headers: { "retry-after": "12" } },
        ),
      ),
    );

    await expect(
      requestJson("/api/item", { parse: (raw) => raw }),
    ).rejects.toMatchObject({
      name: "HttpError",
      status: 422,
      code: "BAD_INPUT",
      traceId: "tr-9",
      retryAfterSeconds: 12,
      fieldErrors: { title: ["Cannot be empty"] },
    });
  });

  it("keeps backward-compatible client.ts ApiError and getJson exports working", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ status: "ok" }), { status: 200 }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ title: "Down" }), { status: 503 }),
        ),
    );

    await expect(getJson("/api/system/ping")).resolves.toEqual({
      status: "ok",
    });
    await expect(getJson("/api/system/ping")).rejects.toBeInstanceOf(ApiError);
  });
});
