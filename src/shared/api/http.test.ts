import { afterEach, describe, expect, it, vi } from "vitest";
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
        title: "Dữ liệu không hợp lệ",
        detail: "Email sai định dạng",
        code: "VALIDATION_FAILED",
        traceId: "trace-123",
        errors: {
          Email: ["Email không hợp lệ"],
          NewPassword: ["Mật khẩu quá ngắn", "Cần chữ hoa"],
        },
      },
      400,
      "Fallback",
      "45",
    );

    expect(err).toBeInstanceOf(HttpError);
    expect(err.status).toBe(400);
    expect(err.title).toBe("Dữ liệu không hợp lệ");
    expect(err.detail).toBe("Email sai định dạng");
    expect(err.code).toBe("VALIDATION_FAILED");
    expect(err.traceId).toBe("trace-123");
    expect(err.retryAfterSeconds).toBe(45);
    expect(err.fieldErrors).toEqual({
      email: ["Email không hợp lệ"],
      newPassword: ["Mật khẩu quá ngắn", "Cần chữ hoa"],
    });
    expect(err.firstFieldErrors()).toEqual({
      email: "Email không hợp lệ",
      newPassword: "Mật khẩu quá ngắn",
    });

    const futureDate = new Date(Date.now() + 10_000).toUTCString();
    const dateErr = parseProblemDetails(null, 429, "Quá nhiều", futureDate);
    expect(dateErr.message).toBe("Quá nhiều");
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
});
