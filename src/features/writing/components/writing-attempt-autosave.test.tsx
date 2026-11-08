// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { WritingAttemptPlaceholder } from "./writing-attempt-placeholder";

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  save: vi.fn(),
  router: { replace: vi.fn() },
}));
vi.mock("next/navigation", () => ({
  useRouter: () => mocks.router,
}));
vi.mock("./writing-header", () => ({ WritingHeader: () => null }));
vi.mock("./writing-question-prompt", () => ({
  WritingQuestionPrompt: () => null,
}));
vi.mock("@/features/writing/attempt-api", () => ({
  getWritingAttempt: mocks.get,
  saveWritingAnswer: mocks.save,
  nextWritingQuestion: vi.fn(),
  submitWritingAttempt: vi.fn(),
  flushWritingAnswerOnPageHide: vi.fn(),
}));
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
});

it("keeps unsaved typing when a timer refresh returns an older server answer", async () => {
  vi.useFakeTimers();
  const now = Date.now();
  const attempt = {
    id: "attempt-1",
    testCode: "WT-1",
    testTitle: "Test",
    isPractice: false,
    status: "IN_PROGRESS",
    currentPhase: "ANSWERING",
    currentQuestionPosition: 1,
    serverNowUtc: new Date(now).toISOString(),
    phaseEndsAtUtc: new Date(now + 900).toISOString(),
    questions: [
      {
        position: 1,
        part: 3,
        answer: "Old answer",
        minimumWordCount: 300,
        lockedAtUtc: null,
      },
    ],
  };
  mocks.get.mockResolvedValue(attempt);
  render(<WritingAttemptPlaceholder attemptId="attempt-1" />);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
  const answer = screen.getByLabelText("Bài làm của bạn");
  await act(async () => {
    await vi.advanceTimersByTimeAsync(700);
  });
  fireEvent.change(answer, { target: { value: "New answer" } });
  expect(screen.getByText("Chưa lưu trên server")).toBeInTheDocument();

  await act(async () => {
    await vi.advanceTimersByTimeAsync(300);
  });

  expect(mocks.get).toHaveBeenCalledTimes(2);
  expect(answer).toHaveValue("New answer");
});

it("keeps focus and saves edits in order when the learner continues typing during autosave", async () => {
  vi.useFakeTimers();
  const now = Date.now();
  const attempt = {
    id: "attempt-1",
    testCode: "WT-1",
    testTitle: "Test",
    isPractice: true,
    status: "IN_PROGRESS",
    currentPhase: "ANSWERING",
    currentQuestionPosition: 1,
    serverNowUtc: new Date(now).toISOString(),
    phaseEndsAtUtc: null,
    questions: [
      {
        position: 1,
        part: 3,
        answer: "",
        minimumWordCount: 300,
        lockedAtUtc: null,
      },
    ],
  };
  let finishFirst!: (value: unknown) => void;
  const first = new Promise((resolve) => {
    finishFirst = resolve;
  });
  mocks.get.mockResolvedValue(attempt);
  mocks.save.mockReturnValueOnce(first).mockResolvedValueOnce({
    ...attempt,
    questions: [{ ...attempt.questions[0], answer: "Hello again" }],
  });
  render(<WritingAttemptPlaceholder attemptId="attempt-1" />);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
  const answer = screen.getByLabelText("Bài làm của bạn");
  answer.focus();
  fireEvent.change(answer, { target: { value: "Hello" } });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(800);
  });

  expect(answer).toHaveFocus();
  expect(answer).toBeEnabled();
  expect(mocks.save).toHaveBeenCalledTimes(1);
  fireEvent.change(answer, { target: { value: "Hello again" } });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(800);
  });
  expect(mocks.save).toHaveBeenCalledTimes(1);
  expect(answer).toHaveValue("Hello again");

  await act(async () => {
    finishFirst({
      ...attempt,
      questions: [{ ...attempt.questions[0], answer: "Hello" }],
    });
    await Promise.resolve();
  });
  expect(mocks.save).toHaveBeenNthCalledWith(2, "attempt-1", 1, "Hello again");
  expect(answer).toHaveValue("Hello again");
  expect(answer).toHaveFocus();
  expect(screen.getByText("Đã autosave trên server")).toBeInTheDocument();
});

it("ignores an older timer refresh that arrives after a successful autosave", async () => {
  vi.useFakeTimers();
  const now = Date.now();
  const attempt = {
    id: "attempt-1",
    testCode: "WT-1",
    testTitle: "Test",
    isPractice: false,
    status: "IN_PROGRESS",
    currentPhase: "ANSWERING",
    currentQuestionPosition: 1,
    serverNowUtc: new Date(now).toISOString(),
    phaseEndsAtUtc: new Date(now + 900).toISOString(),
    questions: [
      {
        position: 1,
        part: 3,
        answer: "Old",
        minimumWordCount: 300,
        lockedAtUtc: null,
      },
    ],
  };
  let finishRefresh!: (value: unknown) => void;
  const staleRefresh = new Promise((resolve) => {
    finishRefresh = resolve;
  });
  mocks.get.mockResolvedValueOnce(attempt).mockReturnValueOnce(staleRefresh);
  mocks.save.mockResolvedValueOnce({
    ...attempt,
    questions: [{ ...attempt.questions[0], answer: "New" }],
  });
  render(<WritingAttemptPlaceholder attemptId="attempt-1" />);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
  const answer = screen.getByLabelText("Bài làm của bạn");
  await act(async () => {
    await vi.advanceTimersByTimeAsync(700);
  });
  fireEvent.change(answer, { target: { value: "New" } });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(800);
  });
  expect(screen.getByText("Đã autosave trên server")).toBeInTheDocument();

  await act(async () => {
    finishRefresh(attempt);
    await Promise.resolve();
  });

  expect(answer).toHaveValue("New");
});
