import { existsSync } from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  setSessionCookie,
  type AuthSession,
} from "@/features/auth/server/session";
import { forwardLr } from "./lr-proxy";

const ATTEMPT_ID = "11111111-1111-4111-8111-111111111111";
const ASSET_ID = "22222222-2222-4222-8222-222222222222";

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

beforeEach(() => {
  vi.stubEnv("AUTH_SESSION_SECRET", Buffer.alloc(32, 5).toString("base64url"));
  vi.stubEnv("API_BASE_URL", "http://api:8080");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("LR BFF proxy (listening audio & legacy route removal)", () => {
  it("forwards GET listening-audio-urls to the v1 backend endpoint", async () => {
    const playlist = {
      items: [
        {
          blockId: "33333333-3333-4333-8333-333333333333",
          part: 1,
          firstQuestionNumber: 1,
          audioAssetId: ASSET_ID,
          durationMs: 18500,
          url: "http://minio:9000/exam-media/p1-q1.mp3?sig=1",
          expiresAtUtc: "2026-11-19T12:00:00Z",
        },
      ],
    };
    const fetchMock = vi.fn().mockResolvedValue(Response.json(playlist));
    vi.stubGlobal("fetch", fetchMock);

    const response = await forwardLr(
      new NextRequest(
        `http://localhost:3000/api/lr/exam-attempts/${ATTEMPT_ID}/listening-audio-urls`,
        { headers: { Cookie: authCookie() } },
      ),
      ["exam-attempts", ATTEMPT_ID, "listening-audio-urls"],
      "GET",
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(playlist);
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      `http://api:8080/api/v1/exam-attempts/${ATTEMPT_ID}/listening-audio-urls`,
    );
  });

  it("forwards GET audio/{assetId} to the v1 backend endpoint", async () => {
    const media = {
      url: "http://minio:9000/exam-media/p1-q1.mp3?sig=1",
      expiresAtUtc: "2026-11-19T12:00:00Z",
    };
    const fetchMock = vi.fn().mockResolvedValue(Response.json(media));
    vi.stubGlobal("fetch", fetchMock);

    const response = await forwardLr(
      new NextRequest(
        `http://localhost:3000/api/lr/exam-attempts/${ATTEMPT_ID}/audio/${ASSET_ID}`,
        { headers: { Cookie: authCookie() } },
      ),
      ["exam-attempts", ATTEMPT_ID, "audio", ASSET_ID],
      "GET",
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(media);
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      `http://api:8080/api/v1/exam-attempts/${ATTEMPT_ID}/audio/${ASSET_ID}`,
    );
  });

  it("rejects legacy GET audio without assetId with 404", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await forwardLr(
      new NextRequest(
        `http://localhost:3000/api/lr/exam-attempts/${ATTEMPT_ID}/audio`,
        { headers: { Cookie: authCookie() } },
      ),
      ["exam-attempts", ATTEMPT_ID, "audio"],
      "GET",
    );

    expect(response.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects listening-audio-urls when attemptId is not a valid UUID", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await forwardLr(
      new NextRequest(
        "http://localhost:3000/api/lr/exam-attempts/not-a-uuid/listening-audio-urls",
        { headers: { Cookie: authCookie() } },
      ),
      ["exam-attempts", "not-a-uuid", "listening-audio-urls"],
      "GET",
    );

    expect(response.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects non-GET requests to listening-audio-urls", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await forwardLr(
      new NextRequest(
        `http://localhost:3000/api/lr/exam-attempts/${ATTEMPT_ID}/listening-audio-urls`,
        {
          method: "POST",
          headers: {
            Cookie: authCookie(),
            Origin: "http://localhost:3000",
          },
        },
      ),
      ["exam-attempts", ATTEMPT_ID, "listening-audio-urls"],
      "POST",
    );

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.status).toBeLessThan(500);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("removes the obsolete admin master-audio route handler", () => {
    const legacyRoute = path.resolve(
      process.cwd(),
      "src/app/api/admin/exams/[examId]/revisions/[revisionId]/master-audio/route.ts",
    );
    expect(existsSync(legacyRoute)).toBe(false);
  });

  it("allows public unauthenticated GET exams/lr", async () => {
    const catalog = [{ examId: ATTEMPT_ID, code: "ETS-01" }];
    const fetchMock = vi.fn().mockResolvedValue(Response.json(catalog));
    vi.stubGlobal("fetch", fetchMock);

    const response = await forwardLr(
      new NextRequest("http://localhost:3000/api/lr/exams/lr"),
      ["exams", "lr"],
      "GET",
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(catalog);
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      "http://api:8080/api/v1/exams/lr",
    );
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(new Headers(init.headers).get("Authorization")).toBeNull();
  });

  it("allows public unauthenticated GET lr-practice/parts/1/items", async () => {
    const page = {
      items: [],
      pageNumber: 1,
      pageSize: 50,
      totalCount: 0,
      totalPages: 0,
    };
    const fetchMock = vi.fn().mockResolvedValue(Response.json(page));
    vi.stubGlobal("fetch", fetchMock);

    const response = await forwardLr(
      new NextRequest(
        "http://localhost:3000/api/lr/lr-practice/parts/1/items?pageNumber=1&pageSize=50",
      ),
      ["lr-practice", "parts", "1", "items"],
      "GET",
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(page);
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      "http://api:8080/api/v1/lr-practice/parts/1/items?pageNumber=1&pageSize=50",
    );
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(new Headers(init.headers).get("Authorization")).toBeNull();
  });

  it("rejects non-GET requests to lr-practice/parts/1/items with 405", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await forwardLr(
      new NextRequest(
        "http://localhost:3000/api/lr/lr-practice/parts/1/items",
        {
          method: "POST",
          headers: {
            Cookie: authCookie(),
            Origin: "http://localhost:3000",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        },
      ),
      ["lr-practice", "parts", "1", "items"],
      "POST",
    );

    expect(response.status).toBe(405);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("forwards authenticated POST lr-practice/items/{id}/submit", async () => {
    const result = {
      itemId: ASSET_ID,
      totalQuestions: 1,
      correctCount: 1,
      incorrectCount: 0,
      questions: [],
    };
    const fetchMock = vi.fn().mockResolvedValue(Response.json(result));
    vi.stubGlobal("fetch", fetchMock);

    const payload = { answers: [{ questionId: ATTEMPT_ID, selectedKey: "A" }] };
    const response = await forwardLr(
      new NextRequest(
        `http://localhost:3000/api/lr/lr-practice/items/${ASSET_ID}/submit`,
        {
          method: "POST",
          headers: {
            Cookie: authCookie(),
            Origin: "http://localhost:3000",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      ),
      ["lr-practice", "items", ASSET_ID, "submit"],
      "POST",
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(result);
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      `http://api:8080/api/v1/lr-practice/items/${ASSET_ID}/submit`,
    );
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init.method).toBe("POST");
    expect(new Headers(init.headers).get("Authorization")).toBe(
      "Bearer access-token",
    );
    expect(init.body).toBe(JSON.stringify(payload));
  });
});
