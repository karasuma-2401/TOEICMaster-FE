import {
  invalid,
  isCount,
  isDate,
  isMode,
  isNullableDate,
  isPart,
  isRecord,
  isString,
  parseContent,
} from "./parsers";
import type { SpeakingContent, SpeakingMode, SpeakingPart } from "./types";

export type SpeakingAttemptStatus = "IN_PROGRESS" | "SUBMITTED";
export type SpeakingPhase = "READING" | "PREPARING" | "RESPONDING";

export interface SpeakingAttemptQuestion {
  position: number;
  part: SpeakingPart;
  questionIndex: number;
  readingSeconds: number;
  preparationSeconds: number;
  responseSeconds: number;
  lockedAtUtc: string | null;
  recording: { durationSeconds: number; uploadedAtUtc: string } | null;
  content: SpeakingContent;
}

export interface SpeakingReviewQuestion {
  position: number;
  rubricNotes: string;
  modelAnswer: string;
}

export interface SpeakingAttempt {
  id: string;
  testId: string;
  testCode: string;
  testTitle: string;
  mode: SpeakingMode;
  status: SpeakingAttemptStatus;
  currentQuestionPosition: number | null;
  currentPhase: SpeakingPhase | null;
  phaseEndsAtUtc: string | null;
  serverNowUtc: string;
  createdAtUtc: string;
  submittedAtUtc: string | null;
  questions: SpeakingAttemptQuestion[];
  reviewQuestions: SpeakingReviewQuestion[];
}

const what = "lượt làm Speaking";
const isPhase = (value: unknown): value is SpeakingPhase =>
  value === "READING" || value === "PREPARING" || value === "RESPONDING";

function parseQuestion(value: unknown): SpeakingAttemptQuestion {
  if (
    !isRecord(value) ||
    !isCount(value.position) ||
    !isPart(value.part) ||
    !isCount(value.questionIndex) ||
    !isCount(value.readingSeconds) ||
    !isCount(value.preparationSeconds) ||
    !isCount(value.responseSeconds) ||
    !isNullableDate(value.lockedAtUtc)
  )
    invalid(what);
  const recording = value.recording;
  if (!(
    recording === null ||
    (isRecord(recording) &&
      isCount(recording.durationSeconds) &&
      isDate(recording.uploadedAtUtc))
  ))
    invalid(what);
  const content = parseContent(value.content, "public", what);
  if (content.part !== value.part) invalid(what);
  return {
    position: value.position,
    part: value.part,
    questionIndex: value.questionIndex,
    readingSeconds: value.readingSeconds,
    preparationSeconds: value.preparationSeconds,
    responseSeconds: value.responseSeconds,
    lockedAtUtc: value.lockedAtUtc,
    recording: recording as SpeakingAttemptQuestion["recording"],
    content,
  };
}

export function parseAttempt(value: unknown): SpeakingAttempt {
  if (
    !isRecord(value) ||
    !isString(value.id) ||
    !isString(value.testId) ||
    !isString(value.testCode) ||
    !isString(value.testTitle) ||
    !isMode(value.mode) ||
    !(value.status === "IN_PROGRESS" || value.status === "SUBMITTED") ||
    !(
      value.currentQuestionPosition === null ||
      isCount(value.currentQuestionPosition)
    ) ||
    !(value.currentPhase === null || isPhase(value.currentPhase)) ||
    !isNullableDate(value.phaseEndsAtUtc) ||
    !isDate(value.serverNowUtc) ||
    !isDate(value.createdAtUtc) ||
    !isNullableDate(value.submittedAtUtc) ||
    !Array.isArray(value.questions) ||
    !Array.isArray(value.reviewQuestions)
  )
    invalid(what);
  return {
    id: value.id,
    testId: value.testId,
    testCode: value.testCode,
    testTitle: value.testTitle,
    mode: value.mode,
    status: value.status,
    currentQuestionPosition: value.currentQuestionPosition,
    currentPhase: value.currentPhase,
    phaseEndsAtUtc: value.phaseEndsAtUtc,
    serverNowUtc: value.serverNowUtc,
    createdAtUtc: value.createdAtUtc,
    submittedAtUtc: value.submittedAtUtc,
    questions: value.questions.map(parseQuestion),
    reviewQuestions: value.reviewQuestions.map((item) => {
      if (
        !isRecord(item) ||
        !isCount(item.position) ||
        !isString(item.rubricNotes) ||
        !isString(item.modelAnswer)
      )
        invalid(what);
      return {
        position: item.position,
        rubricNotes: item.rubricNotes,
        modelAnswer: item.modelAnswer,
      };
    }),
  };
}

export function currentQuestion(attempt: SpeakingAttempt) {
  return (
    attempt.questions.find(
      (question) => question.position === attempt.currentQuestionPosition,
    ) ?? null
  );
}

/** Seconds left in the current phase using the server clock offset. */
export function phaseSecondsLeft(
  attempt: SpeakingAttempt,
  clientNow: number,
  serverOffset: number,
) {
  if (!attempt.phaseEndsAtUtc) return 0;
  return Math.max(
    0,
    Math.ceil(
      (Date.parse(attempt.phaseEndsAtUtc) - (clientNow + serverOffset)) / 1000,
    ),
  );
}

export function phaseLength(
  question: SpeakingAttemptQuestion,
  phase: SpeakingPhase,
) {
  return phase === "READING"
    ? question.readingSeconds
    : phase === "PREPARING"
      ? question.preparationSeconds
      : question.responseSeconds;
}
