import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getLrExerciseItems,
  getLrExerciseSummary,
  importLrExerciseItems,
} from "./lr-exercise-bank-api";

const summary = {
  totalQuestionCount: 3,
  updatedAtUtc: "2026-10-29T00:00:00+00:00",
  parts: Array.from({ length: 7 }, (_, index) => ({
    part: index + 1,
    kind:
      index === 2 || index === 3 || index === 5 || index === 6
        ? "GROUP"
        : "SINGLE",
    itemCount: index === 2 ? 1 : 0,
    questionCount: index === 2 ? 3 : 0,
    updatedAtUtc: index === 2 ? "2026-10-29T00:00:00+00:00" : null,
  })),
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("L&R exercise-bank API client", () => {
  it("keeps summary and list requests on same-origin BFF routes", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json(summary))
      .mockResolvedValueOnce(
        Response.json({
          items: [],
          pageNumber: 1,
          pageSize: 20,
          totalCount: 0,
          totalPages: 0,
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await getLrExerciseSummary();
    await getLrExerciseItems(3, {
      query: "report",
      difficulty: "MEDIUM",
      status: "PUBLISHED",
      page: 1,
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/admin/lr-exercise-bank/summary",
      expect.objectContaining({ method: "GET" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/admin/lr-exercise-bank/parts/3/items?pageNumber=1&pageSize=20&query=report&difficulty=MEDIUM&status=PUBLISHED",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("submits a selected Excel file to the part-specific import endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        part: 1,
        createdItemCount: 1,
        createdQuestionCount: 1,
        summary,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await importLrExerciseItems(
      1,
      new File(["workbook"], "part-1.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
    );

    expect(result.totalQuestionCount).toBe(3);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/lr-exercise-bank/parts/1/imports",
      expect.objectContaining({ method: "POST", body: expect.any(FormData) }),
    );
  });
});
