import { refreshSession } from "@/features/auth/api";

export class LrApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "LrApiError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function requiredString(value: unknown, message: string): string {
  if (typeof value !== "string") throw new LrApiError(502, message);
  return value;
}

function requiredNumber(value: unknown, message: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new LrApiError(502, message);
  }
  return value;
}

function nullableString(value: unknown): string | null {
  return value === null || value === undefined
    ? null
    : requiredString(value, "Invalid L&R response.");
}

function nullableNumber(value: unknown): number | null {
  return value === null || value === undefined
    ? null
    : requiredNumber(value, "Invalid L&R response.");
}

async function refreshOnce() {
  if (typeof navigator !== "undefined" && navigator.locks) {
    await navigator.locks.request("toeicmaster-refresh", () =>
      refreshSession(),
    );
    return;
  }
  await refreshSession();
}

export async function lrRequest(
  path: string,
  options: {
    method?: "GET" | "POST" | "PUT";
    body?: unknown;
    signal?: AbortSignal;
  } = {},
): Promise<unknown> {
  const send = () =>
    fetch(path, {
      method: options.method ?? "GET",
      headers: {
        Accept: "application/json",
        ...(options.body !== undefined
          ? { "Content-Type": "application/json" }
          : {}),
      },
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
      cache: "no-store",
      signal: options.signal,
    });

  let response: Response;
  try {
    response = await send();
    if (response.status === 401 && !options.signal?.aborted) {
      try {
        await refreshOnce();
      } catch {
        throw new LrApiError(
          401,
          "Your session has expired. Please sign in again.",
        );
      }
      response = await send();
    }
  } catch (cause) {
    if (cause instanceof LrApiError || options.signal?.aborted) throw cause;
    throw new LrApiError(502, "Unable to connect to the service.");
  }

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message =
      isRecord(body) && typeof body.title === "string"
        ? body.title
        : response.status === 409
          ? "Exam status has changed. Please reload."
          : "Unable to process L&R request.";
    throw new LrApiError(response.status, message);
  }
  if (response.status === 204) return null;

  return response.json().catch(() => {
    throw new LrApiError(502, "Invalid server response.");
  });
}

export interface LrExamCatalogItemApi {
  examId: string;
  code: string;
  title: string;
  versionNumber: number;
  totalQuestions: number;
  listeningQuestions: number;
  readingQuestions: number;
  publishedAtUtc: string;
}

export interface LrOverviewApi {
  examId: string;
  code: string;
  title: string;
  totalQuestions: number;
  listeningQuestions: number;
  readingQuestions: number;
  durationMinutes: number;
  minScaledScore: number;
  maxScaledScore: number;
  activeAttemptId: string | null;
}

export interface LrSheetQuestionApi {
  id: string;
  number: number;
  stem: string | null;
  optionA: string | null;
  optionB: string | null;
  optionC: string | null;
  optionD: string | null;
  imageAssetId: string | null;
  userSelectedKey: "A" | "B" | "C" | "D" | null;
  isFlagged: boolean;
}

export interface LrSheetBlockApi {
  id: string;
  part: number;
  firstQuestionNumber: number;
  audioAssetId: string | null;
  audioDurationMs: number | null;
  contextBlocks: {
    id: string;
    ordinal: number;
    text: string | null;
    imageAssetId: string | null;
  }[];
  questions: LrSheetQuestionApi[];
}

export interface LrSheetApi {
  attemptId: string;
  examId: string;
  examCode: string;
  examTitle: string;
  versionNumber: number;
  phase: "listening" | "reading";
  startedAtUtc: string;
  readingStartedAtUtc: string | null;
  timeLimitSeconds: number;
  remainingSeconds: number;
  totalQuestions: number;
  blocks: LrSheetBlockApi[];
}

