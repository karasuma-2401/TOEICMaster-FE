import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { forwardWriting } from "./writing-proxy";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("Writing BFF proxy", () => {
  it("forwards Part, pagination, and search parameters to the backend", async () => {
    vi.stubEnv("API_BASE_URL", "http://api:8080");
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ items: [] }));
    vi.stubGlobal("fetch", fetchMock);
    const request = new NextRequest(
      "http://localhost:3000/api/writing/exercises?part=2&pageNumber=3&pageSize=20&query=work",
    );

    const response = await forwardWriting(request, ["exercises"], "GET");

    expect(response.status).toBe(200);
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      "http://api:8080/api/v1/writing/exercises?part=2&pageNumber=3&pageSize=20&query=work",
    );
  });

  it.each(["next", "submit"])(
    "forwards a bodyless %s action",
    async (action) => {
      vi.stubEnv("API_BASE_URL", "http://api:8080");
      const fetchMock = vi
        .fn()
        .mockResolvedValue(Response.json({ id: "attempt" }));
      vi.stubGlobal("fetch", fetchMock);
      const attemptId = "00000000-0000-0000-0000-000000000001";
      const request = new NextRequest(
        `http://localhost:3000/api/writing/attempts/${attemptId}/${action}`,
        {
          method: "POST",
          headers: { Origin: "http://localhost:3000" },
        },
      );

      const response = await forwardWriting(
        request,
        ["attempts", attemptId, action],
        "POST",
      );

      expect(response.status).toBe(200);
      expect(fetchMock).toHaveBeenCalledOnce();
      expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "POST" });
    },
  );

  it.each(["next", "submit"])(
    "accepts an empty request stream for %s as delivered by the web server",
    async (action) => {
      vi.stubEnv("API_BASE_URL", "http://api:8080");
      const fetchMock = vi
        .fn()
        .mockResolvedValue(Response.json({ id: "attempt" }));
      vi.stubGlobal("fetch", fetchMock);
      const attemptId = "00000000-0000-0000-0000-000000000001";
      const body = new ReadableStream({
        start(controller) {
          controller.close();
        },
      });
      const request = new NextRequest(
        `http://localhost:3000/api/writing/attempts/${attemptId}/${action}`,
        {
          method: "POST",
          headers: { Origin: "http://localhost:3000" },
          body,
          duplex: "half",
        },
      );
      expect(request.body).not.toBeNull();

      const response = await forwardWriting(
        request,
        ["attempts", attemptId, action],
        "POST",
      );

      expect(response.status).toBe(200);
      expect(fetchMock).toHaveBeenCalledOnce();
    },
  );

  it("rejects a non-JSON request body", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const request = new NextRequest(
      "http://localhost:3000/api/writing/attempts",
      {
        method: "POST",
        headers: {
          Origin: "http://localhost:3000",
          "Content-Type": "text/plain",
        },
        body: "invalid",
      },
    );
    expect((await forwardWriting(request, ["attempts"], "POST")).status).toBe(
      400,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("creates an HttpOnly anonymous owner session only for a new attempt", async () => {
    vi.stubEnv("API_BASE_URL", "http://api:8080");
    const fetchMock = vi
      .fn()
      .mockResolvedValue(Response.json({ id: "attempt" }));
    vi.stubGlobal("fetch", fetchMock);
    const request = new NextRequest(
      "http://localhost:3000/api/writing/attempts",
      {
        method: "POST",
        headers: {
          Origin: "http://localhost:3000",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          testId: "00000000-0000-0000-0000-000000000001",
          mode: "FULL",
        }),
      },
    );

    const response = await forwardWriting(request, ["attempts"], "POST");

    expect(response.status).toBe(200);
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      "http://api:8080/api/v1/writing/attempts",
    );
    const headers = fetchMock.mock.calls[0][1]?.headers as Headers;
    expect(headers.get("X-Writing-Anonymous-Session")).toMatch(
      /^[0-9a-f-]{36}$/i,
    );
    expect(response.headers.get("set-cookie")).toContain(
      "toeicmaster_writing_anonymous=",
    );
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
  });

  it("does not proxy an unknown path", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = await forwardWriting(
      new NextRequest("http://localhost:3000/api/writing/private"),
      ["private"],
      "GET",
    );

    expect(response.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("creates an anonymous owner when starting practice from a published exercise", async () => {
    vi.stubEnv("API_BASE_URL", "http://api:8080");
    const fetchMock = vi
      .fn()
      .mockResolvedValue(Response.json({ id: "attempt" }, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    const exerciseId = "00000000-0000-0000-0000-000000000001";
    const request = new NextRequest(
      `http://localhost:3000/api/writing/exercises/${exerciseId}/attempts`,
      {
        method: "POST",
        headers: {
          Origin: "http://localhost:3000",
          "Content-Type": "application/json",
        },
        body: "{}",
      },
    );

    const response = await forwardWriting(
      request,
      ["exercises", exerciseId, "attempts"],
      "POST",
    );

    expect(response.status).toBe(201);
    const headers = fetchMock.mock.calls[0][1]?.headers as Headers;
    expect(headers.get("X-Writing-Anonymous-Session")).toMatch(
      /^[0-9a-f-]{36}$/i,
    );
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
  });
});
