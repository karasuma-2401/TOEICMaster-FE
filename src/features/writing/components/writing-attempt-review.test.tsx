// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { WritingAttemptReview } from "./writing-attempt-review";

const mocks = vi.hoisted(() => ({
  getAttempt: vi.fn(),
  getHistory: vi.fn(),
}));
vi.mock("./writing-header", () => ({
  WritingHeader: ({ center }: { center?: React.ReactNode }) => (
    <header>{center}</header>
  ),
}));
vi.mock("./writing-question-prompt", () => ({
  WritingQuestionPrompt: ({ question }: { question: { prompt: string } }) => (
    <p>{question.prompt}</p>
  ),
}));
vi.mock("@/features/writing/attempt-api", () => ({
  getWritingAttempt: mocks.getAttempt,
  getWritingHistory: mocks.getHistory,
}));

const attempt = {
  id: "attempt-2",
  testId: "test-1",
  isPractice: false,
  testTitle: "Writing Test 01",
  mode: "FULL",
  status: "SUBMITTED_AWAITING_EVALUATION",
  submittedAtUtc: "2026-10-31T05:00:00Z",
  questions: [
    { position: 1, part: 1, prompt: "Prompt one", answer: "A short sentence" },
    { position: 2, part: 3, prompt: "Prompt two", answer: "" },
  ],
  reviewQuestions: [],
  evaluation: {
    estimatedScore: 150,
    feedback: [
      {
        questionPosition: 1,
        criterionScore: 2,
        feedback: "Good grammar",
        suggestedRevision: "Add detail",
      },
    ],
  },
};
const summary = {
  testId: "test-1",
  isPractice: false,
  mode: "FULL",
  status: "SUBMITTED_AWAITING_EVALUATION",
};

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  mocks.getAttempt.mockResolvedValue(attempt);
  mocks.getHistory.mockResolvedValue([
    {
      ...summary,
      id: "attempt-2",
      submittedAtUtc: "2026-10-31T05:00:00Z",
      createdAtUtc: "2026-10-31T04:00:00Z",
      estimatedScore: 150,
    },
    {
      ...summary,
      id: "attempt-1",
      submittedAtUtc: "2026-10-24T05:00:00Z",
      createdAtUtc: "2026-10-24T04:00:00Z",
      estimatedScore: 140,
    },
  ]);
});

it("numbers the attempt from history and shows the learner's own answer", async () => {
  render(<WritingAttemptReview attemptId="attempt-2" />);

  expect(
    await screen.findByText(/Writing Test 01 · Lần thi #02 · 150\/200/),
  ).toBeInTheDocument();
  expect(screen.getByText("A short sentence")).toBeInTheDocument();
  expect(screen.getByText("3 từ · Chỉ đọc")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /#01/ })).toHaveAttribute(
    "href",
    "/writing/attempts/attempt-1/review",
  );
});

it("switches question and falls back to AI feedback without a model essay", async () => {
  const user = userEvent.setup();
  render(<WritingAttemptReview attemptId="attempt-2" />);

  expect(await screen.findByText("Good grammar")).toBeInTheDocument();
  expect(screen.queryByText("High-score Model Essay")).not.toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Câu 2" }));

  expect(screen.getByText("Prompt two")).toBeInTheDocument();
  expect(screen.getByText("Không có câu trả lời.")).toBeInTheDocument();
  expect(screen.queryByText("Good grammar")).not.toBeInTheDocument();
});

it("shows the model essay when the API provides one", async () => {
  mocks.getAttempt.mockResolvedValueOnce({
    ...attempt,
    reviewQuestions: [{ position: 1, modelAnswer: "A model sentence" }],
  });
  render(<WritingAttemptReview attemptId="attempt-2" />);

  expect(await screen.findByText("A model sentence")).toBeInTheDocument();
  expect(screen.getByText("High-score Model Essay")).toBeInTheDocument();
});

it("still works when the attempt history cannot load", async () => {
  mocks.getHistory.mockRejectedValueOnce(new Error("offline"));
  render(<WritingAttemptReview attemptId="attempt-2" />);

  expect(await screen.findByText("A short sentence")).toBeInTheDocument();
  expect(screen.queryByText("Lịch sử lần thi")).not.toBeInTheDocument();
});

it("does not review an attempt that is still in progress", async () => {
  mocks.getAttempt.mockResolvedValueOnce({
    ...attempt,
    status: "IN_PROGRESS",
  });
  render(<WritingAttemptReview attemptId="attempt-2" />);

  expect(await screen.findByText("Bài làm chưa được nộp")).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "Tiếp tục làm bài" }),
  ).toHaveAttribute("href", "/writing/attempts/attempt-2");
});
