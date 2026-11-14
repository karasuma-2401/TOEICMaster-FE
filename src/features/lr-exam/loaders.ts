import {
  demoExam,
  demoGroups,
  demoListeningAnswers,
  demoListeningFlags,
  demoResult,
  demoReviewFlags,
  demoReviewGroups,
  demoReviewStatus,
  demoReadingAnswers,
  demoReadingFlags,
} from "./demo-data";
import { sectionForQuestion } from "./parts";
import { range, reviewStatusCounts } from "./session";
import type {
  LrAnswers,
  LrExamSummary,
  LrFlags,
  LrQuestionGroup,
  LrResultReport,
  LrReviewGroup,
  LrReviewStatus,
} from "./types";

/** Seconds left when the room opens, per scenario. */
const LISTENING_REMAINING_SECONDS = 38 * 60 + 24;
const READING_REMAINING_SECONDS = 60 * 60 + 45 * 60 + 12;

export interface LrRoomState {
  exam: LrExamSummary;
  groups: LrQuestionGroup[];
  initialNumber: number;
  initialAnswers: LrAnswers;
  initialFlags: LrFlags;
  initialRemainingSeconds: number;
  attemptId?: string;
  phase?: "listening" | "reading";
  questionIds?: Record<number, string>;
  masterAudioObjectKey?: string | null;
}

export function loadExamSummary(_examId: string): LrExamSummary {
  return demoExam;
}

export function loadRoomState(
  _examId: string,
  requestedNumber?: number,
): LrRoomState {
  const reading =
    requestedNumber !== undefined &&
    Number.isInteger(requestedNumber) &&
    sectionForQuestion(requestedNumber) === "reading" &&
    requestedNumber <= 200;
  return {
    exam: demoExam,
    groups: demoGroups,
    initialNumber: reading ? requestedNumber : 32,
    initialAnswers: reading ? demoReadingAnswers : demoListeningAnswers,
    initialFlags: reading ? demoReadingFlags : demoListeningFlags,
    initialRemainingSeconds: reading
      ? READING_REMAINING_SECONDS
      : LISTENING_REMAINING_SECONDS,
    phase: reading ? "reading" : "listening",
  };
}

export function loadResult(_attemptId: string): LrResultReport {
  return demoResult;
}

export interface LrReviewState {
  exam: LrExamSummary;
  groups: LrReviewGroup[];
  /** Status per question number (serializable for client components). */
  statuses: Record<number, LrReviewStatus>;
  counts: Record<LrReviewStatus, number>;
  flags: LrFlags;
}

export function loadReview(_attemptId: string): LrReviewState {
  const statuses = Object.fromEntries(
    range(1, 200).map((number) => [number, demoReviewStatus(number)]),
  );
  return {
    exam: demoExam,
    groups: demoReviewGroups,
    statuses,
    counts: reviewStatusCounts((number) => statuses[number]),
    flags: demoReviewFlags,
  };
}
