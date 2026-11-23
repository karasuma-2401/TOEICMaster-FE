import { parseAttempt } from "./attempt";
import { SpeakingApiError, speakingRequest } from "./http";
import {
  invalid,
  isCount,
  isNullableDate,
  isPart,
  isRecord,
  isString,
  parsePage,
} from "./parsers";
import type { SpeakingDifficulty, SpeakingMode, SpeakingPart } from "./types";

// Learner Speaking API through the same-origin BFF `/api/speaking/*`.

const base = "/api/speaking";

export interface SpeakingPartSummary {
  part: SpeakingPart;
  questionCount: number;
  durationSeconds: number;
}

export interface SpeakingTestSummary {
  id: string;
  code: string;
  title: string;
  description: string;
  publishedAtUtc: string | null;
  parts: SpeakingPartSummary[];
}

function parseTestSummary(value: unknown): SpeakingTestSummary {
  const what = "Speaking test";
  if (
    !isRecord(value) ||
    !isString(value.id) ||
    !isString(value.code) ||
    !isString(value.title) ||
    !isString(value.description) ||
    !isNullableDate(value.publishedAtUtc) ||
    !Array.isArray(value.parts)
  )
    invalid(what);
  return {
    id: value.id,
    code: value.code,
    title: value.title,
    description: value.description,
    publishedAtUtc: value.publishedAtUtc,
    parts: value.parts.map((part) => {
      if (
        !isRecord(part) ||
        !isPart(part.part) ||
        !isCount(part.questionCount) ||
        !isCount(part.durationSeconds)
      )
        invalid(what);
      return {
        part: part.part,
        questionCount: part.questionCount,
        durationSeconds: part.durationSeconds,
      };
    }),
  };
}

/** Published bank exercise a learner can practise on its own (Part practice). */
export interface SpeakingExerciseSummary {
  id: string;
  code: string;
  part: SpeakingPart;
  topic: string;
  difficulty: SpeakingDifficulty;
  questionCount: number;
  durationSeconds: number;
  updatedAtUtc: string;
}

const isDifficulty = (value: unknown): value is SpeakingDifficulty =>
  value === "EASY" || value === "MEDIUM" || value === "HARD";

function parseExerciseSummary(value: unknown): SpeakingExerciseSummary {
  const what = "Speaking exercise";
  if (
    !isRecord(value) ||
    !isString(value.id) ||
    !isString(value.code) ||
    !isPart(value.part) ||
    !isString(value.topic) ||
    !isDifficulty(value.difficulty) ||
    !isCount(value.questionCount) ||
    !isCount(value.durationSeconds) ||
    !isString(value.updatedAtUtc)
  )
    invalid(what);
  return {
    id: value.id,
    code: value.code,
    part: value.part,
    topic: value.topic,
    difficulty: value.difficulty,
    questionCount: value.questionCount,
    durationSeconds: value.durationSeconds,
    updatedAtUtc: value.updatedAtUtc,
  };
}

const attemptPath = (attemptId: string) =>
  `${base}/attempts/${encodeURIComponent(attemptId)}`;

export async function getSpeakingTests(signal?: AbortSignal) {
  return parsePage(
    await speakingRequest(`${base}/tests?pageNumber=1&pageSize=50`, {
      signal,
      fallback: "Could not load Speaking tests.",
    }),
    parseTestSummary,
    "Speaking test list",
  ).items;
}

export async function getSpeakingTest(testId: string, signal?: AbortSignal) {
  return parseTestSummary(
    await speakingRequest(`${base}/tests/${encodeURIComponent(testId)}`, {
      signal,
      fallback: "Could not load the Speaking test.",
    }),
  );
}

export async function getSpeakingExercises(
  part: SpeakingPart,
  signal?: AbortSignal,
) {
  return parsePage(
    await speakingRequest(
      `${base}/exercises?part=${part}&pageNumber=1&pageSize=100`,
      { signal, fallback: "Could not load Speaking exercises." },
    ),
    parseExerciseSummary,
    "Speaking exercise list",
  ).items;
}

export async function getSpeakingExercise(
  exerciseId: string,
  signal?: AbortSignal,
) {
  return parseExerciseSummary(
    await speakingRequest(
      `${base}/exercises/${encodeURIComponent(exerciseId)}`,
      { signal, fallback: "Could not load the Speaking exercise." },
    ),
  );
}

/** Practises one published exercise on its own; the mode is its Part. */
export async function startSpeakingExercisePractice(exerciseId: string) {
  return parseAttempt(
    await speakingRequest(`${base}/attempts`, {
      method: "POST",
      json: { exerciseId },
      fallback: "Could not start the Speaking practice session.",
    }),
  );
}

export async function startSpeakingAttempt(testId: string, mode: SpeakingMode) {
  return parseAttempt(
    await speakingRequest(`${base}/attempts`, {
      method: "POST",
      json: { testId, mode },
      fallback: "Could not start the Speaking attempt.",
    }),
  );
}

