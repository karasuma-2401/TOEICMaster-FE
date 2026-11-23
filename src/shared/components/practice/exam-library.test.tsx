// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ExamLibrary, type ExamLibrarySkill } from "./exam-library";
import type { ExamLibraryItem } from "./exam-library-model";

const skill: ExamLibrarySkill = {
  id: "speaking",
  name: "Speaking",
  tagline: "Tagline",
  format: "11 questions · ~20 min · 0-200 pts · 5 Parts",
  maxScore: 200,
  examHref: "/speaking",
  exerciseHref: "/speaking/parts/1",
};

const items: ExamLibraryItem[] = Array.from({ length: 7 }, (_, index) => ({
  id: `t${index + 1}`,
  code: `SP-${index + 1}`,
  title: `Test ${index + 1}`,
  badge: "5 Parts",
  meta: "11 questions · ~20 min · 0-200 pts",
  action: { href: `/speaking/tests/t${index + 1}` },
  sortKey: `2026-01-0${index + 1}T00:00:00Z`,
  difficulty: null,
  attemptCount: index === 6 ? 2 : 0,
  bestScore: index === 6 ? 160 : null,
}));

const renderLibrary = (
  props: Partial<Parameters<typeof ExamLibrary>[0]> = {},
) =>
  render(
    <ExamLibrary
      emptyDescription="Empty description"
      emptyTitle="No tests yet"
      header={null}
      items={items}
      skill={skill}
      {...props}
    />,
  );

describe("ExamLibrary", () => {
  afterEach(cleanup);

  it("shows the learner's results on the page and the card", () => {
    renderLibrary();
    expect(screen.getByText("160 / 200")).toBeInTheDocument();
    const card = screen
      .getByRole("heading", { name: "Test 7" })
      .closest("article") as HTMLElement;
    expect(within(card).getByText("✓ Completed")).toBeInTheDocument();
    expect(within(card).getByText("Attempted 2 times")).toBeInTheDocument();
    expect(within(card).getByText("Best: 160 / 200")).toBeInTheDocument();
    expect(
      within(card).getByRole("link", { name: "Start Speaking" }),
    ).toHaveAttribute("href", "/speaking/tests/t7");
  });

  it("links between the skill's tests and exercises", () => {
    renderLibrary();
    const nav = screen.getByRole("navigation", {
      name: "Choose Speaking tests or exercises",
    });
    expect(
      within(nav).getByRole("link", { name: "Mock Tests" }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      within(nav).getByRole("link", { name: "Exercises" }),
    ).toHaveAttribute("href", "/speaking/parts/1");
  });

  it("pages six tests at a time", async () => {
    const user = userEvent.setup();
    renderLibrary();
    expect(screen.getAllByRole("article")).toHaveLength(6);
    expect(screen.getByText(/Showing 1-6 of 7 tests/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Next →" }));
    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "Test 1" })).toBeInTheDocument();
  });

  it("returns to the first page when a filter changes", async () => {
    const user = userEvent.setup();
    renderLibrary();
    await user.click(screen.getByRole("button", { name: "2" }));
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Status" }),
      "TODO",
    );
    expect(screen.getByText("6 tests Speaking")).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(6);
  });

  it("explains an empty search result", async () => {
    const user = userEvent.setup();
    renderLibrary();
    await user.type(screen.getByRole("searchbox"), "not found");
    expect(screen.getByText("No matching tests found")).toBeInTheDocument();
  });

  it("shows the empty state and disables filters without tests", () => {
    renderLibrary({ items: [] });
    expect(screen.getByText("No tests yet")).toBeInTheDocument();
    expect(screen.getByRole("searchbox")).toBeDisabled();
    expect(screen.getByText("- / 200")).toBeInTheDocument();
  });

  it("adapts its wording and filters to exercises", async () => {
    const onStart = vi.fn();
    const user = userEvent.setup();
    renderLibrary({
      kind: "exercise",
      items: [
        {
          ...items[0],
          difficulty: "EASY",
          action: { onStart, starting: false, disabled: false },
        },
        { ...items[1], difficulty: "HARD" },
      ],
      partLinks: [{ href: "/p/1", label: "Part 1", active: true }],
    });
    expect(
      screen.getByRole("heading", { name: "Exercises Speaking" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Part 1" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await user.click(screen.getByRole("button", { name: "Practice Speaking" }));
    expect(onStart).toHaveBeenCalledOnce();
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Difficulty" }),
      "HARD",
    );
    expect(screen.getByText("1 exercises Speaking")).toBeInTheDocument();
  });

  it("hides the difficulty filter when items have no difficulty", () => {
    renderLibrary();
    expect(
      screen.queryByRole("combobox", { name: "Difficulty" }),
    ).not.toBeInTheDocument();
  });

  it("offers a retry when loading fails", async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    renderLibrary({ items: [], error: "Failed to load", onRetry });
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledOnce();
    expect(screen.queryByText("No tests yet")).not.toBeInTheDocument();
  });
});
