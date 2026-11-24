import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

function registrationRequest(body: unknown) {
  return new NextRequest("http://localhost/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://localhost",
    },
    body: JSON.stringify(body),
  });
}

describe("registration proxy", () => {
  it("forwards client IP headers through the shared BFF boundary", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 202 }));
    vi.stubGlobal("fetch", fetchMock);
    const request = registrationRequest({
      displayName: "Learner",
      email: "learner@example.com",
      password: "password123",
    });
    request.headers.set("X-Real-IP", "198.51.100.10");
    request.headers.set("X-Forwarded-Proto", "https");

    expect((await POST(request)).status).toBe(202);
    const headers = fetchMock.mock.calls[0]![1].headers as Headers;
    expect(headers.get("X-Forwarded-For")).toBe("198.51.100.10");
    expect(headers.get("X-Forwarded-Proto")).toBe("https");
  });

  it("validates browser input before contacting the backend", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      registrationRequest({ displayName: "", email: "bad", password: "short" }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      errors: {
        DisplayName: expect.any(Array),
        Email: expect.any(Array),
        Password: expect.any(Array),
      },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("forwards only the normalized backend contract", async () => {
    vi.stubEnv("API_BASE_URL", "http://api:8080");
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      registrationRequest({
        displayName: "  Linh  ",
        email: "  linh@example.com  ",
        password: " password ",
        confirmPassword: "password",
      }),
    );

    expect(response.status).toBe(202);
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      "http://api:8080/api/v1/auth/register",
    );
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: "POST",
      body: JSON.stringify({
        displayName: "Linh",
        email: "linh@example.com",
        password: " password ",
      }),
    });
  });

  it("maps upstream validation and duplicate-email responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          Response.json(
            { errors: { Email: ["Invalid email address."] } },
            { status: 400 },
          ),
        )
        .mockResolvedValueOnce(new Response(null, { status: 409 })),
    );
    const request = {
      displayName: "Linh",
      email: "linh@example.com",
      password: "password",
    };

    const validation = await POST(registrationRequest(request));
    expect(validation.status).toBe(400);
    expect(await validation.json()).toMatchObject({
      errors: { Email: ["Invalid email address."] },
    });

    const conflict = await POST(registrationRequest(request));
    expect(conflict.status).toBe(409);
    expect(await conflict.json()).toMatchObject({
      title: "This email is already in use.",
    });
  });

  it("does not expose unexpected upstream errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("sensitive database error")),
    );

    const response = await POST(
      registrationRequest({
        displayName: "Linh",
        email: "linh@example.com",
        password: "password",
      }),
    );

    expect(response.status).toBe(502);
    expect(await response.text()).not.toContain("sensitive");
  });

  it("preserves the backend retry interval when registration is rate limited", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(null, { status: 429, headers: { "Retry-After": "42" } }),
        ),
    );

    const response = await POST(
      registrationRequest({
        displayName: "Linh",
        email: "linh@example.com",
        password: "password",
      }),
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("42");
  });
  it("passes through 504 upstream timeout as 504", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() => {
        return Promise.reject(new DOMException("Timeout", "TimeoutError"));
      }),
    );

    const response = await POST(
      registrationRequest({
        displayName: "Linh",
        email: "linh@example.com",
        password: "password",
      }),
    );

    expect(response.status).toBe(504);
  });

  it("preserves 403 on cross-origin POST requests", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const request = new NextRequest("http://localhost/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://evil.example",
      },
      body: JSON.stringify({
        displayName: "Linh",
        email: "linh@example.com",
        password: "password",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(403);
    expect(response.headers.get("content-type")).toBe(
      "application/problem+json",
    );
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toMatchObject({
      title: "Invalid request.",
      status: 403,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("preserves 503 when API_BASE_URL is unavailable", async () => {
    vi.stubEnv("API_BASE_URL", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      registrationRequest({
        displayName: "Linh",
        email: "linh@example.com",
        password: "password",
      }),
    );

    expect(response.status).toBe(503);
    expect(response.headers.get("content-type")).toBe(
      "application/problem+json",
    );
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toMatchObject({
      title: "The service is temporarily unavailable.",
      status: 503,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
