import type { ExamSkillType, UnifiedAttemptItem } from "@/features/history/api";

export type ChartWindowOption = "10" | "25" | "all";
export const CHART_WINDOW_THRESHOLD = 10;
export const DENSE_DOT_THRESHOLD = 20;

export interface SkillChartConfig {
  skill: ExamSkillType;
  label: string;
  shortLabel: string;
  scaleLabel: string;
  maxScore: 990 | 200;
  ticks: readonly number[];
  stroke: string;
  activeBg: string;
  activeBorder: string;
  activeText: string;
}

export interface ProgressionPoint {
  id: string;
  attemptNumber: number;
  skill: ExamSkillType;
  title: string;
  modeLabel: string;
  score: number;
  maxScore: number;
  subScoreLabel: string | null;
  timestampUtc: string;
  timestampMs: number;
  shortDateLabel: string;
  fullDateLabel: string;
}

export interface SkillProgressionSeries {
  skill: ExamSkillType;
  config: SkillChartConfig;
  points: ProgressionPoint[];
  hasTrend: boolean;
  latestScore: number | null;
  previousScore: number | null;
  deltaFromPrevious: number | null;
}

const twoHundredTicks = [0, 50, 100, 150, 200];

export const skillChartConfigs: Record<ExamSkillType, SkillChartConfig> = {
  lr: {
    skill: "lr",
    label: "Listening & Reading",
    shortLabel: "L&R",
    scaleLabel: "0-990",
    maxScore: 990,
    ticks: [0, 250, 500, 750, 990],
    stroke: "#1D4ED8",
    activeBg: "#EFF6FF",
    activeBorder: "#1D4ED8",
    activeText: "#1D4ED8",
  },
  speaking: {
    skill: "speaking",
    label: "Speaking",
    shortLabel: "Speaking",
    scaleLabel: "0-200",
    maxScore: 200,
    ticks: twoHundredTicks,
    stroke: "#7E22CE",
    activeBg: "#FAF5FF",
    activeBorder: "#7E22CE",
    activeText: "#7E22CE",
  },
  writing: {
    skill: "writing",
    label: "Writing",
    shortLabel: "Writing",
    scaleLabel: "0-200",
    maxScore: 200,
    ticks: twoHundredTicks,
    stroke: "#047857",
    activeBg: "#ECFDF5",
    activeBorder: "#047857",
    activeText: "#047857",
  },
};

const shortDateFormat = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
});
const fullDateFormat = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function isFullScaleChartAttempt(
  item: UnifiedAttemptItem,
): item is UnifiedAttemptItem & { score: number } {
  return (
    item.status === "COMPLETED" &&
    item.score !== null &&
    Number.isFinite(item.score) &&
    item.maxScore === skillChartConfigs[item.skill].maxScore &&
    !/\bPart\s+\d+\b/i.test(item.modeLabel) &&
    Number.isFinite(Date.parse(item.timestampUtc))
  );
}

export function buildSkillProgression(
  items: readonly UnifiedAttemptItem[],
  skill: ExamSkillType,
): SkillProgressionSeries {
  const points = items
    .filter(isFullScaleChartAttempt)
    .filter((item) => item.skill === skill)
    .map((item) => ({ item, timestampMs: Date.parse(item.timestampUtc) }))
    .sort(
      (left, right) =>
        left.timestampMs - right.timestampMs ||
        (left.item.id < right.item.id
          ? -1
          : Number(left.item.id > right.item.id)),
    )
    .map(({ item, timestampMs }, index) => ({
      id: item.id,
      attemptNumber: index + 1,
      skill,
      title: item.title,
      modeLabel: item.modeLabel,
      score: item.score,
      maxScore: item.maxScore,
      subScoreLabel: item.subScoreLabel,
      timestampUtc: item.timestampUtc,
      timestampMs,
      shortDateLabel: shortDateFormat.format(timestampMs),
      fullDateLabel: fullDateFormat.format(timestampMs),
    }));
  const latestScore = points.at(-1)?.score ?? null;
  const previousScore = points.at(-2)?.score ?? null;

  return {
    skill,
    config: skillChartConfigs[skill],
    points,
    hasTrend: points.length >= 2,
    latestScore,
    previousScore,
    deltaFromPrevious:
      latestScore !== null && previousScore !== null
        ? latestScore - previousScore
        : null,
  };
}

export function resolveDefaultChartSkill(
  items: readonly UnifiedAttemptItem[],
  availableSkills: readonly ExamSkillType[],
): ExamSkillType {
  const counts = { lr: 0, speaking: 0, writing: 0 };
  for (const item of items) {
    if (isFullScaleChartAttempt(item)) counts[item.skill]++;
  }

  return (
    availableSkills.find((skill) => counts[skill] >= 2) ??
    availableSkills.find((skill) => counts[skill] === 1) ??
    availableSkills[0] ??
    "lr"
  );
}

export function getAvailableChartWindows(
  totalPoints: number,
): ChartWindowOption[] {
  if (totalPoints <= CHART_WINDOW_THRESHOLD) return ["all"];
  if (totalPoints <= 25) return ["10", "all"];
  return ["10", "25", "all"];
}

export function resolveEffectiveChartWindow(
  totalPoints: number,
  requested: ChartWindowOption,
): ChartWindowOption {
  return getAvailableChartWindows(totalPoints).includes(requested)
    ? requested
    : "all";
}

export function sliceProgressionPoints(
  points: readonly ProgressionPoint[],
  windowOption: ChartWindowOption,
): ProgressionPoint[] {
  return windowOption === "all"
    ? points.slice()
    : points.slice(-Number(windowOption));
}
