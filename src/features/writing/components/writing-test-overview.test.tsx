// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { writingTests } from "@/features/writing/mock-data";
import { WritingTestOverview } from "./writing-test-overview";

vi.mock("./writing-header", () => ({
  WritingHeader: () => <header>Writing header</header>,
}));

describe("WritingTestOverview", () => {
  it("shows only the selected Part's timing and structure in practice mode", () => {
    render(<WritingTestOverview mode="part-2" test={writingTests[0]} />);

    expect(screen.getByText("LUYỆN THEO PART")).toBeInTheDocument();
    expect(screen.getByText("2 câu")).toBeInTheDocument();
    expect(screen.getByText("20 phút")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Respond to a written request",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Write an opinion essay"),
    ).not.toBeInTheDocument();
  });
});
