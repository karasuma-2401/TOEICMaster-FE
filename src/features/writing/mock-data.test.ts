import { describe, expect, it } from "vitest";
import {
  getWritingPartSummary,
  getWritingTest,
  totalWritingQuestions,
  totalWritingSeconds,
  writingTests,
} from "./mock-data";

describe("writing mock data", () => {
  it("provides a full Writing test with the expected 5/2/1 structure", () => {
    const test = writingTests[0];

    expect(totalWritingQuestions(test)).toBe(8);
    expect(test.parts.map((part) => part.questionCount)).toEqual([5, 2, 1]);
    expect(totalWritingSeconds(test)).toBeGreaterThan(0);
  });

  it("finds fixture data by test and part identifiers", () => {
    expect(getWritingTest("writing-practice-02")?.code).toBe("WRT-2026-02");
    expect(getWritingPartSummary(3)?.subtitle).toBe("Viết bài luận quan điểm");
    expect(getWritingTest("missing-test")).toBeUndefined();
  });
});
