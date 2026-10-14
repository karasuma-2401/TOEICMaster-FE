import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as resend } from "./resend-verification/route";
import { POST as verify } from "./verify-email/route";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

function request(path: string, body: object, origin = "http://localhost") {
  return new NextRequest(`http://localhost/api/auth/${path}`, {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("email verification BFF", () => {
  it("forwards a verified OTP to the versioned backend route", async () => {
    vi.stubEnv("API_BASE_URL", "http://backend:8080");
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await verify(
      request("verify-email", {
        email: "  linh@example.com  ",
        code: "123456",
      }),
    );

    expect(response.status).toBe(204);
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      "http://backend:8080/api/v1/auth/verify-email",
    );
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      email: "linh@example.com",
      code: "123456",
    });
  });

  it("rejects malformed or cross-origin verification requests", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    expect(
      (await verify(request("verify-email", { email: "bad", code: "123" })))
        .status,
    ).toBe(400);
    expect(
      (
        await resend(
          request(
            "resend-verification",
            { email: "linh@example.com" },
            "http://other",
          ),
        )
      ).status,
    ).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("forwards resend success and backend rate-limit information", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(new Response(null, { status: 202 }))
        .mockResolvedValueOnce(
          new Response(null, { status: 429, headers: { "Retry-After": "60" } }),
        ),
    );

    expect(
      (
        await resend(
          request("resend-verification", { email: "linh@example.com" }),
        )
      ).status,
    ).toBe(202);
    const rateLimited = await verify(
      request("verify-email", { email: "linh@example.com", code: "123456" }),
    );
    expect(rateLimited.status).toBe(429);
    expect(rateLimited.headers.get("retry-after")).toBe("60");
  });
});
