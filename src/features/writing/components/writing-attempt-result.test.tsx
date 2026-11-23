// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { WritingAttemptResult } from "./writing-attempt-result";

vi.mock("./writing-header", () => ({ WritingHeader: () => null }));
vi.mock("@/features/writing/attempt-api", () => ({
  getWritingAttempt: vi.fn().mockResolvedValue({
    mode: "PART_1",
    questions: [{ part: 1 }],
    evaluation: {
      status: "FAILED",
      failureMessage: "Could not grade writing.",
    },
  }),
  displayMode: () => "Writing Part 1",
  grantWritingEvaluationConsent: vi.fn(),
}));

afterEach(cleanup);

it("shows a failed status instead of claiming the AI is still grading", async () => {
  render(<WritingAttemptResult attemptId="attempt-1" />);

  expect(await screen.findByText("Evaluation failed")).toBeInTheDocument();
  expect(screen.queryByText("AI grading")).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Retry grading" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /history/i })).toHaveAttribute(
    "href",
    "/history",
  );
});
