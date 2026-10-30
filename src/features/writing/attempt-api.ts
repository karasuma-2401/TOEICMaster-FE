import { getJson } from "@/shared/api/client";

export type AttemptMode = "FULL" | "PART_1" | "PART_2" | "PART_3";
export type AttemptStatus = "IN_PROGRESS" | "SUBMITTED_AWAITING_EVALUATION";
export type AttemptPhase = "PREPARING" | "ANSWERING";
export type EvaluationStatus =
  | "CONSENT_REQUIRED"
  | "QUEUED"
  | "PROCESSING"
  | "RETRYING"
  | "COMPLETED"
  | "FAILED";

export interface WritingPartSummary {
  part: 1 | 2 | 3;
  questionCount: number;
  preparationSeconds: number;
  responseSeconds: number;
}

export interface WritingTestSummaryApi {
  id: string;
  code: string;
  title: string;
  description: string;
  parts: WritingPartSummary[];
  publishedAtUtc: string;
}

export interface WritingTestPageApi {
  items: WritingTestSummaryApi[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface WritingAttemptQuestionApi {
  position: number;
  part: 1 | 2 | 3;
  preparationSeconds: number;
  responseSeconds: number;
  imageUrl: string | null;
  imageAlt: string | null;
  keywordOne: string | null;
  keywordTwo: string | null;
  sender: string | null;
  recipient: string | null;
  subject: string | null;
  emailBody: string | null;
  directions: string | null;
  prompt: string | null;
  minimumWordCount: number | null;
  outline: string | null;
  answer: string;
  lastSavedAtUtc: string | null;
  lockedAtUtc: string | null;
}

export interface WritingEvaluationFeedbackApi {
  questionPosition: number;
  criterionScore: number;
  feedback: string;
  suggestedRevision: string;
}

export interface WritingAttemptReviewQuestionApi {
  position: number;
  modelAnswer: string;
}

export interface WritingEvaluationApi {
  status: EvaluationStatus;
  estimatedScore: number | null;
  summary: string | null;
  strengths: string[];
  improvements: string[];
  feedback: WritingEvaluationFeedbackApi[];
  provider: string;
  model: string;
  rubricVersion: string;
  consentAcceptedAtUtc: string | null;
  queuedAtUtc: string | null;
  completedAtUtc: string | null;
  retryCount: number;
  failureMessage: string | null;
}

export interface WritingAttemptApi {
  id: string;
  testId: string;
  testCode: string;
  testTitle: string;
  mode: AttemptMode;
  status: AttemptStatus;
  currentQuestionPosition: number | null;
  currentPhase: AttemptPhase | null;
  phaseEndsAtUtc: string | null;
  serverNowUtc: string;
  createdAtUtc: string;
  submittedAtUtc: string | null;
  questions: WritingAttemptQuestionApi[];
  evaluation: WritingEvaluationApi | null;
  reviewQuestions: WritingAttemptReviewQuestionApi[];
}

export interface WritingAttemptSummaryApi {
  id: string;
  testId: string;
  testCode: string;
  testTitle: string;
  mode: AttemptMode;
  status: AttemptStatus;
  questionCount: number;
  currentQuestionPosition: number | null;
  createdAtUtc: string;
  submittedAtUtc: string | null;
  updatedAtUtc: string;
  evaluationStatus: EvaluationStatus | null;
  estimatedScore: number | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isDate(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function isPart(value: unknown): value is 1 | 2 | 3 {
  return value === 1 || value === 2 || value === 3;
}

function isMode(value: unknown): value is AttemptMode {
  return (
    value === "FULL" ||
    value === "PART_1" ||
    value === "PART_2" ||
    value === "PART_3"
  );
}

function isAttemptStatus(value: unknown): value is AttemptStatus {
  return value === "IN_PROGRESS" || value === "SUBMITTED_AWAITING_EVALUATION";
}

function isEvaluationStatus(value: unknown): value is EvaluationStatus {
  return (
    value === "CONSENT_REQUIRED" ||
    value === "QUEUED" ||
    value === "PROCESSING" ||
    value === "RETRYING" ||
    value === "COMPLETED" ||
    value === "FAILED"
  );
}

function nullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function nullableDate(value: unknown): value is string | null {
  return value === null || isDate(value);
}

function parsePart(value: unknown): WritingPartSummary {
  if (
    !isRecord(value) ||
    !isPart(value.part) ||
    !Number.isInteger(value.questionCount) ||
    !Number.isInteger(value.preparationSeconds) ||
    !Number.isInteger(value.responseSeconds)
  )
    throw new Error("Phản hồi đề Writing không hợp lệ.");
  return {
    part: value.part,
    questionCount: Number(value.questionCount),
    preparationSeconds: Number(value.preparationSeconds),
    responseSeconds: Number(value.responseSeconds),
  };
}

function parseTest(value: unknown): WritingTestSummaryApi {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.code !== "string" ||
    typeof value.title !== "string" ||
    typeof value.description !== "string" ||
    !Array.isArray(value.parts) ||
    !isDate(value.publishedAtUtc)
  )
    throw new Error("Phản hồi đề Writing không hợp lệ.");
  return {
    id: value.id,
    code: value.code,
    title: value.title,
    description: value.description,
    parts: value.parts.map(parsePart),
    publishedAtUtc: value.publishedAtUtc,
  };
}

function parseQuestion(value: unknown): WritingAttemptQuestionApi {
  if (
    !isRecord(value) ||
    !Number.isInteger(value.position) ||
    !isPart(value.part) ||
    !Number.isInteger(value.preparationSeconds) ||
    !Number.isInteger(value.responseSeconds) ||
    !nullableString(value.imageUrl) ||
    !nullableString(value.imageAlt) ||
    !nullableString(value.keywordOne) ||
    !nullableString(value.keywordTwo) ||
    !nullableString(value.sender) ||
    !nullableString(value.recipient) ||
    !nullableString(value.subject) ||
    !nullableString(value.emailBody) ||
    !nullableString(value.directions) ||
    !nullableString(value.prompt) ||
    !(
      value.minimumWordCount === null ||
      Number.isInteger(value.minimumWordCount)
    ) ||
    !nullableString(value.outline) ||
    typeof value.answer !== "string" ||
    !nullableDate(value.lastSavedAtUtc) ||
    !nullableDate(value.lockedAtUtc)
  )
    throw new Error("Phản hồi câu hỏi Writing không hợp lệ.");
  return value as unknown as WritingAttemptQuestionApi;
}

function parseStringList(value: unknown): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string"))
    throw new Error("Phản hồi chấm Writing không hợp lệ.");
  return value as string[];
}

function parseEvaluation(value: unknown): WritingEvaluationApi | null {
  if (value === null || value === undefined) return null;
  if (
    !isRecord(value) ||
    !isEvaluationStatus(value.status) ||
    !(
      value.estimatedScore === null || Number.isInteger(value.estimatedScore)
    ) ||
    !nullableString(value.summary) ||
    !nullableString(value.failureMessage) ||
    !Array.isArray(value.feedback) ||
    typeof value.provider !== "string" ||
    typeof value.model !== "string" ||
    typeof value.rubricVersion !== "string" ||
    !nullableDate(value.consentAcceptedAtUtc) ||
    !nullableDate(value.queuedAtUtc) ||
    !nullableDate(value.completedAtUtc) ||
    !Number.isInteger(value.retryCount)
  )
    throw new Error("Phản hồi chấm Writing không hợp lệ.");
  const feedback = value.feedback.map((item) => {
    if (
      !isRecord(item) ||
      !Number.isInteger(item.questionPosition) ||
      !Number.isInteger(item.criterionScore) ||
      typeof item.feedback !== "string" ||
      typeof item.suggestedRevision !== "string"
    )
      throw new Error("Phản hồi chấm Writing không hợp lệ.");
    return item as unknown as WritingEvaluationFeedbackApi;
  });
  return {
    ...(value as Omit<
      WritingEvaluationApi,
      "strengths" | "improvements" | "feedback"
    >),
    strengths: parseStringList(value.strengths),
    improvements: parseStringList(value.improvements),
    feedback,
  };
}

function parseAttempt(value: unknown): WritingAttemptApi {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.testId !== "string" ||
    typeof value.testCode !== "string" ||
    typeof value.testTitle !== "string" ||
    !isMode(value.mode) ||
    !isAttemptStatus(value.status) ||
    !(
      value.currentQuestionPosition === null ||
      Number.isInteger(value.currentQuestionPosition)
    ) ||
    !(
      value.currentPhase === null ||
      value.currentPhase === "PREPARING" ||
      value.currentPhase === "ANSWERING"
    ) ||
    !nullableDate(value.phaseEndsAtUtc) ||
    !isDate(value.serverNowUtc) ||
    !isDate(value.createdAtUtc) ||
    !nullableDate(value.submittedAtUtc) ||
    !Array.isArray(value.questions) ||
    !Array.isArray(value.reviewQuestions)
  )
    throw new Error("Phản hồi lượt làm Writing không hợp lệ.");
  return {
    ...value,
    questions: value.questions.map(parseQuestion),
    evaluation: parseEvaluation(value.evaluation),
    reviewQuestions: value.reviewQuestions.map((item) => {
      if (
        !isRecord(item) ||
        !Number.isInteger(item.position) ||
        typeof item.modelAnswer !== "string"
      )
        throw new Error("Phản hồi lượt làm Writing không hợp lệ.");
      return item as unknown as WritingAttemptReviewQuestionApi;
    }),
  } as WritingAttemptApi;
}

async function requestJson(path: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(path, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const title =
      isRecord(body) && typeof body.title === "string"
        ? body.title
        : "Không thể xử lý lượt làm Writing.";
    throw new Error(title);
  }
  return response.json() as Promise<unknown>;
}

export async function getWritingTests(
  signal?: AbortSignal,
): Promise<WritingTestPageApi> {
  const value = await getJson<unknown>("/api/writing/tests", signal);
  if (
    !isRecord(value) ||
    !Array.isArray(value.items) ||
    !Number.isInteger(value.pageNumber) ||
    !Number.isInteger(value.pageSize) ||
    !Number.isInteger(value.totalCount) ||
    !Number.isInteger(value.totalPages)
  )
    throw new Error("Phản hồi danh sách đề Writing không hợp lệ.");
  return { ...value, items: value.items.map(parseTest) } as WritingTestPageApi;
}

export async function getWritingTest(testId: string, signal?: AbortSignal) {
  return parseTest(
    await getJson<unknown>(
      `/api/writing/tests/${encodeURIComponent(testId)}`,
      signal,
    ),
  );
}

export async function startWritingAttempt(testId: string, mode: AttemptMode) {
  return parseAttempt(
    await requestJson("/api/writing/attempts", {
      method: "POST",
      body: JSON.stringify({ testId, mode }),
    }),
  );
}

export async function getWritingAttempt(
  attemptId: string,
  signal?: AbortSignal,
) {
  return parseAttempt(
    await getJson<unknown>(
      `/api/writing/attempts/${encodeURIComponent(attemptId)}`,
      signal,
    ),
  );
}

export async function saveWritingAnswer(
  attemptId: string,
  position: number,
  answer: string,
) {
  return parseAttempt(
    await requestJson(
      `/api/writing/attempts/${encodeURIComponent(attemptId)}/answers/${position}`,
      {
        method: "PUT",
        body: JSON.stringify({ answer }),
      },
    ),
  );
}

/**
 * Sends a final best-effort save when a learner backgrounds or leaves the page.
 * The normal autosave still owns the visible state and error handling.
 */
export async function flushWritingAnswerOnPageHide(
  attemptId: string,
  position: number,
  answer: string,
) {
  try {
    await fetch(
      `/api/writing/attempts/${encodeURIComponent(attemptId)}/answers/${position}`,
      {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ answer }),
        cache: "no-store",
        keepalive: true,
      },
    );
  } catch {
    // A page lifecycle request cannot surface an actionable error after unload.
  }
}

