import { describe, expect, it } from "vitest";
import type { UnifiedAttemptItem } from "@/features/history/api";
import {
  buildSkillProgression,
  isFullScaleChartAttempt,
  resolveDefaultChartSkill,
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
    { skill: "writing", maxScore: 15 },
    { skill: "speaking", maxScore: 200, modeLabel: "Speaking part 3" },
    { skill: "writing", maxScore: 200, modeLabel: "Writing Part 1" },
  ])("excludes non-chartable attempts: %j", (overrides) => {
    expect(isFullScaleChartAttempt(attempt(overrides))).toBe(false);
  });

  it("separates skills and sorts oldest first with ID tie-breaking", () => {
    const items = [
      attempt({ id: "lr-2", score: 845, timestampUtc: "2026-10-01T08:00:00Z" }),
      attempt({
        id: "lr-3",
        score: 865,
        timestampUtc: "2026-10-01T10:00:00+02:00",
      }),
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
