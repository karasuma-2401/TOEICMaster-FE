import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as forgotPassword } from "./forgot-password/route";
import { POST as resetPassword } from "./reset-password/route";
import { POST as verifyPasswordReset } from "./verify-password-reset/route";

function request(path: string, body: object, origin = "http://localhost") {
  return new NextRequest(`http://localhost/api/auth/${path}`, {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.stubEnv("API_BASE_URL", "http://backend:8080");
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("password reset BFF", () => {
  it("forwards a valid recovery request without revealing account status", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await forgotPassword(
      request("forgot-password", { email: "  linh@example.com  " }),
    );

    expect(response.status).toBe(202);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      "http://backend:8080/api/v1/auth/forgot-password",
    );
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      email: "linh@example.com",
    });
  });

  it("validates recovery input and preserves rate-limit information", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(null, { status: 429, headers: { "Retry-After": "60" } }),
      );
    vi.stubGlobal("fetch", fetchMock);

    expect(
      (await forgotPassword(request("forgot-password", { email: "bad" })))
        .status,
    ).toBe(400);
    const response = await forgotPassword(
      request("forgot-password", { email: "linh@example.com" }),
    );
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("60");
  });

  it("returns only a valid reset verification result", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        resetToken: "reset-token",
        expiresAtUtc: new Date(Date.now() + 10 * 60_000).toISOString(),
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await verifyPasswordReset(
      request("verify-password-reset", {
        email: "linh@example.com",
        code: "123456",
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toMatchObject({ resetToken: "reset-token" });
  });

  it("rejects malformed verification payloads and reset passwords", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    expect(
      (
        await verifyPasswordReset(
          request("verify-password-reset", {
            email: "linh@example.com",
            code: "123",
          }),
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await resetPassword(
          request("reset-password", {
            resetToken: "reset-token",
            newPassword: "short",
          }),
        )
      ).status,
    ).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("clears the local session after a successful password reset", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 204 })),
    );

    const response = await resetPassword(
      request("reset-password", {
        resetToken: "reset-token",
        newPassword: "new-password",
      }),
    );

    expect(response.status).toBe(204);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });
});
