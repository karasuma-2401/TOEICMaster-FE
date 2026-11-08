import { NextRequest } from "next/server";
import { afterEach, expect, it, vi } from "vitest";
import { backendFetch } from "@/features/auth/server/backend";
import { forwardAdminWriting } from "./admin-writing-proxy";

vi.mock("@/features/auth/server/session", () => ({
  sessionCookie: () => ({
    role: "ADMIN",
    accessToken: "token",
    refreshTokenExpiresAtUtc: new Date(Date.now() + 60000).toISOString(),
  }),
}));
vi.mock("@/features/auth/server/backend", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/auth/server/backend")>()),
  backendFetch: vi.fn(),
}));
afterEach(() => vi.clearAllMocks());

it.each([
  { method: "DELETE" as const, suffix: "?version=3", segments: [] as string[] },
  { method: "POST" as const, suffix: "/archive", segments: ["archive"] },
  { method: "POST" as const, suffix: "/restore", segments: ["restore"] },
])(
  "forwards $method $suffix to the backend",
  async ({ method, suffix, segments }) => {
    const id = "10000000-0000-0000-0000-000000000001";
    const path = `/api/admin/writing/tests/${id}${suffix}`;
    vi.mocked(backendFetch).mockResolvedValue(
      new Response(null, { status: 204 }),
    );
    const request = new NextRequest(`http://localhost${path}`, {
      method,
      headers: {
        Origin: "http://localhost",
        ...(method === "POST" ? { "Content-Type": "application/json" } : {}),
      },
      ...(method === "POST" ? { body: JSON.stringify({ version: 3 }) } : {}),
    });
    const response = await forwardAdminWriting(
      request,
      ["tests", id, ...segments],
      method,
    );
    expect(response.status).toBe(204);
    expect(backendFetch).toHaveBeenCalledWith(
      `/api/v1/admin/writing/tests/${id}${suffix}`,
      "token",
      expect.objectContaining({ method }),
    );
  },
);
