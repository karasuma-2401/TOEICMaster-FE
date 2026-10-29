import { describe, expect, it } from "vitest";
import {
  DEFAULT_EXAM_LIST_QUERY,
  parseExamListQuery,
  parseReadingExamPage,
  parseWritingTestPage,
} from "./exam-management";

describe("parseExamListQuery", () => {
  it("keeps supported filters and bounds pagination before it reaches the API", () => {
    expect(
      parseExamListQuery(
        new URLSearchParams({
          kind: "writing",
          status: "PUBLISHED",
          page: "20000",
          pageSize: "100",
          q: "   January placement   ",
        }),
      ),
    ).toEqual({
      kind: "writing",
      status: "PUBLISHED",
      page: 10_000,
      pageSize: 50,
      q: "January placement",
    });
  });

  it("falls back to a safe default when query parameters are unsupported", () => {
    expect(
      parseExamListQuery(
        new URLSearchParams({
          kind: "listening",
          status: "REMOVED",
          page: "0",
          pageSize: "12",
        }),
      ),
    ).toEqual(DEFAULT_EXAM_LIST_QUERY);
  });

  it("keeps ALL in the URL as an omitted API status filter", () => {
    expect(
      parseExamListQuery(new URLSearchParams({ status: "ALL" })),
    ).toMatchObject({ status: "ALL" });
  });
});

describe("exam API response parsing", () => {
  it("accepts the paginated Reading exam response returned by the existing backend", () => {
    expect(
      parseReadingExamPage({
        items: [
          {
            examId: "5db1ff4b-7c02-4073-8d68-4c8405b6d44f",
            code: "LR-2026-001",
            title: "Reading placement test",
            revisionId: "dcd47375-d533-4f23-931c-a9a5bb6f128d",
            versionNumber: 1,
            status: "Draft",
            createdAtUtc: "2026-10-28T00:00:00+00:00",
          },
        ],
        pageNumber: 1,
        pageSize: 20,
        totalCount: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      }),
    ).toMatchObject({ totalCount: 1, items: [{ code: "LR-2026-001" }] });
  });

  it("rejects malformed Writing list records before rendering them", () => {
    expect(() =>
      parseWritingTestPage({
        items: [{ id: "not-a-test" }],
        pageNumber: 1,
        pageSize: 20,
        totalCount: 1,
      }),
    ).toThrow("Phản hồi danh sách đề Writing không hợp lệ.");
  });
});