export interface LrResultApi {
  attemptId: string;
  examId: string;
  examCode: string;
  examTitle: string;
  listeningRawScore: number;
  readingRawScore: number;
  listeningScaledScore: number;
  readingScaledScore: number;
  totalScaledScore: number;
  listeningMaxScaledScore: number;
  readingMaxScaledScore: number;
  maxScaledScore: number;
  totalCorrect: number;
  totalIncorrect: number;
  totalSkipped: number;
  isTimeExpired: boolean;
  startedAtUtc: string;
  submittedAtUtc: string;
  durationSeconds: number;
  parts: {
    part: number;
    totalQuestions: number;
    correctCount: number;
    incorrectCount: number;
    skippedCount: number;
  }[];
}

export interface LrReviewApi {
  attemptId: string;
  examId: string;
  examCode: string;
  examTitle: string;
  totalScaledScore: number;
  listeningScaledScore: number;
  readingScaledScore: number;
  isTimeExpired: boolean;
  counts: {
    correct: number;
    wrong: number;
    skipped: number;
    flagged: number;
  };
  blocks: {
    id: string;
    part: number;
    firstQuestionNumber: number;
    audioAssetId: string | null;
    audioDurationMs: number | null;
    contextBlocks: {
      id: string;
      ordinal: number;
      text: string | null;
      imageAssetId: string | null;
    }[];
    questions: {
      questionId: string;
      number: number;
      part: number;
      stem: string | null;
      optionA: string | null;
      optionB: string | null;
      optionC: string | null;
      optionD: string | null;
      userSelectedKey: string | null;
      correctKey: string | null;
      status: "correct" | "wrong" | "skipped";
      isFlagged: boolean;
      explanation: string | null;
      translation: string | null;
      imageAssetId: string | null;
    }[];
  }[];
}

export type LrAttemptStatus = "InProgress" | "Completed" | "Abandoned";

export interface LrAttemptHistoryItemApi {
  attemptId: string;
  examId: string;
  examTitle: string;
  examCode: string;
  status: LrAttemptStatus;
  listeningScaledScore: number | null;
  readingScaledScore: number | null;
  totalScaledScore: number | null;
  isTimeExpired: boolean;
  startedAtUtc: string;
  submittedAtUtc: string | null;
  durationSeconds: number | null;
}

