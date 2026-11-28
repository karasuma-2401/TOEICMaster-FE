import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import type { ExamSkillType, UnifiedAttemptItem } from "@/features/history/api";
import { ScoreProgressionChart } from "./score-progression-chart";

const skills = ["lr", "speaking", "writing"] as const;

function attempt(
  id: string,
  skill: ExamSkillType,
  score: number,
  timestampUtc = "2026-11-18T10:00:00Z",
): UnifiedAttemptItem {
  return {
    id,
    skill,
    examId: null,
    code: "",
    title: `Test ${id}`,
    modeLabel: "Full Test",
    status: "COMPLETED",
    score,
    maxScore: skill === "lr" ? 990 : 200,
    subScoreLabel: skill === "lr" ? "L 445 · R 410" : null,
    evaluationStatus: null,
    timestampUtc,
    durationSeconds: null,
    resultHref: null,
    reviewHref: null,
    resumeHref: null,
  };
}

function InteractiveChart({ items }: { items: UnifiedAttemptItem[] }) {
  const [skill, setSkill] = useState<ExamSkillType>("lr");
  return (
    <ScoreProgressionChart
      activeSkill={skill}
      items={items}
      onSkillChange={setSkill}
      skills={skills}
    />
  );
}

afterEach(cleanup);

describe("ScoreProgressionChart", () => {
  it("switches between skill scales by keyboard and formats trend deltas", async () => {
    const user = userEvent.setup();
    render(
      <InteractiveChart
        items={[
          attempt("lr-1", "lr", 810),
          attempt("lr-2", "lr", 855),
          attempt("s-1", "speaking", 160),
          attempt("s-2", "speaking", 150),
          attempt("w-1", "writing", 175),
          attempt("w-2", "writing", 175),
        ]}
      />,
    );

    const tabs = screen.getByRole("tablist", {
      name: "Score progression skill",
    });
    expect(
      within(tabs).getByRole("tab", { name: "L&R (0-990)" }),
    ).toHaveAttribute("aria-selected", "true");
    expect(await screen.findByText("990", { selector: "tspan" })).toBeVisible();
    const summary = screen.getByTestId("score-progression-summary");
    expect(summary).toHaveTextContent("855 / 990");
    expect(summary).toHaveTextContent("+45 vs prev");
    expect(summary).toHaveTextContent("2 full tests");

    await user.tab();
    await user.keyboard("{ArrowRight}");
    expect(
      within(tabs).getByRole("tab", { name: "Speaking (0-200)" }),
    ).toHaveAttribute("aria-selected", "true");
    expect(await screen.findByText("200", { selector: "tspan" })).toBeVisible();
    expect(
      screen.queryByText("990", { selector: "tspan" }),
    ).not.toBeInTheDocument();
    expect(summary).toHaveTextContent("-10 vs prev");

    await user.click(
      within(tabs).getByRole("tab", { name: "Writing (0-200)" }),
    );
    expect(summary).toHaveTextContent(/^175 \/ 200\s*0 vs prev/);
  });

  it.each([[], [attempt("lr-1", "lr", 855)]])(
    "shows an insufficient-data state without a canvas or summary (%j)",
    (...items) => {
      render(<InteractiveChart items={items} />);

      expect(screen.getByTestId("score-progression-empty")).toHaveTextContent(
        "Complete at least 2 scored full tests in this skill to view your score trend.",
      );
      expect(
        screen.queryByTestId("score-progression-canvas"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("score-progression-summary"),
      ).not.toBeInTheDocument();
    },
  );

  it("opens the custom tooltip through chart keyboard navigation", async () => {
    const user = userEvent.setup();
    const early = "2026-11-10T08:00:00Z";
    render(
      <InteractiveChart
        items={[attempt("lr-2", "lr", 855), attempt("lr-1", "lr", 790, early)]}
      />,
    );

    await screen.findByText("990", { selector: "tspan" });
    await user.tab();
    await user.tab();
    const tooltip = await screen.findByTestId("score-progression-tooltip");
    expect(tooltip).toHaveTextContent("Test lr-1");
    expect(tooltip.querySelector("time")).toHaveAttribute("datetime", early);
    expect(tooltip).toHaveTextContent("790 / 990");
    expect(tooltip).toHaveTextContent("L 445 · R 410");

    await user.keyboard("{ArrowRight}");
    expect(tooltip).toHaveTextContent("Test lr-2");
    expect(tooltip).toHaveTextContent("855 / 990");
  });
});
