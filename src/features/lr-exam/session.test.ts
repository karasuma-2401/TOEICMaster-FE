import { describe, expect, it } from "vitest";
import {
  formatCountdown,
  formatMissingList,
  formatRemainingText,
  slotState,
  summarizeSubmission,
} from "./session";

describe("session helpers", () => {
  it("summarizes answered and missing questions", () => {
    const summary = summarizeSubmission({ 1: "A", 2: "B", 101: "C" }, 200);
    expect(summary.answered).toBe(3);
    expect(summary.listeningAnswered).toBe(2);
    expect(summary.readingAnswered).toBe(1);
    expect(summary.missing).toHaveLength(197);
  });

  it("formats countdown with and without hours", () => {
    expect(formatCountdown(38 * 60 + 24)).toBe("38:24");
    expect(formatCountdown(3600 + 45 * 60 + 12)).toBe("01:45:12");
    expect(formatCountdown(-5)).toBe("00:00");
  });

  it("formats remaining time in Vietnamese", () => {
    expect(formatRemainingText(14 * 60 + 25)).toBe("14 phút 25 giây");
  });

  it("shortens long missing lists", () => {
    expect(formatMissingList([1, 2, 3], 5)).toBe("1, 2, 3");
    expect(formatMissingList([1, 2, 3, 4], 2)).toBe("1, 2, … (+2)");
  });

  it("derives slot state", () => {
    const context = {
      answers: { 1: "A" as const },
      flags: { 2: true as const },
      currentNumbers: [3],
    };
    expect(slotState(1, context)).toEqual({
      state: "answered",
      flagged: false,
    });
    expect(slotState(2, context)).toEqual({
      state: "unanswered",
      flagged: true,
    });
    expect(slotState(3, context).state).toBe("current");
  });
});
