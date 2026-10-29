import {
  invalid,
  isCount,
  isDate,
  isNullableDate,
  isPart,
  isRecord,
  isString,
} from "./parsers";
import type { SpeakingPart } from "./types";

// AI evaluation of a submitted Speaking attempt: Azure Speech transcribes each
// recording and scores pronunciation, a language model scores grammar,
// vocabulary and relevance, and the server combines them into task scores.

export type SpeakingEvaluationStatus =
  "QUEUED" | "PROCESSING" | "RETRYING" | "COMPLETED" | "FAILED";

export type SpeakingRecognitionStatus =
  "RECOGNIZED" | "NO_SPEECH" | "NO_RECORDING";

export interface SpeakingWordIssue {
  word: string;
  accuracyScore: number;
}

/** One answer: Azure scores (0-100), language-model scores (0-100) and the task score. */
export interface SpeakingEvaluationItem {
  position: number;
  part: SpeakingPart;
  recognitionStatus: SpeakingRecognitionStatus;
  transcript: string;
  accuracyScore: number;
  fluencyScore: number;
  completenessScore: number | null;
  prosodyScore: number | null;
  pronunciationScore: number;
  grammarScore: number | null;
  vocabularyScore: number | null;
  relevanceScore: number | null;
  rawScore: number;
  maxRawScore: number;
  feedback: string;
  suggestedResponse: string | null;
  wordIssues: SpeakingWordIssue[];
}

export interface SpeakingEvaluation {
  status: SpeakingEvaluationStatus;
  estimatedScore: number | null;
  summary: string | null;
  strengths: string[];
  improvements: string[];
  /** Only filled once the evaluation is COMPLETED. */
  items: SpeakingEvaluationItem[];
  speechProvider: string;
  languageProvider: string;
  languageModel: string;
  consentAcceptedAtUtc: string;
  completedAtUtc: string | null;
  retryCount: number;
  failureMessage: string | null;
}

const what = "kết quả chấm AI Speaking";
const statuses: readonly SpeakingEvaluationStatus[] = [
  "QUEUED",
  "PROCESSING",
  "RETRYING",
  "COMPLETED",
  "FAILED",
];
const recognitions: readonly SpeakingRecognitionStatus[] = [
  "RECOGNIZED",
  "NO_SPEECH",
  "NO_RECORDING",
];

const isScore = (value: unknown): value is number =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value >= 0 &&
  value <= 100;
const isNullableScore = (value: unknown): value is number | null =>
  value === null || isScore(value);
const isStrings = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(isString);

/** Polling continues while the job has not reached a final state. */
export function isEvaluationPending(evaluation: SpeakingEvaluation | null) {
  return (
    evaluation?.status === "QUEUED" ||
    evaluation?.status === "PROCESSING" ||
    evaluation?.status === "RETRYING"
  );
}

function parseItem(value: unknown): SpeakingEvaluationItem {
  if (
    !isRecord(value) ||
    !isCount(value.position) ||
    !isPart(value.part) ||
    !recognitions.includes(
      value.recognitionStatus as SpeakingRecognitionStatus,
    ) ||
    !isString(value.transcript) ||
    !isScore(value.accuracyScore) ||
    !isScore(value.fluencyScore) ||
    !isNullableScore(value.completenessScore) ||
    !isNullableScore(value.prosodyScore) ||
    !isScore(value.pronunciationScore) ||
    !isNullableScore(value.grammarScore) ||
    !isNullableScore(value.vocabularyScore) ||
    !isNullableScore(value.relevanceScore) ||
    !isCount(value.rawScore) ||
    !isCount(value.maxRawScore) ||
    value.rawScore > value.maxRawScore ||
    !isString(value.feedback) ||
    !(value.suggestedResponse === null || isString(value.suggestedResponse)) ||
    !Array.isArray(value.wordIssues)
  )
    invalid(what);
  return {
    position: value.position,
    part: value.part,
    recognitionStatus: value.recognitionStatus as SpeakingRecognitionStatus,
    transcript: value.transcript,
    accuracyScore: value.accuracyScore,
    fluencyScore: value.fluencyScore,
    completenessScore: value.completenessScore,
    prosodyScore: value.prosodyScore,
    pronunciationScore: value.pronunciationScore,
    grammarScore: value.grammarScore,
    vocabularyScore: value.vocabularyScore,
    relevanceScore: value.relevanceScore,
    rawScore: value.rawScore,
    maxRawScore: value.maxRawScore,
    feedback: value.feedback,
    suggestedResponse: value.suggestedResponse,
    wordIssues: value.wordIssues.map((issue) => {
      if (
        !isRecord(issue) ||
        !isString(issue.word) ||
        !isScore(issue.accuracyScore)
      )
        invalid(what);
      return { word: issue.word, accuracyScore: issue.accuracyScore };
    }),
  };
}

/** `undefined` (older backend) and `null` both mean no evaluation was requested. */
export function parseEvaluation(value: unknown): SpeakingEvaluation | null {
  if (value === undefined || value === null) return null;
  if (
    !isRecord(value) ||
    !statuses.includes(value.status as SpeakingEvaluationStatus) ||
    !(
      value.estimatedScore === null ||
      (isCount(value.estimatedScore) && value.estimatedScore <= 200)
    ) ||
    !(value.summary === null || isString(value.summary)) ||
    !isStrings(value.strengths) ||
    !isStrings(value.improvements) ||
    !Array.isArray(value.items) ||
    !isString(value.speechProvider) ||
    !isString(value.languageProvider) ||
    !isString(value.languageModel) ||
    !isDate(value.consentAcceptedAtUtc) ||
    !isNullableDate(value.completedAtUtc) ||
    !isCount(value.retryCount) ||
    !(value.failureMessage === null || isString(value.failureMessage))
  )
    invalid(what);
  return {
    status: value.status as SpeakingEvaluationStatus,
    estimatedScore: value.estimatedScore,
    summary: value.summary,
    strengths: value.strengths,
    improvements: value.improvements,
    items: value.items.map(parseItem),
    speechProvider: value.speechProvider,
    languageProvider: value.languageProvider,
    languageModel: value.languageModel,
    consentAcceptedAtUtc: value.consentAcceptedAtUtc,
    completedAtUtc: value.completedAtUtc,
    retryCount: value.retryCount,
    failureMessage: value.failureMessage,
  };
}
