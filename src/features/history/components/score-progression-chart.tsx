"use client";

import { Tabs } from "radix-ui";
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ExamSkillType, UnifiedAttemptItem } from "@/features/history/api";
import {
  buildSkillProgression,
  CHART_WINDOW_THRESHOLD,
  DENSE_DOT_THRESHOLD,
  getAvailableChartWindows,
  resolveEffectiveChartWindow,
  skillChartConfigs,
  sliceProgressionPoints,
  type ChartWindowOption,
  type ProgressionPoint,
  type SkillProgressionSeries,
} from "@/features/history/progression";
import { focusRing } from "@/shared/components/practice/styles";

const chartMargin = { top: 10, right: 8, bottom: 2, left: 0 };
const axisStyle = { fill: "#6B655F", fontSize: 12 };
const axisPadding = { left: 16, right: 16 };
const initialDimension = { width: 640, height: 280 };

function ProgressionTooltip({ point }: { point: ProgressionPoint }) {
  return (
    <div
      className="max-w-56 rounded-xl border border-[#EEE9E6] bg-white px-3 py-2 text-xs wrap-break-word whitespace-normal text-[#6B655F] shadow-sm"
      data-testid="score-progression-tooltip"
      role="tooltip"
    >
      <p className="font-semibold text-[#2F2B28]">{point.title}</p>
      <time dateTime={point.timestampUtc}>{point.fullDateLabel}</time>
      <p className="mt-1 font-semibold text-[#2F2B28]">
        {point.score} / {point.maxScore}
      </p>
      {point.subScoreLabel !== null && <p>{point.subScoreLabel}</p>}
    </div>
  );
}

