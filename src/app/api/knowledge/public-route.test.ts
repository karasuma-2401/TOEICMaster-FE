import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { backendFetch } from "@/features/auth/server/backend";
import { GET } from "./[...segments]/route";

vi.mock("@/features/auth/server/backend", async (original) => ({
  ...(await original<typeof import("@/features/auth/server/backend")>()),
  backendFetch: vi.fn(),
}));

afterEach(() => vi.clearAllMocks());

describe("public knowledge BFF", () => {
  it("allows guests to browse articles and preserves filters", async () => {
    vi.mocked(backendFetch).mockResolvedValue(Response.json({ items: [] }));

    const response = await GET(
      new NextRequest("http://localhost/api/knowledge/articles?q=reading"),
      { params: Promise.resolve({ segments: ["articles"] }) },
    );

    expect(response.status).toBe(200);
    expect(backendFetch).toHaveBeenCalledWith(
      "/api/v1/knowledge/articles?q=reading",
      "",
      expect.objectContaining({ method: "GET" }),
    );
  });
});
