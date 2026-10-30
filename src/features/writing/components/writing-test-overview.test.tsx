// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WritingTestOverview } from "./writing-test-overview";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("./writing-header", () => ({
  WritingHeader: () => <header>Writing header</header>,
}));
vi.mock("@/features/writing/attempt-api", () => ({
  getWritingTest: vi.fn().mockResolvedValue({
    id: "test-1",
    code: "WRT-01",
    title: "Writing practice",
    description: "Description",
    publishedAtUtc: "2026-10-23T00:00:00Z",
    parts: [
      {
        part: 1,
        questionCount: 5,
        preparationSeconds: 30,
        responseSeconds: 60,
      },
      {
        part: 2,
        questionCount: 2,
        preparationSeconds: 60,
        responseSeconds: 540,
      },
      {
        part: 3,
        questionCount: 1,
        preparationSeconds: 120,
        responseSeconds: 1680,
      },
    ],
  }),
  modeFromRoute: (value: string | undefined) =>
    value === "part-2" ? "PART_2" : "FULL",
  startWritingAttempt: vi.fn(),
}));

describe("WritingTestOverview", () => {
  it("shows only the selected Part's timing and structure in practice mode", async () => {
    render(<WritingTestOverview mode="part-2" testId="test-1" />);

    expect(await screen.findByText("LUYỆN THEO PART")).toBeInTheDocument();
    expect(screen.getByText("2 câu")).toBeInTheDocument();
    expect(screen.getByText("20 phút")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Writing Part 2" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Writing Part 3")).not.toBeInTheDocument();
  });
});
