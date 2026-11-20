import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { forwardAdminKnowledge } from "./admin-knowledge-proxy";

const backendFetchMock = vi.fn();
const sameOriginMock = vi.fn();
const sessionCookieMock = vi.fn();

vi.mock("@/features/auth/server/backend", () => ({
  backendFetch: (...args: unknown[]) => backendFetchMock(...args),
  sameOrigin: (...args: unknown[]) => sameOriginMock(...args),
  problem: (status: number, title: string) =>
    new Response(JSON.stringify({ status, title }), {
      status,
      headers: { "Content-Type": "application/problem+json" },
    }),
}));

vi.mock("@/features/auth/server/session", () => ({
  sessionCookie: (...args: unknown[]) => sessionCookieMock(...args),
}));

describe("forwardAdminKnowledge", () => {
  const validAdminSession = {
    accessToken: "admin-jwt",
    refreshTokenExpiresAtUtc: new Date(Date.now() + 60_000).toISOString(),
    role: "ADMIN",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    sameOriginMock.mockReturnValue(true);
    sessionCookieMock.mockReturnValue(validAdminSession);
  });

  it("rejects unknown paths with 404 and non-admin sessions with 403", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/knowledge/x");
    const notFound = await forwardAdminKnowledge(req, ["unknown"], "GET");
    expect(notFound.status).toBe(404);

    sessionCookieMock.mockReturnValue({ ...validAdminSession, role: "USER" });
    const forbidden = await forwardAdminKnowledge(req, ["articles"], "GET");
    expect(forbidden.status).toBe(403);
  });

  it("forwards GET /articles with query string to backend /api/v1/admin/knowledge/articles", async () => {
    backendFetchMock.mockResolvedValue(
      new Response(JSON.stringify({ items: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const req = new NextRequest(
      "http://localhost:3000/api/admin/knowledge/articles?query=Reading&pageNumber=1",
    );
    const res = await forwardAdminKnowledge(req, ["articles"], "GET");

    expect(res.status).toBe(200);
    expect(backendFetchMock).toHaveBeenCalledWith(
      "/api/v1/admin/knowledge/articles?query=Reading&pageNumber=1",
      "admin-jwt",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("enforces same-origin on mutations", async () => {
    sameOriginMock.mockReturnValue(false);
    const req = new NextRequest(
      "http://localhost:3000/api/admin/knowledge/categories",
      { method: "POST" },
    );
    const res = await forwardAdminKnowledge(req, ["categories"], "POST");
    expect(res.status).toBe(403);
    expect(backendFetchMock).not.toHaveBeenCalled();
  });
});
