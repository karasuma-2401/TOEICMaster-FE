import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ids } from "../testing/fixtures";
import { forwardSpeaking, recordingUploadLimit } from "./speaking-proxy";
import { jsonBodyLimit } from "./upstream";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

const origin = { Origin: "http://localhost:3000" };

describe("Speaking BFF proxy", () => {
  it("forwards query strings and gives attempts an anonymous owner", async () => {
    vi.stubEnv("API_BASE_URL", "http://api:8080");
    const fetchMock = vi.fn().mockResolvedValue(Response.json({}));
    vi.stubGlobal("fetch", fetchMock);

    await forwardSpeaking(
      new NextRequest("http://localhost:3000/api/speaking/tests?pageSize=50"),
      ["tests"],
      "GET",
    );
    await forwardSpeaking(
      new NextRequest("http://localhost:3000/api/speaking/exercises?part=2"),
      ["exercises"],
      "GET",
    );
    await forwardSpeaking(
      new NextRequest(
        `http://localhost:3000/api/speaking/exercises/${ids.test}`,
      ),
      ["exercises", ids.test],
      "GET",
    );
    const response = await forwardSpeaking(
      new NextRequest("http://localhost:3000/api/speaking/attempts", {
        method: "POST",
        headers: { ...origin, "Content-Type": "application/json" },
        body: JSON.stringify({ testId: ids.test, mode: "FULL" }),
      }),
      ["attempts"],
      "POST",
    );

    expect(String(fetchMock.mock.calls[0][0])).toBe(
      "http://api:8080/api/v1/speaking/tests?pageSize=50",
    );
    expect(String(fetchMock.mock.calls[1][0])).toBe(
      "http://api:8080/api/v1/speaking/exercises?part=2",
    );
    expect(String(fetchMock.mock.calls[2][0])).toBe(
      `http://api:8080/api/v1/speaking/exercises/${ids.test}`,
    );
    const headers = fetchMock.mock.calls[3][1].headers as Headers;
    expect(headers.get("X-Speaking-Anonymous-Session")).toMatch(
      /^[0-9a-f-]{36}$/,
    );
    expect(response.headers.get("set-cookie")).toContain(
      "toeicmaster_speaking_anonymous=",
    );
  });

  it("passes recordings through as multipart and enforces the size limit", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({}));
    vi.stubGlobal("fetch", fetchMock);
    const form = new FormData();
    form.set("file", new Blob(["audio"], { type: "audio/webm" }), "a.webm");
    const path = ["attempts", ids.attempt, "recordings", "3"];

    const ok = await forwardSpeaking(
      new NextRequest(`http://localhost:3000/api/speaking/${path.join("/")}`, {
        method: "PUT",
        headers: origin,
        body: form,
      }),
      path,
      "PUT",
    );
    const tooLarge = await forwardSpeaking(
      new NextRequest(`http://localhost:3000/api/speaking/${path.join("/")}`, {
        method: "PUT",
        headers: {
          ...origin,
          "Content-Type": "multipart/form-data; boundary=x",
          "Content-Length": String(10 * 1024 * 1024),
        },
        body: "x",
      }),
      path,
      "PUT",
    );

    expect(ok.status).toBe(200);
    const headers = fetchMock.mock.calls[0][1].headers as Headers;
    expect(headers.get("Content-Type")).toMatch(
      /^multipart\/form-data; boundary=/,
    );
    expect(tooLarge.status).toBe(413);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("forwards AI evaluation consent with the anonymous owner and availability checks", async () => {
    vi.stubEnv("API_BASE_URL", "http://api:8080");
    const fetchMock = vi.fn().mockResolvedValue(Response.json({}));
    vi.stubGlobal("fetch", fetchMock);

    await forwardSpeaking(
      new NextRequest("http://localhost:3000/x"),
      ["evaluation-availability"],
      "GET",
    );
    await forwardSpeaking(
      new NextRequest("http://localhost:3000/x", {
        method: "POST",
        headers: { ...origin, "Content-Type": "application/json" },
        body: JSON.stringify({ accepted: true }),
      }),
      ["attempts", ids.attempt, "evaluation-consent"],
      "POST",
    );

    expect(String(fetchMock.mock.calls[0][0])).toBe(
      "http://api:8080/api/v1/speaking/evaluation-availability",
    );
    expect(String(fetchMock.mock.calls[1][0])).toBe(
      `http://api:8080/api/v1/speaking/attempts/${ids.attempt}/evaluation-consent`,
    );
    const headers = fetchMock.mock.calls[1][1].headers as Headers;
    expect(headers.get("X-Speaking-Anonymous-Session")).toMatch(
      /^[0-9a-f-]{36}$/,
    );
    expect(
      (
        await forwardSpeaking(
          new NextRequest("http://localhost:3000/x"),
          ["attempts", ids.attempt, "evaluation-consent"],
          "GET",
        )
      ).status,
    ).toBe(404);
  });

  it("relays audio privately and rejects unknown or cross-origin calls", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response("audio", { headers: { "Content-Type": "audio/webm" } }),
        ),
    );
    const path = ["attempts", ids.attempt, "recordings", "1"];
    const audio = await forwardSpeaking(
      new NextRequest("http://localhost:3000/x"),
      path,
      "GET",
    );
    expect(audio.headers.get("cache-control")).toBe("private, no-store");
    expect(audio.headers.get("x-content-type-options")).toBe("nosniff");

    expect(
      (
        await forwardSpeaking(
          new NextRequest("http://localhost:3000/x"),
          ["admin"],
          "GET",
        )
      ).status,
    ).toBe(404);
    expect(
      (
        await forwardSpeaking(
          new NextRequest("http://localhost:3000/x", { method: "POST" }),
          ["attempts", ids.attempt, "next"],
          "POST",
        )
      ).status,
    ).toBe(403);
  });

  it("forwards the trusted client IP so guests get their own rate-limit bucket", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({}));
    vi.stubGlobal("fetch", fetchMock);

    await forwardSpeaking(
      new NextRequest("http://localhost:3000/x", {
        method: "POST",
        headers: {
          ...origin,
          "Content-Type": "application/json",
          "X-Forwarded-For": "203.0.113.7, 10.0.0.1",
          "X-Forwarded-Proto": "https",
        },
        body: JSON.stringify({ accepted: true }),
      }),
      ["attempts", ids.attempt, "evaluation-consent"],
      "POST",
    );
    await forwardSpeaking(
      new NextRequest("http://localhost:3000/x", {
        headers: { "X-Forwarded-For": "not-an-ip" },
      }),
      ["tests"],
      "GET",
    );

    const forwarded = fetchMock.mock.calls[0][1].headers as Headers;
    expect(forwarded.get("X-Forwarded-For")).toBe("203.0.113.7, 10.0.0.1");
    expect(forwarded.get("X-Forwarded-Proto")).toBe("https");
    const spoofed = fetchMock.mock.calls[1][1].headers as Headers;
    expect(spoofed.get("X-Forwarded-For")).toBeNull();
  });

  it("stops reading an oversized upload without Content-Length at the cap", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const path = ["attempts", ids.attempt, "recordings", "2"];

    const response = await forwardSpeaking(
      new NextRequest(`http://localhost:3000/api/speaking/${path.join("/")}`, {
        method: "PUT",
        headers: {
          ...origin,
          "Content-Type": "multipart/form-data; boundary=x",
        },
        body: "x".repeat(recordingUploadLimit + 1),
      }),
      path,
      "PUT",
    );

    expect(response.status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects oversized JSON bodies before the backend", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await forwardSpeaking(
      new NextRequest("http://localhost:3000/x", {
        method: "POST",
        headers: { ...origin, "Content-Type": "application/json" },
        body: JSON.stringify({ pad: "x".repeat(jsonBodyLimit) }),
      }),
      ["attempts"],
      "POST",
    );

    expect(response.status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