export interface LrAttemptHistoryPagedApi {
  items: LrAttemptHistoryItemApi[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
}

function parseAttemptStatus(value: unknown): LrAttemptStatus {
  const message = "Invalid L&R attempt history.";
  if (typeof value === "number") {
    if (value === 1) return "InProgress";
    if (value === 2) return "Completed";
    if (value === 3) return "Abandoned";
    throw new LrApiError(502, message);
  }
  if (
    value === "InProgress" ||
    value === "Completed" ||
    value === "Abandoned"
  ) {
    return value;
  }
  throw new LrApiError(502, message);
}

function parseAttemptHistoryItem(value: unknown): LrAttemptHistoryItemApi {
  const message = "Invalid L&R attempt history.";
  if (!isRecord(value)) throw new LrApiError(502, message);
  return {
    attemptId: requiredString(value.attemptId, message),
    examId: requiredString(value.examId, message),
    examTitle: requiredString(value.examTitle, message),
    examCode: requiredString(value.examCode, message),
    status: parseAttemptStatus(value.status),
    listeningScaledScore: nullableNumber(value.listeningScaledScore),
    readingScaledScore: nullableNumber(value.readingScaledScore),
    totalScaledScore: nullableNumber(value.totalScaledScore),
    isTimeExpired: value.isTimeExpired === true,
    startedAtUtc: requiredString(value.startedAtUtc, message),
    submittedAtUtc: nullableString(value.submittedAtUtc),
    durationSeconds: nullableNumber(value.durationSeconds),
  };
}

function parseAttemptHistory(value: unknown): LrAttemptHistoryPagedApi {
  const message = "Invalid L&R attempt history.";
  if (!isRecord(value) || !Array.isArray(value.items)) {
    throw new LrApiError(502, message);
  }
  return {
    items: value.items.map(parseAttemptHistoryItem),
    totalCount: requiredNumber(value.totalCount, message),
    pageIndex: requiredNumber(value.pageIndex, message),
    pageSize: requiredNumber(value.pageSize, message),
  };
}

function parseCatalogItem(value: unknown): LrExamCatalogItemApi {
  if (!isRecord(value)) {
    throw new Error("Invalid L&R exam catalog.");
  }
  const message = "Invalid L&R exam catalog.";
  return {
    examId: requiredString(value.examId, message),
    code: requiredString(value.code, message),
    title: requiredString(value.title, message),
    versionNumber: requiredNumber(value.versionNumber, message),
    totalQuestions: requiredNumber(value.totalQuestions, message),
    listeningQuestions: requiredNumber(value.listeningQuestions, message),
    readingQuestions: requiredNumber(value.readingQuestions, message),
    publishedAtUtc: requiredString(value.publishedAtUtc, message),
  };
}

function parseOverview(value: unknown): LrOverviewApi {
  if (!isRecord(value)) {
    throw new Error("Invalid exam overview.");
  }
  const message = "Invalid exam overview.";
  return {
    examId: requiredString(value.examId, message),
    code: requiredString(value.code, message),
    title: requiredString(value.title, message),
    totalQuestions: requiredNumber(value.totalQuestions, message),
    listeningQuestions: requiredNumber(value.listeningQuestions, message),
    readingQuestions: requiredNumber(value.readingQuestions, message),
    durationMinutes: requiredNumber(value.durationMinutes, message),
    minScaledScore: requiredNumber(value.minScaledScore, message),
    maxScaledScore: requiredNumber(value.maxScaledScore, message),
    activeAttemptId: nullableString(value.activeAttemptId),
  };
}

function parseSheet(value: unknown): LrSheetApi {
  if (!isRecord(value) || !Array.isArray(value.blocks)) {
    throw new Error("Invalid exam attempt data.");
  }

  const blocks = value.blocks.map((rawBlock): LrSheetBlockApi => {
    if (
      !isRecord(rawBlock) ||
      !Array.isArray(rawBlock.questions) ||
      !Array.isArray(rawBlock.contextBlocks)
    ) {
      throw new Error("Invalid question group data.");
    }

    return {
      id: requiredString(rawBlock.id, "Invalid question group data."),
      part: requiredNumber(rawBlock.part, "Invalid question group data."),
      firstQuestionNumber: requiredNumber(
        rawBlock.firstQuestionNumber,
        "Invalid question group data.",
      ),
      audioAssetId: nullableString(rawBlock.audioAssetId),
      audioDurationMs: nullableNumber(rawBlock.audioDurationMs),
      contextBlocks: rawBlock.contextBlocks.map((rawContext) => {
        if (!isRecord(rawContext)) {
          throw new Error("Invalid context data.");
        }
        return {
          id: requiredString(rawContext.id, "Invalid context data."),
          ordinal: requiredNumber(rawContext.ordinal, "Invalid context data."),
          text: nullableString(rawContext.text),
          imageAssetId: nullableString(rawContext.imageAssetId),
        };
      }),
      questions: rawBlock.questions.map((rawQuestion): LrSheetQuestionApi => {
        if (!isRecord(rawQuestion)) {
          throw new Error("Invalid question data.");
        }
        const selected = nullableString(rawQuestion.userSelectedKey);
        if (selected !== null && !["A", "B", "C", "D"].includes(selected)) {
          throw new Error("Invalid saved answer.");
        }
        return {
          id: requiredString(rawQuestion.id, "Invalid question data."),
          number: requiredNumber(rawQuestion.number, "Invalid question data."),
          stem: nullableString(rawQuestion.stem),
          optionA: nullableString(rawQuestion.optionA),
          optionB: nullableString(rawQuestion.optionB),
          optionC: nullableString(rawQuestion.optionC),
          optionD: nullableString(rawQuestion.optionD),
          imageAssetId: nullableString(rawQuestion.imageAssetId),
          userSelectedKey: selected as LrSheetQuestionApi["userSelectedKey"],
          isFlagged: rawQuestion.isFlagged === true,
        };
      }),
    };
  });

  const phase = value.phase;
  if (phase !== "listening" && phase !== "reading") {
    throw new Error("Invalid exam phase.");
  }

  const message = "Invalid exam attempt data.";
  return {
    attemptId: requiredString(value.attemptId, message),
    examId: requiredString(value.examId, message),
    examCode: requiredString(value.examCode, message),
    examTitle: requiredString(value.examTitle, message),
    versionNumber: requiredNumber(value.versionNumber, message),
    phase,
    startedAtUtc: requiredString(value.startedAtUtc, message),
    readingStartedAtUtc: nullableString(value.readingStartedAtUtc),
    timeLimitSeconds: requiredNumber(value.timeLimitSeconds, message),
    remainingSeconds: requiredNumber(value.remainingSeconds, message),
    totalQuestions: requiredNumber(value.totalQuestions, message),
    blocks,
  };
}

function parseResult(value: unknown): LrResultApi {
  if (!isRecord(value) || !Array.isArray(value.parts)) {
    throw new Error("Invalid exam result.");
  }
  const message = "Invalid exam result.";
  return {
    attemptId: requiredString(value.attemptId, message),
    examId: requiredString(value.examId, message),
    examCode: requiredString(value.examCode, message),
    examTitle: requiredString(value.examTitle, message),
    listeningRawScore: requiredNumber(value.listeningRawScore, message),
    readingRawScore: requiredNumber(value.readingRawScore, message),
    listeningScaledScore: requiredNumber(value.listeningScaledScore, message),
    readingScaledScore: requiredNumber(value.readingScaledScore, message),
    totalScaledScore: requiredNumber(value.totalScaledScore, message),
    listeningMaxScaledScore: requiredNumber(
      value.listeningMaxScaledScore,
      message,
    ),
    readingMaxScaledScore: requiredNumber(value.readingMaxScaledScore, message),
    maxScaledScore: requiredNumber(value.maxScaledScore, message),
    totalCorrect: requiredNumber(value.totalCorrect, message),
    totalIncorrect: requiredNumber(value.totalIncorrect, message),
    totalSkipped: requiredNumber(value.totalSkipped, message),
    isTimeExpired: value.isTimeExpired === true,
    startedAtUtc: requiredString(value.startedAtUtc, message),
    submittedAtUtc: requiredString(value.submittedAtUtc, message),
    durationSeconds: requiredNumber(value.durationSeconds, message),
    parts: value.parts.map((part) => {
      if (!isRecord(part)) throw new Error("Invalid part score data.");
      return {
        part: requiredNumber(part.part, "Invalid part score data."),
        totalQuestions: requiredNumber(
          part.totalQuestions,
          "Invalid part score data.",
        ),
        correctCount: requiredNumber(
          part.correctCount,
          "Invalid part score data.",
        ),
        incorrectCount: requiredNumber(
          part.incorrectCount,
          "Invalid part score data.",
        ),
        skippedCount: requiredNumber(
          part.skippedCount,
          "Invalid part score data.",
        ),
      };
    }),
  };
}

function parseReview(value: unknown): LrReviewApi {
  if (
    !isRecord(value) ||
    !isRecord(value.counts) ||
    !Array.isArray(value.blocks)
  ) {
    throw new LrApiError(502, "Invalid review data.");
  }
  const message = "Invalid review data.";

  return {
    attemptId: requiredString(value.attemptId, message),
    examId: requiredString(value.examId, message),
    examCode: requiredString(value.examCode, message),
    examTitle: requiredString(value.examTitle, message),
    totalScaledScore: requiredNumber(value.totalScaledScore, message),
    listeningScaledScore: requiredNumber(value.listeningScaledScore, message),
    readingScaledScore: requiredNumber(value.readingScaledScore, message),
    isTimeExpired: value.isTimeExpired === true,
    counts: {
      correct: requiredNumber(value.counts.correct, message),
      wrong: requiredNumber(value.counts.wrong, message),
      skipped: requiredNumber(value.counts.skipped, message),
      flagged: requiredNumber(value.counts.flagged, message),
    },
    blocks: value.blocks.map((rawBlock) => {
      if (
        !isRecord(rawBlock) ||
        !Array.isArray(rawBlock.questions) ||
        !Array.isArray(rawBlock.contextBlocks)
      ) {
        throw new LrApiError(502, "Invalid review question group data.");
      }

      return {
        id: requiredString(rawBlock.id, message),
        part: requiredNumber(rawBlock.part, message),
        firstQuestionNumber: requiredNumber(
          rawBlock.firstQuestionNumber,
          message,
        ),
        audioAssetId: nullableString(rawBlock.audioAssetId),
        audioDurationMs: nullableNumber(rawBlock.audioDurationMs),
        contextBlocks: rawBlock.contextBlocks.map((context) => {
          if (!isRecord(context)) {
            throw new Error("Invalid context data.");
          }
          return {
            id: requiredString(context.id, message),
            ordinal: requiredNumber(context.ordinal, message),
            text: nullableString(context.text),
            imageAssetId: nullableString(context.imageAssetId),
          };
        }),
        questions: rawBlock.questions.map((rawQuestion) => {
          if (!isRecord(rawQuestion)) {
            throw new Error("Invalid review question data.");
          }
          const status = rawQuestion.status;
          if (
            status !== "correct" &&
            status !== "wrong" &&
            status !== "skipped"
          ) {
            throw new Error("Invalid question status.");
          }
          return {
            questionId: requiredString(rawQuestion.questionId, message),
            number: requiredNumber(rawQuestion.number, message),
            part: requiredNumber(rawQuestion.part, message),
            stem: nullableString(rawQuestion.stem),
            optionA: nullableString(rawQuestion.optionA),
            optionB: nullableString(rawQuestion.optionB),
            optionC: nullableString(rawQuestion.optionC),
            optionD: nullableString(rawQuestion.optionD),
            userSelectedKey: nullableString(rawQuestion.userSelectedKey),
            correctKey: nullableString(rawQuestion.correctKey),
            status,
            isFlagged: rawQuestion.isFlagged === true,
            explanation: nullableString(rawQuestion.explanation),
            translation: nullableString(rawQuestion.translation),
            imageAssetId: nullableString(rawQuestion.imageAssetId),
          };
        }),
      };
    }),
  };
}

export async function getLrCatalog(
  signal?: AbortSignal,
): Promise<LrExamCatalogItemApi[]> {
  const value = await lrRequest("/api/lr/exams/lr", { signal });
  if (!Array.isArray(value)) {
    throw new Error("Invalid L&R exam catalog.");
  }
  return value.map(parseCatalogItem);
}

export async function getLrOverview(examId: string, signal?: AbortSignal) {
  return parseOverview(
    await lrRequest(`/api/lr/exams/${encodeURIComponent(examId)}/lr-overview`, {
      signal,
    }),
  );
}

export async function startLrAttempt(examId: string) {
  return parseSheet(
    await lrRequest(`/api/lr/exams/${encodeURIComponent(examId)}/attempts`, {
      method: "POST",
    }),
  );
}

export async function getLrAttempt(attemptId: string, signal?: AbortSignal) {
  return parseSheet(
    await lrRequest(`/api/lr/exam-attempts/${encodeURIComponent(attemptId)}`, {
      signal,
    }),
  );
}

export async function startLrReading(attemptId: string) {
  return parseSheet(
    await lrRequest(
      `/api/lr/exam-attempts/${encodeURIComponent(attemptId)}/start-reading`,
      { method: "POST" },
    ),
  );
}

export async function saveLrAnswers(
  attemptId: string,
  answers: {
    questionId: string;
    selectedKey: string | null;
    isFlagged: boolean;
  }[],
) {
  return lrRequest(
    `/api/lr/exam-attempts/${encodeURIComponent(attemptId)}/answers`,
    { method: "PUT", body: answers },
  );
}

export async function setLrQuestionFlag(
  attemptId: string,
  questionId: string,
  isFlagged: boolean,
) {
  return lrRequest(
    `/api/lr/exam-attempts/${encodeURIComponent(attemptId)}/questions/${encodeURIComponent(questionId)}/flag`,
    { method: "PUT", body: { isFlagged } },
  );
}

export async function submitLrAttempt(attemptId: string) {
  return parseResult(
    await lrRequest(
      `/api/lr/exam-attempts/${encodeURIComponent(attemptId)}/submit`,
      { method: "POST" },
    ),
  );
}

export async function getLrResult(attemptId: string, signal?: AbortSignal) {
  return parseResult(
    await lrRequest(
      `/api/lr/exam-attempts/${encodeURIComponent(attemptId)}/result`,
      { signal },
    ),
  );
}

export async function getLrReview(
  attemptId: string,
  filter: "All" | "Incorrect" | "Flagged" = "All",
  signal?: AbortSignal,
) {
  return parseReview(
    await lrRequest(
      `/api/lr/exam-attempts/${encodeURIComponent(attemptId)}/review?filter=${filter}`,
      { signal },
    ),
  );
}

export interface LrMediaUrlApi {
  url: string;
  expiresAtUtc: string;
}

export interface LrListeningPlaylistItemApi {
  blockId: string;
  part: number;
  firstQuestionNumber: number;
  audioAssetId: string;
  durationMs: number | null;
  url: string;
  expiresAtUtc: string;
}

export interface LrListeningPlaylistApi {
  items: LrListeningPlaylistItemApi[];
}

function parseListeningPlaylist(value: unknown): LrListeningPlaylistApi {
  const message = "Invalid Listening audio playlist.";
  if (!isRecord(value) || !Array.isArray(value.items)) {
    throw new LrApiError(502, message);
  }
  return {
    items: value.items.map((item) => {
      if (!isRecord(item)) {
        throw new LrApiError(502, message);
      }
      return {
        blockId: requiredString(item.blockId, message),
        part: requiredNumber(item.part, message),
        firstQuestionNumber: requiredNumber(item.firstQuestionNumber, message),
        audioAssetId: requiredString(item.audioAssetId, message),
        durationMs: nullableNumber(item.durationMs),
        url: requiredString(item.url, message),
        expiresAtUtc: requiredString(item.expiresAtUtc, message),
      };
    }),
  };
}

export async function getLrListeningPlaylist(
  attemptId: string,
  signal?: AbortSignal,
): Promise<LrListeningPlaylistApi> {
  return parseListeningPlaylist(
    await lrRequest(
      `/api/lr/exam-attempts/${encodeURIComponent(attemptId)}/listening-audio-urls`,
      { signal },
    ),
  );
}

export async function getLrAttemptHistory(
  params: { pageIndex?: number; pageSize?: number; examId?: string } = {},
  signal?: AbortSignal,
): Promise<LrAttemptHistoryPagedApi> {
  const search = new URLSearchParams();
  if (params.pageIndex !== undefined) {
    search.set("pageIndex", String(params.pageIndex));
  }
  if (params.pageSize !== undefined) {
    search.set("pageSize", String(params.pageSize));
  }
  if (params.examId) search.set("examId", params.examId);
  const query = search.toString();
  return parseAttemptHistory(
    await lrRequest(
      `/api/lr/exam-attempts/history${query ? `?${query}` : ""}`,
      {
        signal,
      },
    ),
  );
}

export async function getLrMediaUrl(
  attemptId: string,
  kind: "audio" | "images",
  assetId: string,
  signal?: AbortSignal,
): Promise<LrMediaUrlApi> {
  if (!assetId.trim()) {
    throw new LrApiError(400, "Missing media asset ID.");
  }
  const value = await lrRequest(
    `/api/lr/exam-attempts/${encodeURIComponent(attemptId)}/${kind}/${encodeURIComponent(assetId)}`,
    { signal },
  );
  if (!isRecord(value)) {
    throw new LrApiError(502, "Invalid media URL.");
  }
  return {
    url: requiredString(value.url, "Invalid media URL."),
    expiresAtUtc: requiredString(value.expiresAtUtc, "Invalid media URL."),
  };
}
// ==========================================
// LEARNER LISTENING & READING PRACTICE API
// ==========================================

export interface LrPracticeItemApi {
  id: string;
  part: number;
  kind: string;
  code: string;
  topic: string | null;
  difficulty: string | null;
  context: string | null;
  audioUrl: string | null;
  imageUrl: string | null;
  questionCount: number;
}

export interface LrPracticeItemPageApi {
  items: LrPracticeItemApi[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

function parsePracticeItem(value: unknown): LrPracticeItemApi {
  if (!isRecord(value)) {
    throw new LrApiError(502, "Invalid practice item data.");
  }

  const message = "Invalid practice item data.";

  return {
    id: requiredString(value.id, message),
    part: requiredNumber(value.part, message),
    kind: requiredString(value.kind, message),
    code: requiredString(value.code, message),
    topic: nullableString(value.topic),
    difficulty: nullableString(value.difficulty),
    context: nullableString(value.context),
    audioUrl: nullableString(value.audioUrl),
    imageUrl: nullableString(value.imageUrl),
    questionCount: requiredNumber(value.questionCount, message),
  };
}

export async function getLrPracticeItems(
  part: number,
  pageNumber = 1,
  pageSize = 20,
  signal?: AbortSignal,
): Promise<LrPracticeItemPageApi> {
  if (!Number.isInteger(part) || part < 1 || part > 7) {
    throw new LrApiError(400, "Invalid part.");
  }

  const query = new URLSearchParams({
    pageNumber: String(pageNumber),
    pageSize: String(pageSize),
  });

  const value = await lrRequest(
    `/api/lr/lr-practice/parts/${part}/items?${query.toString()}`,
    { signal },
  );

  if (!isRecord(value) || !Array.isArray(value.items)) {
    throw new LrApiError(502, "Invalid practice item list.");
  }

  const message = "Invalid pagination info.";

  return {
    items: value.items.map(parsePracticeItem),
    pageNumber: requiredNumber(value.pageNumber, message),
    pageSize: requiredNumber(value.pageSize, message),
    totalCount: requiredNumber(value.totalCount, message),
    totalPages: requiredNumber(value.totalPages, message),
  };
}
// ==========================================
// LEARNER LISTENING & READING PRACTICE DETAIL
// ==========================================

export interface LrPracticeQuestionApi {
  id: string;
  ordinal: number;
  code: string | null;
  prompt: string | null;
  optionA: string | null;
  optionB: string | null;
  optionC: string | null;
  optionD: string | null;
}

export interface LrPracticeDetailApi {
  id: string;
  part: number;
  kind: string;
  code: string;
  topic: string | null;
  difficulty: string | null;
  context: string | null;
  audioUrl: string | null;
  imageUrl: string | null;
  questions: LrPracticeQuestionApi[];
}

export interface LrPracticeSubmitAnswerApi {
  questionId: string;
  selectedKey: string | null;
}

export interface LrPracticeQuestionResultApi {
  questionId: string;
  ordinal: number;
  selectedKey: string | null;
  correctKey: string;
  isCorrect: boolean;
  translation: string | null;
  explanation: string | null;
}

export interface LrPracticeSubmitResultApi {
  itemId: string;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  questions: LrPracticeQuestionResultApi[];
}

function parsePracticeDetail(value: unknown): LrPracticeDetailApi {
  if (!isRecord(value) || !Array.isArray(value.questions)) {
    throw new LrApiError(502, "Invalid practice item details.");
  }

  const message = "Invalid practice item details.";

  return {
    id: requiredString(value.id, message),
    part: requiredNumber(value.part, message),
    kind: requiredString(value.kind, message),
    code: requiredString(value.code, message),
    topic: nullableString(value.topic),
    difficulty: nullableString(value.difficulty),
    context: nullableString(value.context),
    audioUrl: nullableString(value.audioUrl),
    imageUrl: nullableString(value.imageUrl),
    questions: value.questions.map((raw): LrPracticeQuestionApi => {
      if (!isRecord(raw)) {
        throw new LrApiError(502, "Invalid question data.");
      }

      return {
        id: requiredString(raw.id, message),
        ordinal: requiredNumber(raw.ordinal, message),
        code: nullableString(raw.code),
        prompt: nullableString(raw.prompt),
        optionA: nullableString(raw.optionA),
        optionB: nullableString(raw.optionB),
        optionC: nullableString(raw.optionC),
        optionD: nullableString(raw.optionD),
      };
    }),
  };
}

function parsePracticeSubmitResult(value: unknown): LrPracticeSubmitResultApi {
  if (!isRecord(value) || !Array.isArray(value.questions)) {
    throw new LrApiError(502, "Invalid grading result.");
  }

  const message = "Invalid grading result.";

  return {
    itemId: requiredString(value.itemId, message),
    totalQuestions: requiredNumber(value.totalQuestions, message),
    correctCount: requiredNumber(value.correctCount, message),
    incorrectCount: requiredNumber(value.incorrectCount, message),
    questions: value.questions.map((raw): LrPracticeQuestionResultApi => {
      if (!isRecord(raw)) {
        throw new LrApiError(502, "Invalid question result.");
      }

      return {
        questionId: requiredString(raw.questionId, message),
        ordinal: requiredNumber(raw.ordinal, message),
        selectedKey: nullableString(raw.selectedKey),
        correctKey: requiredString(raw.correctKey, message),
        isCorrect: raw.isCorrect === true,
        translation: nullableString(raw.translation),
        explanation: nullableString(raw.explanation),
      };
    }),
  };
}

export async function getLrPracticeDetail(
  itemId: string,
  signal?: AbortSignal,
): Promise<LrPracticeDetailApi> {
  const value = await lrRequest(
    `/api/lr/lr-practice/items/${encodeURIComponent(itemId)}`,
    { signal },
  );

  return parsePracticeDetail(value);
}

export async function submitLrPractice(
  itemId: string,
  answers: LrPracticeSubmitAnswerApi[],
): Promise<LrPracticeSubmitResultApi> {
  const value = await lrRequest(
    `/api/lr/lr-practice/items/${encodeURIComponent(itemId)}/submit`,
    {
      method: "POST",
      body: { answers },
    },
  );

  return parsePracticeSubmitResult(value);
}
export interface LrPracticeItemStatisticsApi {
  itemId: string;
  attemptCount: number;
  bestScore: number;
  totalQuestions: number;
}

function parsePracticeStatisticsItem(
  value: unknown,
): LrPracticeItemStatisticsApi {
  const message = "Invalid statistics data.";
  if (!isRecord(value)) {
    throw new LrApiError(502, message);
  }

  return {
    itemId: requiredString(value.itemId, message),
    attemptCount: requiredNumber(value.attemptCount, message),
    bestScore: requiredNumber(value.bestScore, message),
    totalQuestions: requiredNumber(value.totalQuestions, message),
  };
}

export async function getLrPracticeStatistics(
  part: number,
  signal?: AbortSignal,
): Promise<LrPracticeItemStatisticsApi[]> {
  if (!Number.isInteger(part) || part < 1 || part > 7) {
    throw new LrApiError(400, "Invalid part.");
  }

  const value = await lrRequest(
    `/api/lr/lr-practice/parts/${part}/statistics`,
    { signal },
  );

  if (!Array.isArray(value)) {
    throw new LrApiError(502, "Invalid statistics data.");
  }

  return value.map(parsePracticeStatisticsItem);
}
