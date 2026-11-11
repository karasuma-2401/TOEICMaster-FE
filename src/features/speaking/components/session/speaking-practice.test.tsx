// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getSpeakingEvaluationAvailability,
  getSpeakingExercise,
  getSpeakingExercises,
  startSpeakingExercisePractice,
  submitSpeakingAttempt,
  type SpeakingExerciseSummary,
} from "@/features/speaking/api";
import { parseAttempt } from "@/features/speaking/attempt";
import { SpeakingApiError } from "@/features/speaking/http";
import { submitPracticeTake } from "@/features/speaking/practice-submission";
import { attemptDto } from "@/features/speaking/testing/fixtures";
import { SpeakingPracticeEntry } from "./speaking-practice";

const push = vi.fn();
const recorder = vi.hoisted(() => ({
  current: {
    status: "idle",
    level: 0,
    recordingKey: null as number | null,
    recordings: {} as Record<number, unknown>,
    requestAccess: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("../speaking-header", () => ({
  SpeakingHeader: () => <header>Speaking header</header>,
}));
vi.mock("./speaking-session", () => ({
  SpeakingSession: () => <p>Timed session</p>,
}));
vi.mock("@/features/speaking/hooks/use-voice-recorder", () => ({
  useVoiceRecorder: () => recorder.current,
}));
vi.mock("@/features/speaking/practice-submission", () => ({
  submitPracticeTake: vi.fn(),
}));
vi.mock("@/features/speaking/api", () => ({
  getSpeakingEvaluationAvailability: vi.fn(),
  getSpeakingExercise: vi.fn(),
  getSpeakingExercises: vi.fn(),
  startSpeakingExercisePractice: vi.fn(),
  submitSpeakingAttempt: vi.fn(),
}));

const passage = "Welcome to the tour, everyone. Enjoy your visit.";
const summary = (id: string, part: 1 | 3 = 1): SpeakingExerciseSummary => ({
  id,
  code: id,
  part,
  topic: "City Garden Tour",
  difficulty: "EASY",
  questionCount: 1,
  durationSeconds: 180,
  updatedAtUtc: "2026-10-20T09:10:00Z",
});

function readAloudAttempt() {
  const dto = attemptDto({
    testId: null,
    exerciseId: "a",
    mode: "PART_1",
    currentPhase: "PREPARING",
  });
  dto.questions = dto.questions.slice(0, 1);
  Object.assign(dto.questions[0], {
    part: 1,
    readingSeconds: 0,
    preparationSeconds: 45,
    responseSeconds: 45,
    content: { part: 1, passage },
  });
  return parseAttempt(dto);
}

beforeEach(() => {
  recorder.current.recordings = {};
  vi.mocked(getSpeakingEvaluationAvailability).mockResolvedValue(true);
  vi.mocked(getSpeakingExercise).mockResolvedValue(summary("a"));
  vi.mocked(getSpeakingExercises).mockResolvedValue([
    summary("a"),
    summary("b"),
  ]);
  vi.mocked(startSpeakingExercisePractice).mockResolvedValue(
    readAloudAttempt(),
  );
  vi.mocked(submitSpeakingAttempt).mockResolvedValue(readAloudAttempt());
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("SpeakingPracticeEntry", () => {
  it("keeps Parts with hidden questions on the timed run", async () => {
    vi.mocked(getSpeakingExercise).mockResolvedValue(summary("a", 3));
    render(<SpeakingPracticeEntry exerciseId="a" />);

    expect(await screen.findByText("Timed session")).toBeInTheDocument();
    expect(startSpeakingExercisePractice).not.toHaveBeenCalled();
  });

  it("shows the exercise and closes the attempt used to read it", async () => {
    render(<SpeakingPracticeEntry exerciseId="a" />);

    expect(await screen.findByText(passage)).toBeInTheDocument();
    expect(screen.getByText(/Bài 01 \/ 02/)).toBeInTheDocument();
    expect(screen.getByText("8 từ · Dễ")).toBeInTheDocument();
    expect(
      screen.getByText("Welcome to the tour, / everyone. //"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Bài tiếp theo →" }),
    ).toHaveAttribute("href", "/speaking/exercises/b/practice");
    expect(submitSpeakingAttempt).toHaveBeenCalledOnce();
  });

  it("needs a take and consent before sending to AI", async () => {
    recorder.current.recordings = {
      1: { blob: new Blob(["x"]), url: "blob:1", durationSeconds: 12 },
    };
    vi.mocked(submitPracticeTake).mockResolvedValue("attempt-1");
    render(<SpeakingPracticeEntry exerciseId="a" />);

    const button = await screen.findByRole("button", {
      name: "Gửi bài luyện này chấm AI →",
    });
    expect(button).toBeDisabled();
    fireEvent.click(await screen.findByRole("checkbox"));
    await vi.waitFor(() => expect(button).toBeEnabled());
    fireEvent.click(button);

    await vi.waitFor(() =>
      expect(push).toHaveBeenCalledWith("/speaking/attempts/attempt-1"),
    );
  });

  it("offers login when a guest has used the daily evaluation", async () => {
    recorder.current.recordings = {
      1: { blob: new Blob(["x"]), url: "blob:1", durationSeconds: 12 },
    };
    vi.mocked(submitPracticeTake).mockRejectedValue(
      new SpeakingApiError(
        409,
        "Phiên ẩn danh đã dùng lượt chấm AI trong 24 giờ qua.",
      ),
    );
    render(<SpeakingPracticeEntry exerciseId="a" />);

    const button = await screen.findByRole("button", {
      name: "Gửi bài luyện này chấm AI →",
    });
    fireEvent.click(await screen.findByRole("checkbox"));
    await vi.waitFor(() => expect(button).toBeEnabled());
    fireEvent.click(button);

    expect(
      await screen.findByRole("link", { name: "Đăng nhập →" }),
    ).toHaveAttribute(
      "href",
      "/login?next=%2Fspeaking%2Fexercises%2Fa%2Fpractice",
    );
  });
});