function ProgressionPlot({
  points,
  config,
  className,
}: Pick<SkillProgressionSeries, "points" | "config"> & { className: string }) {
  const chartLabel = `Score progression line chart for ${config.label}`;
  const datesByAttempt = new Map(
    points.map((point) => [point.attemptNumber, point.shortDateLabel]),
  );

  return (
    <ResponsiveContainer
      aria-label={chartLabel}
      className={`min-w-0 ${className}`}
      data-testid="score-progression-canvas"
      height={280}
      initialDimension={initialDimension}
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- A native img cannot contain the interactive Recharts SVG.
      role="img"
    >
      <LineChart accessibilityLayer data={points} margin={chartMargin}>
        <CartesianGrid
          stroke="#EEE9E6"
          strokeDasharray="4 4"
          vertical={false}
        />
        <XAxis
          axisLine={false}
          dataKey="attemptNumber"
          interval="preserveStartEnd"
          minTickGap={16}
          padding={axisPadding}
          tick={axisStyle}
          tickFormatter={(attemptNumber: number) =>
            datesByAttempt.get(attemptNumber) ?? ""
          }
          tickLine={false}
        />
        <YAxis
          allowDataOverflow
          axisLine={false}
          domain={[0, config.maxScore]}
          tick={axisStyle}
          tickLine={false}
          ticks={config.ticks}
          width={36}
        />
        <Tooltip
          content={({ active, activeIndex, payload }) => {
            const index =
              activeIndex === undefined ||
              activeIndex === null ||
              activeIndex === ""
                ? Number.NaN
                : Number(activeIndex);
            const point = Number.isInteger(index)
              ? points[index]
              : (payload?.[0]?.payload as ProgressionPoint | undefined);
            return (
              <div aria-live="polite">
                {active && point ? <ProgressionTooltip point={point} /> : null}
              </div>
            );
          }}
          isAnimationActive={false}
        />
        <Line
          activeDot={{ r: 5 }}
          dataKey="score"
          dot={
            points.length <= DENSE_DOT_THRESHOLD
              ? {
                  clipDot: false,
                  r: 3.5,
                  fill: config.stroke,
                  stroke: "#FFFFFF",
                  strokeWidth: 1.5,
                }
              : false
          }
          isAnimationActive={false}
          stroke={config.stroke}
          strokeWidth={2.5}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function ScoreProgressionChart({
  items,
  skills,
  activeSkill,
  onSkillChange,
}: {
  items: readonly UnifiedAttemptItem[];
  skills: readonly ExamSkillType[];
  activeSkill: ExamSkillType;
  onSkillChange: (skill: ExamSkillType) => void;
}) {
  const [requestedWindow, setRequestedWindow] =
    useState<ChartWindowOption>("10");
  const series = useMemo(
    () => buildSkillProgression(items, activeSkill),
    [items, activeSkill],
  );
  const { config, deltaFromPrevious, hasTrend, latestScore, points } = series;
  const totalPoints = points.length;
  const showRanges = totalPoints > CHART_WINDOW_THRESHOLD;
  const effectiveWindow = resolveEffectiveChartWindow(
    totalPoints,
    requestedWindow,
  );
  const visiblePoints = useMemo(
    () => sliceProgressionPoints(points, effectiveWindow),
    [points, effectiveWindow],
  );

  return (
    <section
      aria-label="Score progression"
      className="mt-4 min-w-0 rounded-2xl border border-[#EEE9E6] bg-white p-5"
      data-testid="score-progression-chart"
    >
      <Tabs.Root
        onValueChange={(value) => {
          const skill = skills.find((option) => option === value);
          if (skill) onSkillChange(skill);
        }}
        value={activeSkill}
      >
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div>
            <h2 className="text-lg leading-6 font-semibold text-[#2F2B28]">
              Score Progression
            </h2>
            {hasTrend && latestScore !== null && deltaFromPrevious !== null ? (
              <p
                className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-sm text-[#6B655F]"
                data-testid="score-progression-summary"
              >
                <span className="font-semibold text-[#2F2B28]">
                  {latestScore} / {config.maxScore}
                </span>
                <span>
                  {deltaFromPrevious > 0 ? "+" : ""}
                  {deltaFromPrevious} vs prev
                </span>
                <span>
                  {effectiveWindow === "all"
                    ? `${totalPoints} full tests`
                    : `Showing last ${visiblePoints.length} of ${totalPoints} full tests`}
                </span>
              </p>
            ) : null}
          </div>
          <Tabs.List
            aria-label="Score progression skill"
            className="grid w-full grid-cols-3 gap-1.5 sm:flex sm:w-auto sm:flex-wrap sm:gap-2"
            data-testid="score-progression-tabs"
          >
            {skills.map((skill) => {
              const tab = skillChartConfigs[skill];
              return (
                <Tabs.Trigger
                  className={`min-h-11 rounded-lg border border-[#EEE9E6] px-1.5 text-xs font-semibold text-[#6B655F] transition-colors hover:bg-[#FAF7F5] sm:px-2.5 ${focusRing}`}
                  data-testid={`score-progression-tab-${skill}`}
                  key={skill}
                  style={
                    skill === activeSkill
                      ? {
                          backgroundColor: tab.activeBg,
                          borderColor: tab.activeBorder,
                          color: tab.activeText,
                        }
                      : undefined
                  }
                  value={skill}
                >
                  {tab.shortLabel}{" "}
                  <span className="max-sm:block">({tab.scaleLabel})</span>
                </Tabs.Trigger>
              );
            })}
          </Tabs.List>
        </div>
        {skills.map((skill) => (
          <Tabs.Content
            className={`mt-4 ${focusRing}`}
            key={skill}
            tabIndex={hasTrend ? -1 : 0}
            value={skill}
          >
            {skill !== activeSkill ? null : hasTrend ? (
              <>
                {showRanges && (
                  <fieldset
                    aria-label="Chart attempt range"
                    className="mb-2 flex min-w-0 flex-wrap gap-1.5 border-0 p-0"
                    data-testid="score-progression-range"
                  >
                    {getAvailableChartWindows(totalPoints).map((option) => (
                      <button
                        aria-pressed={effectiveWindow === option}
                        className={`min-h-11 rounded-lg border border-[#EEE9E6] px-2.5 text-xs font-semibold text-[#6B655F] transition-colors hover:bg-[#FAF7F5] aria-pressed:border-[#EA580C] aria-pressed:bg-[#FFF7ED] aria-pressed:text-[#C2410C] sm:min-h-8 ${focusRing}`}
                        data-testid={`score-progression-range-${option}`}
                        key={option}
                        onClick={() => setRequestedWindow(option)}
                        type="button"
                      >
                        {option === "all"
                          ? `All (${totalPoints})`
                          : `Last ${option}`}
                      </button>
                    ))}
                  </fieldset>
                )}
                <ProgressionPlot
                  className={showRanges ? "max-sm:max-w-[calc(100%-2rem)]" : ""}
                  points={visiblePoints}
                  config={config}
                />
              </>
            ) : (
              <p
                className="rounded-xl border border-dashed border-[#EEE9E6] bg-[#FAF7F5] px-4 py-6 text-center text-sm text-[#6B655F]"
                data-testid="score-progression-empty"
              >
                Complete at least 2 scored full tests in this skill to view your
                score trend.
              </p>
            )}
          </Tabs.Content>
        ))}
      </Tabs.Root>
    </section>
  );
}
