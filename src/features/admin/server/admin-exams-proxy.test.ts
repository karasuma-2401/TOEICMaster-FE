import { NextRequest, NextResponse } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { backendFetch } from "@/features/auth/server/backend";
import {
  setSessionCookie,
  type AuthSession,
} from "@/features/auth/server/session";
import { forwardAdminExamRequest } from "./admin-exams-proxy";

vi.mock("@/features/auth/server/backend", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/auth/server/backend")>();
  return { ...actual, backendFetch: vi.fn() };
});

function cookie(role?: string) {
  const response = NextResponse.next();
  const session = {
    accessToken: "access-token",
    accessTokenExpiresAtUtc: new Date(Date.now() + 60_000).toISOString(),
    refreshToken: "refresh-token",
    refreshTokenExpiresAtUtc: new Date(Date.now() + 60_000).toISOString(),
    user: { id: "admin-1", displayName: "Admin", email: "admin@example.com" },
    rememberMe: false,
    ...(role ? { role } : {}),
  } as AuthSession;
  setSessionCookie(response, session);
  return response.headers.get("set-cookie")!.split(";")[0];
}

beforeEach(() =>
  vi.stubEnv("AUTH_SESSION_SECRET", Buffer.alloc(32, 5).toString("base64url")),
);
afterEach(() => vi.unstubAllEnvs());

describe("forwardAdminExamRequest", () => {
  it("forwards a protected GET request with the admin bearer session", async () => {
    vi.mocked(backendFetch).mockResolvedValueOnce(Response.json({ items: [] }));
    const request = new NextRequest("http://localhost/api/admin/exams", {
      headers: { Cookie: cookie("ADMIN") },
    });

    const response = await forwardAdminExamRequest(
      request,
      "/api/v1/admin/exams?pageNumber=1&pageSize=20",
      "GET",
    );

    expect(response.status).toBe(200);
    expect(backendFetch).toHaveBeenCalledWith(
      "/api/v1/admin/exams?pageNumber=1&pageSize=20",
      "access-token",
      { method: "GET" },
    );
  });

  it("passes a same-origin JSON mutation without exposing the backend URL", async () => {
    vi.mocked(backendFetch).mockResolvedValueOnce(
      Response.json({ id: "new-test" }, { status: 201 }),
    );
    const request = new NextRequest(
      "http://localhost/api/admin/writing/tests",
      {
        method: "POST",
        headers: {
          Cookie: cookie("ADMIN"),
          Origin: "http://localhost",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: "WR-1" }),
      },
    );

    await forwardAdminExamRequest(
      request,
      "/api/v1/admin/writing/tests",
      "POST",
    );

    expect(backendFetch).toHaveBeenCalledWith(
      "/api/v1/admin/writing/tests",
      "access-token",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "WR-1" }),
      }),
    );
  });

  it("rejects multipart writes from an untrusted origin", async () => {
    const form = new FormData();
    form.set("file", new Blob(["workbook"]), "import.xlsx");
    const request = new NextRequest(
      "http://localhost/api/admin/writing/exercises/imports/validate?part=1",
      {
        method: "POST",
        headers: { Cookie: cookie("ADMIN"), Origin: "http://evil.example" },
        body: form,
      },
    );

    const response = await forwardAdminExamRequest(
      request,
      "/api/v1/admin/writing/exercises/imports/validate?part=1",
      "POST",
    );

    expect(response.status).toBe(403);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it("rejects an oversized multipart body before reading or forwarding it", async () => {
    const form = new FormData();
    form.set("file", new Blob(["workbook"]), "import.xlsx");
    const request = new NextRequest(
      "http://localhost/api/admin/lr-exercise-bank/parts/1/imports",
      {
        method: "POST",
        headers: {
          Cookie: cookie("ADMIN"),
          Origin: "http://localhost",
          "Content-Length": "11",
        },
        body: form,
      },
    );

    const response = await forwardAdminExamRequest(
      request,
      "/api/v1/admin/lr-exercise-bank/parts/1/imports",
      "POST",
      10,
    );

    expect(response.status).toBe(413);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it("preserves a safe attachment filename from the backend download", async () => {
    vi.mocked(backendFetch).mockResolvedValueOnce(
      new Response("template", {
        headers: {
          "Content-Disposition":
            'attachment; filename="toeic-lr-part-1-import-template.xlsx"',
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      }),
    );
    const request = new NextRequest(
      "http://localhost/api/admin/lr-exercise-bank/templates/1",
      { headers: { Cookie: cookie("ADMIN") } },
    );

    const response = await forwardAdminExamRequest(
      request,
      "/api/v1/admin/lr-exercise-bank/templates/1",
      "GET",
    );

    expect(response.headers.get("content-disposition")).toBe(
      'attachment; filename="toeic-lr-part-1-import-template.xlsx"',
    );
  });
});
