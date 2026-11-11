import { LISTENING_LAST, LR_TOTAL_QUESTIONS } from "./parts";
import type {
  LrAnswers,
  LrFlags,
  LrPartResult,
  LrQuestionGroup,
  LrReviewStatus,
} from "./types";

export type PaletteSlotState = "answered" | "current" | "unanswered";

export interface PaletteContext {
  answers: LrAnswers;
  flags: LrFlags;
  /** Question numbers of the group currently on screen. */
  currentNumbers: readonly number[];
}

export function slotState(number: number, context: PaletteContext) {
  const state: PaletteSlotState = context.currentNumbers.includes(number)
    ? "current"
    : context.answers[number]
      ? "answered"
      : "unanswered";
  return { state, flagged: Boolean(context.flags[number]) };
}

export function range(first: number, last: number): number[] {
  return Array.from({ length: last - first + 1 }, (_, index) => first + index);
}

export interface SubmissionSummary {
  total: number;
  answered: number;
  listeningAnswered: number;
  readingAnswered: number;
  missing: number[];
}

export function summarizeSubmission(
  answers: LrAnswers,
  total: number = LR_TOTAL_QUESTIONS,
): SubmissionSummary {
  const numbers = range(1, total);
  const missing = numbers.filter((number) => !answers[number]);
  const listeningAnswered = range(1, Math.min(LISTENING_LAST, total)).filter(
    (number) => answers[number],
  ).length;
  const answered = total - missing.length;
  return {
    total,
    answered,
    listeningAnswered,
    readingAnswered: answered - listeningAnswered,
    missing,
  };
}

/** Lists missing numbers, shortening very long lists with an ellipsis. */
export function formatMissingList(missing: readonly number[], limit = 24) {
  if (missing.length <= limit) return missing.join(", ");
  return `${missing.slice(0, limit).join(", ")}, … (+${missing.length - limit})`;
}

/** `mm:ss`, or `h:mm:ss` style `hh:mm:ss` once an hour or more is left. */
export function formatCountdown(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  const pad = (value: number) => value.toString().padStart(2, "0");
  return hours > 0
    ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;
}

/** Vietnamese wording for the time left, e.g. `14 phút 25 giây`. */
export function formatRemainingText(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes} phút ${seconds} giây`;
}

export function percent(correct: number, total: number) {
  return total === 0 ? 0 : Math.round((correct / total) * 100);
}

export function sumCorrect(parts: readonly LrPartResult[]) {
  return parts.reduce((sum, part) => sum + part.correct, 0);
}

export function findGroup(
  groups: readonly LrQuestionGroup[],
  number: number,
): LrQuestionGroup | undefined {
  return groups.find((group) => number >= group.first && number <= group.last);
}

export function reviewStatusCounts(
  statusOf: (number: number) => LrReviewStatus,
  total: number = LR_TOTAL_QUESTIONS,
) {
  const counts: Record<LrReviewStatus, number> = {
    correct: 0,
    wrong: 0,
    skipped: 0,
  };
  for (const number of range(1, total)) counts[statusOf(number)] += 1;
  return counts;
}
