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
        items={[
          attempt("lr-2", "lr", 855),
          attempt("lr-1", "lr", 790, early),
          attempt("s-1", "speaking", 150, early),
          attempt("s-2", "speaking", 160),
        ]}
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

    await user.click(screen.getByRole("tab", { name: "Speaking (0-200)" }));
    await screen.findByText("200", { selector: "tspan" });
    await user.tab();
    const speakingTooltip = await screen.findByTestId(
      "score-progression-tooltip",
    );
    expect(speakingTooltip).toHaveTextContent("Test s-1");
    expect(speakingTooltip).toHaveTextContent("150 / 200");
    expect(speakingTooltip).not.toHaveTextContent(/\bnull\b/i);
  });

  it("keeps static dots and hides range controls at 10 full tests", async () => {
    const items = Array.from({ length: 10 }, (_, index) =>
      attempt(`lr-${index + 1}`, "lr", 800 + index),
    );
    render(<InteractiveChart items={items} />);

    const canvas = await screen.findByRole("img", {
      name: "Score progression line chart for Listening & Reading",
    });
    expect(canvas.querySelectorAll("circle.recharts-line-dot")).toHaveLength(
      10,
    );
    expect(
      screen.queryByRole("group", { name: "Chart attempt range" }),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("score-progression-summary")).toHaveTextContent(
      "10 full tests",
    );
  });

  it("falls back to all tests when the selected skill does not offer Last 25", async () => {
    const user = userEvent.setup();
    const items = (
      [
        ["lr", 26],
        ["speaking", 20],
        ["writing", 21],
      ] as const
    ).flatMap(([skill, total]) =>
      Array.from({ length: total }, (_, index) =>
        attempt(`${skill}-${index + 1}`, skill, 100),
      ),
    );
    render(<InteractiveChart items={items} />);

    const range = () =>
      within(screen.getByRole("group", { name: "Chart attempt range" }));
    const summary = screen.getByTestId("score-progression-summary");
    const lastTen = range().getByRole("button", { name: "Last 10" });
    expect(lastTen).toHaveAttribute("aria-pressed", "true");
    expect(summary).toHaveTextContent("Showing last 10 of 26 full tests");

    const lastTwentyFive = range().getByRole("button", { name: "Last 25" });
    await user.click(lastTwentyFive);
    expect(lastTwentyFive).toHaveAttribute("aria-pressed", "true");
    expect(summary).toHaveTextContent("Showing last 25 of 26 full tests");

    await user.click(screen.getByRole("tab", { name: "Speaking (0-200)" }));
    expect(
      range().queryByRole("button", { name: "Last 25" }),
    ).not.toBeInTheDocument();
    expect(range().getByRole("button", { name: "All (20)" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(summary).toHaveTextContent("20 full tests");
    expect(summary).not.toHaveTextContent("Showing last");
    const speaking = screen.getByRole("img", {
      name: "Score progression line chart for Speaking",
    });
    expect(speaking.querySelectorAll("circle.recharts-line-dot")).toHaveLength(
      20,
    );

    await user.click(screen.getByRole("tab", { name: "Writing (0-200)" }));
    expect(range().getByRole("button", { name: "All (21)" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    const writing = screen.getByRole("img", {
      name: "Score progression line chart for Writing",
    });
    expect(
      writing.querySelector("path.recharts-line-curve"),
    ).toBeInTheDocument();
    expect(writing.querySelectorAll("circle.recharts-line-dot")).toHaveLength(
      0,
    );
  });
});
