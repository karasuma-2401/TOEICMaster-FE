import { afterEach, describe, expect, it, vi } from "vitest";
import {
  grantSpeakingEvaluationConsent,
  nextSpeakingPhase,
  startSpeakingExercisePractice,
  submitSpeakingAttempt,
  uploadSpeakingRecording,
} from "./api";
import { parseAttempt, type SpeakingAttempt } from "./attempt";
import { submitPracticeTake } from "./practice-submission";
import { attemptDto } from "./testing/fixtures";

vi.mock("./api", () => ({
  grantSpeakingEvaluationConsent: vi.fn(),
  nextSpeakingPhase: vi.fn(),
  startSpeakingExercisePractice: vi.fn(),
  submitSpeakingAttempt: vi.fn(),
  uploadSpeakingRecording: vi.fn(),
}));
afterEach(() => vi.resetAllMocks());

function attempt(overrides: object, lockedAtUtc: string | null = null) {
  const dto = attemptDto({ testId: null, exerciseId: "e", ...overrides });
  dto.questions = dto.questions.slice(0, 1);
  dto.questions[0].responseSeconds = 45;
  dto.questions[0].lockedAtUtc = lockedAtUtc as never;
  return parseAttempt(dto);
}

const preparing = attempt({ currentPhase: "PREPARING" });
const responding = attempt({ currentPhase: "RESPONDING" });
const submitted: SpeakingAttempt = attempt(
  {
    status: "SUBMITTED",
    currentQuestionPosition: null,
    currentPhase: null,
    phaseEndsAtUtc: null,
    serverNowUtc: "2026-10-23T10:00:05Z",
  },
  "2026-10-23T10:00:00Z",
);
const take = { blob: new Blob(["x"]), durationSeconds: 47 };

describe("submitPracticeTake", () => {
  it("uploads during the response phase and consents after the grace period", async () => {
    vi.mocked(startSpeakingExercisePractice).mockResolvedValue(preparing);
    vi.mocked(nextSpeakingPhase).mockResolvedValue(responding);
    vi.mocked(submitSpeakingAttempt).mockResolvedValue(submitted);
    const wait = vi.fn().mockResolvedValue(undefined);

    await expect(submitPracticeTake("e", take, wait)).resolves.toBe(
      submitted.id,
    );

    expect(uploadSpeakingRecording).toHaveBeenCalledWith(
      responding.id,
      1,
      take.blob,
      45,
    );
    expect(wait).toHaveBeenCalledWith(10_500);
    expect(grantSpeakingEvaluationConsent).toHaveBeenCalledWith(submitted.id);
    expect(
      vi.mocked(uploadSpeakingRecording).mock.invocationCallOrder[0],
    ).toBeLessThan(
      vi.mocked(submitSpeakingAttempt).mock.invocationCallOrder[0],
    );
  });

  it("does not consent when the upload is refused", async () => {
    vi.mocked(startSpeakingExercisePractice).mockResolvedValue(responding);
    vi.mocked(uploadSpeakingRecording).mockRejectedValue(new Error("full"));

    await expect(submitPracticeTake("e", take, vi.fn())).rejects.toThrow(
      "full",
    );
    expect(grantSpeakingEvaluationConsent).not.toHaveBeenCalled();
  });
});
