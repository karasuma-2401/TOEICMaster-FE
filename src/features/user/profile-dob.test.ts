import { NextRequest, NextResponse } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  setSessionCookie,
  type AuthSession,
} from "@/features/auth/server/session";
import { PUT } from "@/app/api/profile/route";
import { getProfile, updateProfile } from "./api";
import { toUpdateRequest, validateProfile } from "./profile";

function createSessionCookie() {
  const response = NextResponse.next();
  const session: AuthSession = {
    accessToken: "access-token",
    accessTokenExpiresAtUtc: new Date(Date.now() + 60_000).toISOString(),
    refreshToken: "refresh-token",
    refreshTokenExpiresAtUtc: new Date(Date.now() + 3_600_000).toISOString(),
    user: { id: "user-1", displayName: "Linh", email: "linh@example.com" },
    role: "USER",
    rememberMe: false,
  };
  setSessionCookie(response, session);
  return response.headers.get("set-cookie")!.split(";")[0];
}

beforeEach(() => {
  vi.stubEnv("AUTH_SESSION_SECRET", Buffer.alloc(32, 7).toString("base64url"));
  vi.stubEnv("API_BASE_URL", "http://backend:5287");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("dateOfBirth profile validation and mapping", () => {
  it("accepts valid dates including 1900-01-01, today, empty string, and null", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-19T08:00:00Z"));

    for (const dateOfBirth of [
      "1900-01-01",
      "2001-06-15",
      "2026-11-19",
      "",
      null,
    ]) {
      expect(
        validateProfile({
          displayName: "Nguyễn Văn A",
          email: "learner@example.com",
          phone: "0912345678",
          targetScore: 750,
          dateOfBirth,
        }),
      ).toEqual({});
    }
  });

  it("rejects dates before 1900-01-01 with isolated dateOfBirth error", () => {
    const errors = validateProfile({
      displayName: "Nguyễn Văn A",
      email: "learner@example.com",
      phone: "0912345678",
      targetScore: 750,
      dateOfBirth: "1899-12-31",
    });

    expect(Object.keys(errors)).toEqual(["dateOfBirth"]);
    expect(errors.dateOfBirth).toEqual(expect.any(String));
    expect(errors.dateOfBirth!.length).toBeGreaterThan(0);
  });

  it("rejects future dates with isolated dateOfBirth error", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-19T08:00:00Z"));

    const errors = validateProfile({
      displayName: "Nguyễn Văn A",
      email: "learner@example.com",
      phone: "0912345678",
      targetScore: 750,
      dateOfBirth: "2026-11-20",
    });

    expect(Object.keys(errors)).toEqual(["dateOfBirth"]);
    expect(errors.dateOfBirth).toEqual(expect.any(String));
    expect(errors.dateOfBirth!.length).toBeGreaterThan(0);
  });

  it("rejects malformed or non-existent calendar dates with isolated dateOfBirth error", () => {
    for (const invalidDate of ["2001/06/15", "2001-02-30", "invalid-date"]) {
      const errors = validateProfile({
        displayName: "Nguyễn Văn A",
        email: "learner@example.com",
        phone: "0912345678",
        targetScore: 750,
        dateOfBirth: invalidDate,
      });

      expect(Object.keys(errors)).toEqual(["dateOfBirth"]);
      expect(errors.dateOfBirth).toEqual(expect.any(String));
    }
  });

  it("preserves dateOfBirth in toUpdateRequest and normalizes blank values to null", () => {
    expect(
      toUpdateRequest({
        displayName: "  Linh  ",
        email: "linh@example.com",
        phone: "",
        dateOfBirth: "2001-06-15",
        targetScore: "750",
      }),
    ).toEqual({
      displayName: "Linh",
      phone: null,
      dateOfBirth: "2001-06-15",
      targetScore: 750,
    });

    expect(
      toUpdateRequest({
        displayName: "Linh",
        email: "linh@example.com",
        phone: null,
        dateOfBirth: "   ",
        targetScore: null,
      }),
    ).toEqual({
      displayName: "Linh",
      phone: null,
      dateOfBirth: null,
      targetScore: null,
    });
  });

  it("maps dateOfBirth in getProfile and sends it in updateProfile", async () => {
    const backendPayload = {
      id: "user-1",
      displayName: "Linh",
      email: "linh@example.com",
      avatarUrl: null,
      phone: "0912345678",
      dateOfBirth: "2001-06-15",
      targetScore: 750,
      hasPassword: true,
    };

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json(backendPayload))
      .mockResolvedValueOnce(Response.json(backendPayload));
    vi.stubGlobal("fetch", fetchMock);

    const loaded = await getProfile();
    expect(loaded.dateOfBirth).toBe("2001-06-15");

    const updated = await updateProfile({
      displayName: "Linh",
      phone: "0912345678",
      dateOfBirth: "2001-06-15",
      targetScore: 750,
    });
    expect(updated.dateOfBirth).toBe("2001-06-15");

    const [, init] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual({
      displayName: "Linh",
      phone: "0912345678",
      dateOfBirth: "2001-06-15",
      targetScore: 750,
    });
  });
});

describe("PUT /api/profile route handler dateOfBirth support", () => {
  it("forwards dateOfBirth in the JSON payload to the backend", async () => {
    const backendResponse = {
      id: "user-1",
      displayName: "Linh",
      email: "linh@example.com",
      avatarUrl: null,
      phone: null,
      dateOfBirth: "2001-06-15",
      targetScore: 750,
      hasPassword: true,
    };
    const fetchMock = vi.fn().mockResolvedValue(Response.json(backendResponse));
    vi.stubGlobal("fetch", fetchMock);

    const request = new NextRequest("http://localhost/api/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost",
        Cookie: createSessionCookie(),
      },
      body: JSON.stringify({
        displayName: "Linh",
        phone: null,
        dateOfBirth: "2001-06-15",
        targetScore: 750,
      }),
    });

    const response = await PUT(request);
    expect(response.status).toBe(200);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual({
      displayName: "Linh",
      phone: null,
      dateOfBirth: "2001-06-15",
      targetScore: 750,
    });
  });

  it("rejects non-string dateOfBirth with 400 before contacting backend", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(Response.json({ id: "user-1" }));
    vi.stubGlobal("fetch", fetchMock);

    const request = new NextRequest("http://localhost/api/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost",
        Cookie: createSessionCookie(),
      },
      body: JSON.stringify({
        displayName: "Linh",
        phone: null,
        dateOfBirth: 20010615,
        targetScore: 750,
      }),
    });

    const response = await PUT(request);
    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
