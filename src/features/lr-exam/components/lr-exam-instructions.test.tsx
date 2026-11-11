// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { demoExam } from "../demo-data";

vi.mock("@/features/user/components/user-menu", () => ({
  UserMenu: () => <div />,
}));

import { LrExamInstructions } from "./lr-exam-instructions";

describe("LrExamInstructions", () => {
  it("enables start only after readiness is confirmed", () => {
    render(<LrExamInstructions exam={demoExam} />);
    expect(
      screen.getByRole("button", { name: /BẮT ĐẦU LÀM BÀI THI/ }),
    ).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox"));
    expect(
      screen.getByRole("link", { name: /BẮT ĐẦU LÀM BÀI THI/ }),
    ).toHaveAttribute("href", `/exams/lr/${demoExam.id}/attempt`);
  });
});
