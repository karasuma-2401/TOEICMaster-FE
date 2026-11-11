import {
  grantSpeakingEvaluationConsent,
  nextSpeakingPhase,
  startSpeakingExercisePractice,
  submitSpeakingAttempt,
  uploadSpeakingRecording,
} from "./api";
import { SpeakingApiError } from "./http";

/** The backend refuses consent while a locked answer can still be uploaded. */
const recordingGraceMilliseconds = 15_000;
const graceMarginMilliseconds = 500;

const sleep = (milliseconds: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));

export interface PracticeTake {
  blob: Blob;
  durationSeconds: number;
}

/**
 * Sends a take recorded in free practice for AI grading. The backend only
 * accepts a recording during an attempt's response phase, so this opens a new
 * attempt, moves it there, uploads, submits and waits out the upload grace
 * period before consenting. Returns the attempt id.
 */
export async function submitPracticeTake(
  exerciseId: string,
  take: PracticeTake,
  wait: (milliseconds: number) => Promise<void> = sleep,
) {
  let attempt = await startSpeakingExercisePractice(exerciseId);
  for (
    let step = 0;
    step < 3 &&
    attempt.status === "IN_PROGRESS" &&
    attempt.currentPhase !== "RESPONDING";
    step += 1
  )
    attempt = await nextSpeakingPhase(attempt.id);

  const position = attempt.currentQuestionPosition;
  const question = attempt.questions.find((item) => item.position === position);
  if (attempt.currentPhase !== "RESPONDING" || !question)
    throw new SpeakingApiError(409, "Không thể mở lượt gửi bản thu.");

  await uploadSpeakingRecording(
    attempt.id,
    question.position,
    take.blob,
    Math.min(take.durationSeconds, question.responseSeconds),
  );
  attempt = await submitSpeakingAttempt(attempt.id);

  const lockedAt = attempt.questions.find(
    (item) => item.position === question.position,
  )?.lockedAtUtc;
  const remaining = lockedAt
    ? Date.parse(lockedAt) +
      recordingGraceMilliseconds -
      Date.parse(attempt.serverNowUtc)
    : recordingGraceMilliseconds;
  await wait(Math.max(0, remaining) + graceMarginMilliseconds);

  await grantSpeakingEvaluationConsent(attempt.id);
  return attempt.id;
}
