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
import type { SpeakingMode, SpeakingPart } from "./types";

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
  const what = "đề Speaking";
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

const attemptPath = (attemptId: string) =>
  `${base}/attempts/${encodeURIComponent(attemptId)}`;

export async function getSpeakingTests(signal?: AbortSignal) {
  return parsePage(
    await speakingRequest(`${base}/tests?pageNumber=1&pageSize=50`, {
      signal,
      fallback: "Không thể tải đề Speaking.",
    }),
    parseTestSummary,
    "danh sách đề Speaking",
  ).items;
}

export async function getSpeakingTest(testId: string, signal?: AbortSignal) {
  return parseTestSummary(
    await speakingRequest(`${base}/tests/${encodeURIComponent(testId)}`, {
      signal,
      fallback: "Không thể tải đề Speaking.",
    }),
  );
}

export async function startSpeakingAttempt(testId: string, mode: SpeakingMode) {
  return parseAttempt(
    await speakingRequest(`${base}/attempts`, {
      method: "POST",
      json: { testId, mode },
      fallback: "Không thể bắt đầu lượt làm Speaking.",
    }),
  );
}

export async function getSpeakingAttempt(
  attemptId: string,
  signal?: AbortSignal,
) {
  return parseAttempt(
    await speakingRequest(attemptPath(attemptId), {
      signal,
      fallback: "Không thể tải lượt làm Speaking.",
    }),
  );
}

/** Ends the current phase early (start speaking now / finish this answer). */
export async function nextSpeakingPhase(attemptId: string) {
  return parseAttempt(
    await speakingRequest(`${attemptPath(attemptId)}/next`, {
      method: "POST",
      json: {},
      fallback: "Không thể chuyển sang bước tiếp theo.",
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
    throw new SpeakingApiError(400, "Bản ghi trống, không thể tải lên.");
  const form = new FormData();
  form.set("file", recording, `answer-${position}`);
  form.set("durationSeconds", String(durationSeconds));
  return parseAttempt(
    await speakingRequest(`${attemptPath(attemptId)}/recordings/${position}`, {
      method: "PUT",
      form,
      fallback: "Không thể tải bản ghi lên.",
    }),
  );
}

export function recordingUrl(attemptId: string, position: number) {
  return `${attemptPath(attemptId)}/recordings/${position}`;
}
