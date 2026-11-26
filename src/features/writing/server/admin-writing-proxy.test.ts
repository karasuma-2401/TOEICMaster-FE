import { NextRequest, NextResponse } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  setSessionCookie,
  type AuthSession,
} from "@/features/auth/server/session";
import {
  forwardAdminWriting,
  imageUploadLimit,
  importUploadLimit,
} from "./admin-writing-proxy";

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

beforeEach(() => {
  vi.stubEnv("AUTH_SESSION_SECRET", Buffer.alloc(32, 5).toString("base64url"));
  vi.stubEnv("API_BASE_URL", "http://api:8080");
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("Admin Writing BFF proxy", () => {
  it("requires a signed-in admin", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const url = "http://localhost/api/admin/writing/exercises";
    expect(
      (await forwardAdminWriting(new NextRequest(url), ["exercises"], "GET"))
        .status,
    ).toBe(401);
    expect(
      (
        await forwardAdminWriting(
          new NextRequest(url, { headers: { Cookie: cookie("USER") } }),
          ["exercises"],
          "GET",
        )
      ).status,
    ).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("forwards admin requests with bearer token and query string", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ items: [] }));
    vi.stubGlobal("fetch", fetchMock);
    const response = await forwardAdminWriting(
      new NextRequest(
        "http://localhost/api/admin/writing/exercises?part=1&pageSize=10",
        { headers: { Cookie: cookie("ADMIN") } },
      ),
      ["exercises"],
      "GET",
    );
    expect(response.status).toBe(200);
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      "http://api:8080/api/v1/admin/writing/exercises?part=1&pageSize=10",
    );
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.method).toBe("GET");
    expect((init.headers as Headers).get("Authorization")).toBe(
      "Bearer access-token",
    );
  });

  it("rejects oversized multipart image uploads via declared Content-Length and chunked streams", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const declaredOversize = await forwardAdminWriting(
      new NextRequest("http://localhost/api/admin/writing/media/images", {
        method: "POST",
        headers: {
          Cookie: cookie("ADMIN"),
          Origin: "http://localhost",
          "Content-Type": "multipart/form-data; boundary=x",
          "Content-Length": String(imageUploadLimit + 1),
        },
        body: "--x--",
      }),
      ["media", "images"],
      "POST",
    );
    expect(declaredOversize.status).toBe(413);

    let sent = 0;
    const chunk = new Uint8Array(256 * 1024);
    const streamed = new ReadableStream<Uint8Array>({
      pull(controller) {
        if (sent > imageUploadLimit + 512 * 1024) {
          controller.close();
          return;
        }
        sent += chunk.byteLength;
        controller.enqueue(chunk);
      },
    });
    const chunkedOversize = await forwardAdminWriting(
      new NextRequest("http://localhost/api/admin/writing/media/images", {
        method: "POST",
        headers: {
          Cookie: cookie("ADMIN"),
          Origin: "http://localhost",
          "Content-Type": "multipart/form-data; boundary=x",
        },
        body: streamed,
        duplex: "half",
      }),
      ["media", "images"],
      "POST",
    );
    expect(chunkedOversize.status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects oversized multipart Excel imports with 413", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = await forwardAdminWriting(
      new NextRequest("http://localhost/api/admin/writing/tests/import", {
        method: "POST",
        headers: {
          Cookie: cookie("ADMIN"),
          Origin: "http://localhost",
          "Content-Type": "multipart/form-data; boundary=x",
          "Content-Length": String(importUploadLimit + 1),
        },
        body: "--x--",
      }),
      ["tests", "import"],
      "POST",
    );
    expect(response.status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("blocks non-allowlisted routes with 404", async () => {
    const response = await forwardAdminWriting(
      new NextRequest("http://localhost/api/admin/writing/unknown", {
        headers: { Cookie: cookie("ADMIN") },
      }),
      ["unknown"],
      "GET",
    );
    expect(response.status).toBe(404);
  });
});
