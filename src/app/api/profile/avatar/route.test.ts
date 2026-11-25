import { NextRequest, NextResponse } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  setSessionCookie,
  type AuthSession,
} from "@/features/auth/server/session";

const forwardMock = vi.hoisted(() => vi.fn());
vi.mock("@/features/user/server/profile-proxy", () => ({
  forward: forwardMock,
}));

import { PUT } from "./route";

beforeEach(() => {
  vi.stubEnv("AUTH_SESSION_SECRET", Buffer.alloc(32, 7).toString("base64url"));
  forwardMock.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

function withSession(
  request: NextRequest,
  overrides: Partial<AuthSession> = {},
) {
  const response = new NextResponse();
  setSessionCookie(response, {
    accessToken: "access",
    refreshToken: "refresh",
    accessTokenExpiresAtUtc: new Date(Date.now() + 60_000).toISOString(),
    refreshTokenExpiresAtUtc: new Date(Date.now() + 120_000).toISOString(),
    user: {
      id: "user-1",
      displayName: "Learner",
      email: "learner@example.com",
    },
    role: "USER",
    rememberMe: false,
    ...overrides,
  });
  request.cookies.set(
    "toeicmaster_session",
    response.cookies.get("toeicmaster_session")!.value,
  );
  return request;
}

function uploadRequest(file: File | string) {
  const form = new FormData();
  form.set("file", file);
  return withSession(
    new NextRequest("http://localhost/api/profile/avatar", {
      method: "PUT",
      headers: { Origin: "http://localhost" },
      body: form,
    }),
  );
}

describe("PUT /api/profile/avatar", () => {
  it.each(["missing", "expired access", "expired refresh"])(
    "rejects %s sessions before reading the multipart body",
    async (sessionState) => {
      const request = uploadRequest(new File(["image"], "avatar.png"));
      if (sessionState === "missing")
        request.cookies.delete("toeicmaster_session");
      if (sessionState === "expired access") {
        withSession(request, {
          accessTokenExpiresAtUtc: new Date(0).toISOString(),
        });
      }
      if (sessionState === "expired refresh") {
        withSession(request, {
          refreshTokenExpiresAtUtc: new Date(0).toISOString(),
        });
      }
      const bodySpy = vi.spyOn(request, "formData");
      forwardMock.mockResolvedValueOnce(NextResponse.json({ ok: true }));

      const response = await PUT(request);
      expect(response.status).toBe(401);
      expect(response.headers.get("content-type")).toBe(
        "application/problem+json",
      );
      expect(bodySpy).not.toHaveBeenCalled();
      expect(forwardMock).not.toHaveBeenCalled();
    },
  );

  it("rejects cross-origin uploads before reading the body", async () => {
    const request = uploadRequest(new File(["image"], "avatar.png"));
    request.headers.set("Origin", "http://attacker.example");
    const bodySpy = vi.spyOn(request, "formData");
    forwardMock.mockResolvedValueOnce(NextResponse.json({ ok: true }));

    expect((await PUT(request)).status).toBe(403);
    expect(bodySpy).not.toHaveBeenCalled();
    expect(forwardMock).not.toHaveBeenCalled();
  });

  it("rejects missing or oversized upload files", async () => {
    const missing = new FormData();
    const missingRequest = withSession(
      new NextRequest("http://localhost/api/profile/avatar", {
        method: "PUT",
        headers: { Origin: "http://localhost" },
        body: missing,
      }),
    );
    expect((await PUT(missingRequest)).status).toBe(400);

    expect(
      (
        await PUT(
          uploadRequest(
            new File([new Uint8Array(2 * 1024 * 1024 + 1)], "large.png", {
              type: "image/png",
            }),
          ),
        )
      ).status,
    ).toBe(400);
    expect(forwardMock).not.toHaveBeenCalled();
  });

  it("forwards a valid File in multipart form without setting content-type", async () => {
    forwardMock.mockResolvedValueOnce(NextResponse.json({ ok: true }));
    const response = await PUT(
      uploadRequest(new File(["image"], "avatar.png", { type: "image/png" })),
    );
    expect(response.status).toBe(200);
    const [, path, init] = forwardMock.mock.calls[0] as [
      NextRequest,
      string,
      RequestInit,
    ];
    expect(path).toBe("/api/v1/profile/avatar");
    expect(init.method).toBe("PUT");
    expect(init.body).toBeInstanceOf(FormData);
    expect(init.headers).toBeUndefined();
    expect((init.body as FormData).get("file")).toBeInstanceOf(File);
  });

  it("cancels oversized multipart payloads above 2MB + 64KB with 413 before parsing FormData", async () => {
    const cancel = vi.fn(() => Promise.resolve());
    const chunk = new Uint8Array(1024 * 1024);
    const chunks = [chunk, chunk, chunk];
    const body = new ReadableStream<Uint8Array>(
      {
        pull(controller) {
          const next = chunks.shift();
          if (next) controller.enqueue(next);
          else controller.close();
        },
        cancel,
      },
      { highWaterMark: 0 },
    );

    const request = withSession(
      new NextRequest("http://localhost/api/profile/avatar", {
        method: "PUT",
        headers: {
          Origin: "http://localhost",
          "Content-Type": "multipart/form-data; boundary=test-boundary",
        },
        body,
      }),
    );
    const formDataSpy = vi.spyOn(request, "formData");

    const response = await PUT(request);
    expect(response.status).toBe(413);
    expect(response.headers.get("content-type")).toBe(
      "application/problem+json",
    );
    expect(cancel).toHaveBeenCalledOnce();
    expect(formDataSpy).not.toHaveBeenCalled();
    expect(forwardMock).not.toHaveBeenCalled();
  });

  it("rejects declared Content-Length above 2MB + 64KB with 413 before parsing FormData", async () => {
    const request = withSession(
      new NextRequest("http://localhost/api/profile/avatar", {
        method: "PUT",
        headers: {
          Origin: "http://localhost",
          "Content-Type": "multipart/form-data; boundary=test-boundary",
          "Content-Length": String(2 * 1024 * 1024 + 64 * 1024 + 1),
        },
        body: new Uint8Array(16),
      }),
    );
    const formDataSpy = vi.spyOn(request, "formData");

    const response = await PUT(request);
    expect(response.status).toBe(413);
    expect(response.headers.get("content-type")).toBe(
      "application/problem+json",
    );
    expect(formDataSpy).not.toHaveBeenCalled();
    expect(forwardMock).not.toHaveBeenCalled();
  });
});
