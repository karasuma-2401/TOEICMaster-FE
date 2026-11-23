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
  getSpeakingAttempts: vi.fn().mockResolvedValue([]),
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
    const evalData = evaluationDto();
    vi.mocked(getSpeakingAttempt).mockResolvedValue(attempt(evalData));
    render(<SpeakingReview attemptId="a" position={1} />);

    expect(await screen.findByText("conference")).toHaveClass("sp-word-issue");
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
    expect(screen.getByText(evalData.items[0].feedback)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /attempt history/i }),
    ).toHaveAttribute("href", "/history");
  });

  it("explains an answer without recognised speech", async () => {
    vi.mocked(getSpeakingAttempt).mockResolvedValue(attempt(evaluationDto()));
    render(<SpeakingReview attemptId="a" position={3} />);

    expect(
      await screen.findByText("No speech detected in the recording."),
    ).toBeInTheDocument();
  });

  it("works for attempts that were never sent to AI", async () => {
    vi.mocked(getSpeakingAttempt).mockResolvedValue(attempt(null));
    render(<SpeakingReview attemptId="a" position={1} />);

    expect(await screen.findByText("Your recording")).toBeInTheDocument();
    expect(screen.queryByText(/AI Metrics/)).not.toBeInTheDocument();
  });
});
