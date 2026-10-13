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
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("registration proxy", () => {
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
      "http://api:8080/api/auth/register",
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
            { errors: { Email: ["Email không hợp lệ."] } },
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
      errors: { Email: ["Email không hợp lệ."] },
    });

    const conflict = await POST(registrationRequest(request));
    expect(conflict.status).toBe(409);
    expect(await conflict.json()).toMatchObject({
      title: "Email này đã được sử dụng.",
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
});
