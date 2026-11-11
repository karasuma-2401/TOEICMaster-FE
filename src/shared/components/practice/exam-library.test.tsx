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
  format: "11 câu · ~20 phút · 0–200 điểm · 5 Parts",
  maxScore: 200,
  examHref: "/speaking",
  exerciseHref: "/speaking/parts/1",
};

const items: ExamLibraryItem[] = Array.from({ length: 7 }, (_, index) => ({
  id: `t${index + 1}`,
  code: `SP-${index + 1}`,
  title: `Test ${index + 1}`,
  badge: "5 Parts",
  meta: "11 câu · ~20 phút · 0–200 điểm",
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
      emptyDescription="Mô tả trống"
      emptyTitle="Chưa có đề"
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
    expect(within(card).getByText("✓ Đã làm")).toBeInTheDocument();
    expect(within(card).getByText("Bạn đã thi 2 lần")).toBeInTheDocument();
    expect(within(card).getByText("Tốt nhất: 160 / 200")).toBeInTheDocument();
    expect(
      within(card).getByRole("link", { name: "Vào thi Speaking" }),
    ).toHaveAttribute("href", "/speaking/tests/t7");
  });

  it("links between the skill's tests and exercises", () => {
    renderLibrary();
    const nav = screen.getByRole("navigation", {
      name: "Chọn đề thi hoặc bài tập Speaking",
    });
    expect(
      within(nav).getByRole("link", { name: "Đề thi thử" }),
    ).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("link", { name: "Bài tập" })).toHaveAttribute(
      "href",
      "/speaking/parts/1",
    );
  });

  it("pages six tests at a time", async () => {
    const user = userEvent.setup();
    renderLibrary();
    expect(screen.getAllByRole("article")).toHaveLength(6);
    expect(screen.getByText(/Hiển thị 1–6 trong 7 đề thi/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Tiếp →" }));
    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "Test 1" })).toBeInTheDocument();
  });

  it("returns to the first page when a filter changes", async () => {
    const user = userEvent.setup();
    renderLibrary();
    await user.click(screen.getByRole("button", { name: "2" }));
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Trạng thái" }),
      "TODO",
    );
    expect(screen.getByText("6 đề thi Speaking")).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(6);
  });

  it("explains an empty search result", async () => {
    const user = userEvent.setup();
    renderLibrary();
    await user.type(screen.getByRole("searchbox"), "không có");
    expect(
      screen.getByText("Không tìm thấy đề thi phù hợp"),
    ).toBeInTheDocument();
  });

  it("shows the empty state and disables filters without tests", () => {
    renderLibrary({ items: [] });
    expect(screen.getByText("Chưa có đề")).toBeInTheDocument();
    expect(screen.getByRole("searchbox")).toBeDisabled();
    expect(screen.getByText("— / 200")).toBeInTheDocument();
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
      screen.getByRole("heading", { name: "Bài tập Speaking" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Part 1" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await user.click(screen.getByRole("button", { name: "Làm bài Speaking" }));
    expect(onStart).toHaveBeenCalledOnce();
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Độ khó" }),
      "HARD",
    );
    expect(screen.getByText("1 bài tập Speaking")).toBeInTheDocument();
  });

  it("hides the difficulty filter when items have no difficulty", () => {
    renderLibrary();
    expect(
      screen.queryByRole("combobox", { name: "Độ khó" }),
    ).not.toBeInTheDocument();
  });

  it("offers a retry when loading fails", async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    renderLibrary({ items: [], error: "Lỗi tải", onRetry });
    await user.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(onRetry).toHaveBeenCalledOnce();
    expect(screen.queryByText("Chưa có đề")).not.toBeInTheDocument();
  });
});
