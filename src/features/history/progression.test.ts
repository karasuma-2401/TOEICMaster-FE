import { describe, expect, it } from "vitest";
import type { UnifiedAttemptItem } from "@/features/history/api";
import {
  buildSkillProgression,
  getAvailableChartWindows,
  isFullScaleChartAttempt,
  resolveDefaultChartSkill,
  resolveEffectiveChartWindow,
  sliceProgressionPoints,
} from "@/features/history/progression";

function attempt(
  overrides: Partial<UnifiedAttemptItem> = {},
): UnifiedAttemptItem {
  return {
    id: "lr-1",
    skill: "lr",
    examId: null,
    code: "TEST-1",
    title: "Practice Test 1",
    modeLabel: "Full Test",
    status: "COMPLETED",
    score: 800,
    maxScore: 990,
    subScoreLabel: null,
    evaluationStatus: null,
    timestampUtc: "2026-09-01T08:00:00Z",
    durationSeconds: null,
    resultHref: null,
    reviewHref: null,
    resumeHref: null,
    ...overrides,
  };
}

describe("score progression", () => {
  it.each<Partial<UnifiedAttemptItem>>([
    { status: "IN_PROGRESS" },
    { status: "ABANDONED" },
    { score: null },
    { score: Number.NaN },
    { score: Number.POSITIVE_INFINITY },
    { timestampUtc: "invalid date" },
  ])("excludes non-chartable attempts: %j", (overrides) => {
    expect(isFullScaleChartAttempt(attempt(overrides))).toBe(false);
  });

  it.each([3, 4, 5, 10, 15])(
    "rejects only the mismatched Writing maximum %i",
    (maxScore) => {
      const fullTest = attempt({ skill: "writing", score: 1, maxScore: 200 });
      expect(isFullScaleChartAttempt(fullTest)).toBe(true);
      expect(isFullScaleChartAttempt({ ...fullTest, maxScore })).toBe(false);
    },
  );

  it.each([
    { skill: "speaking", modeLabel: "Speaking part 3" },
    { skill: "writing", modeLabel: "Writing Part 1" },
  ] as const)(
    "rejects $skill part mode even at full scale",
    ({ skill, modeLabel }) => {
      const fullTest = attempt({ skill, score: 120, maxScore: 200 });
      expect(isFullScaleChartAttempt(fullTest)).toBe(true);
      expect(isFullScaleChartAttempt({ ...fullTest, modeLabel })).toBe(false);
    },
  );

  it("separates skills and sorts oldest first with ID tie-breaking", () => {
    const items = [
      attempt({
        id: "lr-3",
        score: 865,
        timestampUtc: "2026-10-01T10:00:00+02:00",
      }),
      attempt({ id: "lr-2", score: 845, timestampUtc: "2026-10-01T08:00:00Z" }),
      attempt({ skill: "speaking", id: "s-1", maxScore: 200, score: 125 }),
      attempt({ skill: "writing", id: "w-1", maxScore: 200, score: 0 }),
      attempt(),
    ];
    const series = buildSkillProgression(items, "lr");

    expect(
      series.points.map(({ id, attemptNumber }) => [id, attemptNumber]),
    ).toEqual([
      ["lr-1", 1],
      ["lr-2", 2],
      ["lr-3", 3],
    ]);
    expect(series).toMatchObject({
      hasTrend: true,
      latestScore: 865,
      previousScore: 845,
      deltaFromPrevious: 20,
      config: { maxScore: 990 },
    });
    expect(buildSkillProgression(items, "speaking")).toMatchObject({
      hasTrend: false,
      latestScore: 125,
      previousScore: null,
      deltaFromPrevious: null,
      config: { maxScore: 200 },
    });
    expect(
      buildSkillProgression(items, "writing").points.map(({ score }) => score),
    ).toEqual([0]);
    expect(buildSkillProgression([], "writing")).toMatchObject({
      points: [],
      hasTrend: false,
      latestScore: null,
      deltaFromPrevious: null,
    });
  });

  it("prefers a chartable trend in requested order, then one point, then the first skill", () => {
    const speaking = attempt({ skill: "speaking", maxScore: 200, score: 120 });
    const writing = attempt({ skill: "writing", maxScore: 200, score: 150 });
    const items = [
      attempt(),
      speaking,
      { ...speaking, id: "s-2" },
      writing,
      { ...writing, id: "w-2" },
    ];

    expect(resolveDefaultChartSkill(items, ["lr", "writing", "speaking"])).toBe(
      "writing",
    );
    expect(resolveDefaultChartSkill(items, ["lr", "speaking"])).toBe(
      "speaking",
    );
    expect(resolveDefaultChartSkill([speaking], ["lr", "speaking"])).toBe(
      "speaking",
    );
    expect(resolveDefaultChartSkill([speaking], ["writing", "lr"])).toBe(
      "writing",
    );
    expect(resolveDefaultChartSkill([], [])).toBe("lr");
  });
});

describe("score progression windows", () => {
  it.each([
    [0, ["all"]],
    [10, ["all"]],
    [11, ["10", "all"]],
    [25, ["10", "all"]],
    [26, ["10", "25", "all"]],
  ])("offers windows for %i full tests", (total, expected) => {
    expect(getAvailableChartWindows(total)).toEqual(expected);
  });

  it("falls back to all if the selected window is unavailable for the skill", () => {
    expect(resolveEffectiveChartWindow(10, "10")).toBe("all");
    expect(resolveEffectiveChartWindow(11, "10")).toBe("10");
    expect(resolveEffectiveChartWindow(25, "25")).toBe("all");
    expect(resolveEffectiveChartWindow(26, "25")).toBe("25");
    expect(resolveEffectiveChartWindow(50, "all")).toBe("all");
  });

  it.each([
    ["10", 10, 41],
    ["25", 25, 26],
    ["all", 50, 1],
  ] as const)(
    "plots the latest %s tests without renumbering them",
    (range, length, firstAttempt) => {
      const items = Array.from({ length: 50 }, (_, index) =>
        attempt({
          timestampUtc: new Date(Date.UTC(2026, 9, index + 1)).toISOString(),
        }),
      ).reverse();
      const { points } = buildSkillProgression(items, "lr");
      const visible = sliceProgressionPoints(points, range);

      expect(visible.map(({ attemptNumber }) => attemptNumber)).toEqual(
        Array.from({ length }, (_, index) => firstAttempt + index),
      );
      expect(points).toHaveLength(50);
    },
  );
});
