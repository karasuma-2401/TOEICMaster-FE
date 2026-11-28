import { NextRequest, NextResponse } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { backendFetch } from "@/features/auth/server/backend";
import {
  setSessionCookie,
  type AuthSession,
} from "@/features/auth/server/session";
import { forwardAdminSpeaking, imageUploadLimit } from "./admin-speaking-proxy";

vi.mock("@/features/auth/server/backend", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/auth/server/backend")>();
  return { ...actual, backendFetch: vi.fn() };
});

function cookie(role?: string) {
  const response = NextResponse.next();
  setSessionCookie(response, {
    accessToken: "access-token",
    accessTokenExpiresAtUtc: new Date(Date.now() + 60_000).toISOString(),
    refreshToken: "refresh-token",
    refreshTokenExpiresAtUtc: new Date(Date.now() + 60_000).toISOString(),
    user: { id: "admin-1", displayName: "Admin", email: "admin@example.com" },
    rememberMe: false,
    ...(role ? { role } : {}),
  } as AuthSession);
  return response.headers.get("set-cookie")!.split(";")[0];
}

beforeEach(() =>
  vi.stubEnv("AUTH_SESSION_SECRET", Buffer.alloc(32, 5).toString("base64url")),
);
afterEach(() => {
  vi.unstubAllEnvs();
  vi.mocked(backendFetch).mockReset();
});

describe("Admin Speaking BFF proxy", () => {
  it("requires a signed-in admin", async () => {
    const url = "http://localhost/api/admin/speaking/summary";
    expect(
      (await forwardAdminSpeaking(new NextRequest(url), ["summary"], "GET"))
        .status,
    ).toBe(401);
    expect(
      (
        await forwardAdminSpeaking(
          new NextRequest(url, { headers: { Cookie: cookie("USER") } }),
          ["summary"],
          "GET",
        )
      ).status,
    ).toBe(403);
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it("forwards admin requests with the bearer token and query string", async () => {
    vi.mocked(backendFetch).mockResolvedValue(Response.json({ items: [] }));
    const response = await forwardAdminSpeaking(
      new NextRequest(
        "http://localhost/api/admin/speaking/exercises?part=2&pageSize=10",
        { headers: { Cookie: cookie("ADMIN") } },
      ),
      ["exercises"],
      "GET",
    );

    expect(response.status).toBe(200);
    expect(vi.mocked(backendFetch).mock.calls[0].slice(0, 2)).toEqual([
      "/api/v1/admin/speaking/exercises?part=2&pageSize=10",
      "access-token",
    ]);
  });

  describe("Image upload", () => {
    const url = "http://localhost/api/admin/speaking/media/images";
    const upload = (headers: Record<string, string>, body: string) =>
      new NextRequest(url, {
        method: "POST",
        headers: {
          Cookie: cookie("ADMIN"),
          Origin: "http://localhost",
          ...headers,
        },
        body,
      });

    it("forwards the multipart body unchanged", async () => {
      vi.mocked(backendFetch).mockResolvedValue(
        Response.json({ id: "asset-1" }, { status: 201 }),
      );
      const contentType = "multipart/form-data; boundary=x";

      const response = await forwardAdminSpeaking(
        upload({ "Content-Type": contentType }, "--x--"),
        ["media", "images"],
        "POST",
      );

      expect(response.status).toBe(201);
      const [path, token, init] = vi.mocked(backendFetch).mock.calls[0];
      expect([path, token]).toEqual([
        "/api/v1/admin/speaking/media/images",
        "access-token",
      ]);
      expect(init?.method).toBe("POST");
      expect(init?.headers).toEqual({ "Content-Type": contentType });
      expect(new TextDecoder().decode(init?.body as ArrayBuffer)).toBe("--x--");
    });

    it("rejects non-multipart and oversized bodies before the backend", async () => {
      const notMultipart = await forwardAdminSpeaking(
        upload({ "Content-Type": "application/json" }, "{}"),
        ["media", "images"],
        "POST",
      );
      const tooLarge = await forwardAdminSpeaking(
        upload(
          {
            "Content-Type": "multipart/form-data; boundary=x",
            "Content-Length": String(imageUploadLimit + 1),
          },
          "--x--",
        ),
        ["media", "images"],
        "POST",
      );

      expect(notMultipart.status).toBe(400);
      expect(tooLarge.status).toBe(413);
      expect(backendFetch).not.toHaveBeenCalled();
    });

    it("rejects cross-origin uploads", async () => {
      const response = await forwardAdminSpeaking(
        upload(
          {
            "Content-Type": "multipart/form-data; boundary=x",
            Origin: "http://evil.example",
          },
          "--x--",
        ),
        ["media", "images"],
        "POST",
      );

      expect(response.status).toBe(403);
      expect(backendFetch).not.toHaveBeenCalled();
    });
  });

  it("only allows known paths and methods (including rejecting removed tests/import)", async () => {
    const request = new NextRequest("http://localhost/x", {
      headers: { Cookie: cookie("ADMIN") },
    });
    expect((await forwardAdminSpeaking(request, ["users"], "GET")).status).toBe(
      404,
    );
    expect(
      (await forwardAdminSpeaking(request, ["summary"], "DELETE")).status,
    ).toBe(404);
    expect(
      (
        await forwardAdminSpeaking(
          new NextRequest("http://localhost/api/admin/speaking/tests/import", {
            method: "POST",
            headers: {
              Cookie: cookie("ADMIN"),
              Origin: "http://localhost",
            },
          }),
          ["tests", "import"],
          "POST",
        )
      ).status,
    ).toBe(404);
  });
});
