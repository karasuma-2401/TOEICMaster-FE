import { describe, expect, it } from "vitest";
import { parseReadingExamPage } from "./exam-management";

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
});
