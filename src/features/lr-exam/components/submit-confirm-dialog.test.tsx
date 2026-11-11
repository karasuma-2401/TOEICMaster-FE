// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SubmitConfirmDialog } from "./submit-confirm-dialog";

const summary = {
  total: 200,
  answered: 182,
  listeningAnswered: 100,
  readingAnswered: 82,
  missing: [112, 118],
};

describe("SubmitConfirmDialog", () => {
  it("shows summary and wires actions", () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    render(
      <SubmitConfirmDialog
        onCancel={onCancel}
        onConfirm={onConfirm}
        remainingSeconds={865}
        summary={summary}
      />,
    );
    expect(screen.getByRole("dialog")).toHaveAccessibleName(
      "Xác nhận nộp bài thi?",
    );
    expect(screen.getByText("14 phút 25 giây")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Xác nhận nộp bài L&R" }),
    );
    expect(onConfirm).toHaveBeenCalled();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onCancel).toHaveBeenCalled();
  });
});
