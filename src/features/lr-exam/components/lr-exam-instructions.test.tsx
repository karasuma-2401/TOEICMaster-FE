// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Thêm đoạn này
const push = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/features/user/components/user-menu", () => ({
  UserMenu: () => <div />,
}));

import { LrExamInstructions } from "./lr-exam-instructions";

describe("LrExamInstructions", () => {
  it("renders the instructions using the exam ID", () => {
    render(<LrExamInstructions examId="demo-exam-id" />);

    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });
});
