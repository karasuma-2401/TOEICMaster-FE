// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WritingPracticeLibrary } from "./writing-practice-library";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  list: vi.fn(),
  start: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("./writing-header", () => ({
  WritingHeader: () => <header>Writing</header>,
}));
vi.mock("@/features/writing/attempt-api", () => ({
  getWritingPracticeExercises: mocks.list,
  startWritingPractice: mocks.start,
}));

describe("WritingPracticeLibrary", () => {
  it("starts an individual published exercise and opens its attempt", async () => {
    mocks.list.mockResolvedValue({
      items: [
        {
          id: "exercise-1",
          part: 2,
          code: "WP2-1",
          topic: "Work",
          difficulty: "EASY",
        },
      ],
      pageNumber: 1,
      pageSize: 20,
      totalCount: 1,
    });
    mocks.start.mockResolvedValue({ id: "attempt-1" });

    render(<WritingPracticeLibrary part={2} />);
    fireEvent.click(await screen.findByRole("button", { name: "Làm bài" }));

    await waitFor(() => expect(mocks.start).toHaveBeenCalledWith("exercise-1"));
    expect(mocks.push).toHaveBeenCalledWith("/writing/attempts/attempt-1");
  });
});
