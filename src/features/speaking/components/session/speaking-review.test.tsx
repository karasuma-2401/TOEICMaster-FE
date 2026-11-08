// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getSpeakingAttempt } from "@/features/speaking/api";
import { parseAttempt } from "@/features/speaking/attempt";
import {
  attemptDto,
  evaluationDto,
} from "@/features/speaking/testing/fixtures";
import { SpeakingReview } from "./speaking-review";

vi.mock("@/features/speaking/api", () => ({
  getSpeakingAttempt: vi.fn(),
  recordingUrl: () => "/recording",
}));
afterEach(cleanup);

const attempt = (evaluation: object | null) =>
  parseAttempt(
    attemptDto({
      status: "SUBMITTED",
      currentQuestionPosition: null,
      currentPhase: null,
      phaseEndsAtUtc: null,
      evaluation,
    }),
  );

describe("SpeakingReview", () => {
  it("shows one question's transcript, flagged words and scores", async () => {
    vi.mocked(getSpeakingAttempt).mockResolvedValue(attempt(evaluationDto()));
    render(<SpeakingReview attemptId="a" position={1} />);

    expect(await screen.findByText("conference")).toHaveClass("sp-word-issue");
    expect(screen.getByText("2/3 điểm")).toBeInTheDocument();
    expect(screen.getByText("Nhận xét câu 1.")).toBeInTheDocument();
  });

  it("explains an answer without recognised speech", async () => {
    vi.mocked(getSpeakingAttempt).mockResolvedValue(attempt(evaluationDto()));
    render(<SpeakingReview attemptId="a" position={3} />);

    expect(
      await screen.findByText("Không nhận diện được giọng nói trong bản ghi."),
    ).toBeInTheDocument();
  });

  it("works for attempts that were never sent to AI", async () => {
    vi.mocked(getSpeakingAttempt).mockResolvedValue(attempt(null));
    render(<SpeakingReview attemptId="a" position={1} />);

    expect(await screen.findByText("Bài thu âm của bạn")).toBeInTheDocument();
    expect(screen.queryByText(/Chỉ số AI/)).not.toBeInTheDocument();
  });
});