/** One finished or running attempt of the current learner. */
export interface SpeakingAttemptSummary {
  id: string;
  testId: string | null;
  /** Exercise practised on its own; null for test attempts. */
  exerciseId: string | null;
  testCode: string;
  testTitle: string;
  mode: string | null;
  /** Answers with a saved recording; null when the backend omits it. */
  recordedCount: number | null;
  questionCount: number;
  status: string;
  createdAtUtc: string;
  updatedAtUtc: string | null;
  submittedAtUtc: string | null;
  evaluationStatus: string | null;
  estimatedScore: number | null;
}

function parseAttemptSummary(value: unknown): SpeakingAttemptSummary {
  const what = "Speaking history";
  if (
    !isRecord(value) ||
    !isString(value.id) ||
    !(value.testId === null || isString(value.testId)) ||
    !isString(value.status) ||
    !isString(value.createdAtUtc) ||
    !(
      value.estimatedScore === undefined ||
      value.estimatedScore === null ||
      isCount(value.estimatedScore)
    )
  )
    invalid(what);
  return {
    id: value.id,
    testId: value.testId,
    exerciseId: isString(value.exerciseId) ? value.exerciseId : null,
    testCode: isString(value.testCode) ? value.testCode : "",
    testTitle: isString(value.testTitle) ? value.testTitle : "",
    mode: isString(value.mode) ? value.mode : null,
    recordedCount: isCount(value.recordedCount) ? value.recordedCount : null,
    questionCount: isCount(value.questionCount) ? value.questionCount : 0,
    status: value.status,
    createdAtUtc: value.createdAtUtc,
    updatedAtUtc: isString(value.updatedAtUtc) ? value.updatedAtUtc : null,
    submittedAtUtc: isString(value.submittedAtUtc)
      ? value.submittedAtUtc
      : null,
    evaluationStatus: isString(value.evaluationStatus)
      ? value.evaluationStatus
      : null,
    estimatedScore: value.estimatedScore ?? null,
  };
}

export async function getSpeakingAttempts(signal?: AbortSignal) {
  return parsePage(
    await speakingRequest(`${base}/attempts`, {
      signal,
      fallback: "Could not load Speaking history.",
    }),
    parseAttemptSummary,
    "Speaking history",
  ).items;
}

export async function getSpeakingAttempt(
  attemptId: string,
  signal?: AbortSignal,
) {
  return parseAttempt(
    await speakingRequest(attemptPath(attemptId), {
      signal,
      fallback: "Could not load the Speaking attempt.",
    }),
  );
}

/** Ends the current phase early (start speaking now / finish this answer). */
export async function nextSpeakingPhase(attemptId: string) {
  return parseAttempt(
    await speakingRequest(`${attemptPath(attemptId)}/next`, {
      method: "POST",
      json: {},
      fallback: "Could not advance to the next step.",
    }),
  );
}

/** Submits the attempt now; idempotent once it is submitted. */
export async function submitSpeakingAttempt(attemptId: string) {
  return parseAttempt(
    await speakingRequest(`${attemptPath(attemptId)}/submit`, {
      method: "POST",
      json: {},
      fallback: "Could not submit the Speaking attempt.",
    }),
  );
}

export async function uploadSpeakingRecording(
  attemptId: string,
  position: number,
  recording: Blob,
  durationSeconds: number,
) {
  if (recording.size === 0)
    throw new SpeakingApiError(
      400,
      "Recording is empty and cannot be uploaded.",
    );
  const form = new FormData();
  form.set("file", recording, `answer-${position}`);
  form.set("durationSeconds", String(durationSeconds));
  return parseAttempt(
    await speakingRequest(`${attemptPath(attemptId)}/recordings/${position}`, {
      method: "PUT",
      form,
      fallback: "Could not upload the recording.",
    }),
  );
}

/** Whether the backend has Azure Speech and the language model configured. */
export async function getSpeakingEvaluationAvailability(signal?: AbortSignal) {
  const value = await speakingRequest(`${base}/evaluation-availability`, {
    signal,
    fallback: "Could not check AI evaluation availability.",
  });
  if (!isRecord(value) || typeof value.available !== "boolean")
    invalid("AI evaluation availability status");
  return value.available;
}

/**
 * Consents to sending the recordings to Azure Speech and the transcripts to the
 * language model, and queues the AI evaluation. Retries a failed one.
 */
export async function grantSpeakingEvaluationConsent(attemptId: string) {
  return parseAttempt(
    await speakingRequest(`${attemptPath(attemptId)}/evaluation-consent`, {
      method: "POST",
      json: { accepted: true },
      fallback: "Could not request AI evaluation right now.",
    }),
  );
}

export function recordingUrl(attemptId: string, position: number) {
  return `${attemptPath(attemptId)}/recordings/${position}`;
}