export async function nextWritingQuestion(attemptId: string) {
  return parseAttempt(
    await requestJson(
      `/api/writing/attempts/${encodeURIComponent(attemptId)}/next`,
      { method: "POST" },
    ),
  );
}

export async function submitWritingAttempt(attemptId: string) {
  return parseAttempt(
    await requestJson(
      `/api/writing/attempts/${encodeURIComponent(attemptId)}/submit`,
      { method: "POST" },
    ),
  );
}

export async function grantWritingEvaluationConsent(attemptId: string) {
  return parseAttempt(
    await requestJson(
      `/api/writing/attempts/${encodeURIComponent(attemptId)}/evaluation-consent`,
      { method: "POST", body: JSON.stringify({ accepted: true }) },
    ),
  );
}

export async function getWritingHistory(
  signal?: AbortSignal,
): Promise<WritingAttemptSummaryApi[]> {
  const value = await getJson<unknown>("/api/writing/attempts", signal);
  if (!isRecord(value) || !Array.isArray(value.items))
    throw new Error("Phản hồi lịch sử Writing không hợp lệ.");
  return value.items.map((item) => {
    if (
      !isRecord(item) ||
      typeof item.id !== "string" ||
      typeof item.testId !== "string" ||
      typeof item.testCode !== "string" ||
      typeof item.testTitle !== "string" ||
      !isMode(item.mode) ||
      !isAttemptStatus(item.status) ||
      !Number.isInteger(item.questionCount) ||
      !(
        item.currentQuestionPosition === null ||
        Number.isInteger(item.currentQuestionPosition)
      ) ||
      !isDate(item.createdAtUtc) ||
      !nullableDate(item.submittedAtUtc) ||
      !isDate(item.updatedAtUtc) ||
      !(
        item.evaluationStatus === null ||
        isEvaluationStatus(item.evaluationStatus)
      ) ||
      !(item.estimatedScore === null || Number.isInteger(item.estimatedScore))
    )
      throw new Error("Phản hồi lịch sử Writing không hợp lệ.");
    return item as unknown as WritingAttemptSummaryApi;
  });
}

export function modeFromRoute(value: string | undefined): AttemptMode {
  return value === "part-1"
    ? "PART_1"
    : value === "part-2"
      ? "PART_2"
      : value === "part-3"
        ? "PART_3"
        : "FULL";
}

export function displayMode(mode: AttemptMode) {
  return mode === "FULL" ? "Full Writing Test" : `Writing Part ${mode.at(-1)}`;
}
