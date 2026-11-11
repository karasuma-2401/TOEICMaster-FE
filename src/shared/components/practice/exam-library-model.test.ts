import { describe, expect, it } from "vitest";
import {
  bestExamScore,
  selectExams,
  summarizeExamAttempts,
  type ExamLibraryItem,
} from "./exam-library-model";

const item = (overrides: Partial<ExamLibraryItem>): ExamLibraryItem => ({
  id: "a",
  code: "SP-01",
  title: "ETS Speaking · Test 01",
  badge: "5 Parts",
  meta: "11 câu",
  action: { href: "/x" },
  sortKey: "2026-01-01T00:00:00Z",
  difficulty: null,
  attemptCount: 0,
  bestScore: null,
  ...overrides,
});

describe("summarizeExamAttempts", () => {
  it("counts attempts and keeps the best score per test", () => {
    const results = summarizeExamAttempts([
      { id: "a", score: 120 },
      { id: "a", score: null },
      { id: "a", score: 160 },
      { id: "b", score: null },
    ]);
    expect(results.get("a")).toEqual({ attemptCount: 3, bestScore: 160 });
    expect(results.get("b")).toEqual({ attemptCount: 1, bestScore: null });
  });
});

describe("bestExamScore", () => {
  it("returns null when nothing has a score", () => {
    expect(bestExamScore([item({})])).toBeNull();
  });

  it("treats a score of zero as a result", () => {
    expect(bestExamScore([item({ bestScore: 0 })])).toBe(0);
  });
});

describe("selectExams", () => {
  const items = [
    item({ id: "old", sortKey: "2026-01-01T00:00:00Z", difficulty: "EASY" }),
    item({
      id: "new",
      code: "SP-02",
      title: "ETS Speaking · Test 02",
      sortKey: "2026-02-01T00:00:00Z",
      difficulty: "HARD",
      attemptCount: 1,
    }),
  ];
  const ids = (list: ExamLibraryItem[]) => list.map((entry) => entry.id);

  it("sorts by publish date in both directions", () => {
    const base = { query: "", status: "ALL", difficulty: "ALL" } as const;
    expect(ids(selectExams(items, { ...base, sort: "DESC" }))).toEqual([
      "new",
      "old",
    ]);
    expect(ids(selectExams(items, { ...base, sort: "ASC" }))).toEqual([
      "old",
      "new",
    ]);
  });

  it("filters by done state", () => {
    const base = { query: "", difficulty: "ALL", sort: "DESC" } as const;
    expect(ids(selectExams(items, { ...base, status: "DONE" }))).toEqual([
      "new",
    ]);
    expect(ids(selectExams(items, { ...base, status: "TODO" }))).toEqual([
      "old",
    ]);
  });

  it("filters by difficulty", () => {
    const base = { query: "", status: "ALL", sort: "DESC" } as const;
    expect(ids(selectExams(items, { ...base, difficulty: "HARD" }))).toEqual([
      "new",
    ]);
  });

  it("orders codes numerically", () => {
    const coded = [
      item({ id: "10", sortKey: "W-10" }),
      item({ id: "2", sortKey: "W-2" }),
    ];
    expect(
      ids(
        selectExams(coded, {
          query: "",
          status: "ALL",
          difficulty: "ALL",
          sort: "ASC",
        }),
      ),
    ).toEqual(["2", "10"]);
  });

  it("searches title and code, ignoring case", () => {
    const base = { status: "ALL", difficulty: "ALL", sort: "DESC" } as const;
    expect(ids(selectExams(items, { ...base, query: "test 01" }))).toEqual([
      "old",
    ]);
    expect(ids(selectExams(items, { ...base, query: "sp-02" }))).toEqual([
      "new",
    ]);
  });
});
