import { afterEach, describe, expect, it, vi } from "vitest";
import { listKnowledgeArticles } from "./admin-api";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("knowledge admin-api", () => {
  it("sends q instead of query when listing articles", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        items: [],
        pageNumber: 1,
        pageSize: 12,
        totalCount: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await listKnowledgeArticles({
      query: "NONEXISTENT_XYZ_999",
      pageNumber: 1,
      pageSize: 12,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const requestUrl = String(fetchMock.mock.calls[0][0]);
    expect(requestUrl).toContain("q=NONEXISTENT_XYZ_999");
    expect(requestUrl).not.toContain("query=");
  });
});
