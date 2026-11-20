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
    : requiredString(value, "Phản hồi L&R không hợp lệ.");
}

function nullableNumber(value: unknown): number | null {
  return value === null || value === undefined
    ? null
    : requiredNumber(value, "Phản hồi L&R không hợp lệ.");
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
        throw new LrApiError(401, "Phiên đăng nhập đã hết hạn.");
      }
      response = await send();
    }
  } catch (cause) {
    if (cause instanceof LrApiError || options.signal?.aborted) throw cause;
    throw new LrApiError(502, "Không thể kết nối dịch vụ.");
  }

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message =
      isRecord(body) && typeof body.title === "string"
        ? body.title
        : response.status === 409
          ? "Trạng thái bài thi đã thay đổi. Vui lòng tải lại."
          : "Không thể xử lý yêu cầu L&R.";
    throw new LrApiError(response.status, message);
  }
  if (response.status === 204) return null;

  return response.json().catch(() => {
    throw new LrApiError(502, "Phản hồi từ máy chủ không hợp lệ.");
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

function parseCatalogItem(value: unknown): LrExamCatalogItemApi {
  if (!isRecord(value)) {
    throw new Error("Danh sách đề L&R không hợp lệ.");
  }
  const message = "Danh sách đề L&R không hợp lệ.";
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
    throw new Error("Thông tin đề thi không hợp lệ.");
  }
  const message = "Thông tin đề thi không hợp lệ.";
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
    throw new Error("Dữ liệu lượt thi không hợp lệ.");
  }

  const blocks = value.blocks.map((rawBlock): LrSheetBlockApi => {
    if (
      !isRecord(rawBlock) ||
      !Array.isArray(rawBlock.questions) ||
      !Array.isArray(rawBlock.contextBlocks)
    ) {
      throw new Error("Dữ liệu nhóm câu hỏi không hợp lệ.");
    }

    return {
      id: requiredString(rawBlock.id, "Dữ liệu nhóm câu hỏi không hợp lệ."),
      part: requiredNumber(rawBlock.part, "Dữ liệu nhóm câu hỏi không hợp lệ."),
      firstQuestionNumber: requiredNumber(
        rawBlock.firstQuestionNumber,
        "Dữ liệu nhóm câu hỏi không hợp lệ.",
      ),
      audioAssetId: nullableString(rawBlock.audioAssetId),
      audioDurationMs: nullableNumber(rawBlock.audioDurationMs),
      contextBlocks: rawBlock.contextBlocks.map((rawContext) => {
        if (!isRecord(rawContext)) {
          throw new Error("Dữ liệu ngữ cảnh không hợp lệ.");
        }
        return {
          id: requiredString(rawContext.id, "Dữ liệu ngữ cảnh không hợp lệ."),
          ordinal: requiredNumber(
            rawContext.ordinal,
            "Dữ liệu ngữ cảnh không hợp lệ.",
          ),
          text: nullableString(rawContext.text),
          imageAssetId: nullableString(rawContext.imageAssetId),
        };
      }),
      questions: rawBlock.questions.map((rawQuestion): LrSheetQuestionApi => {
        if (!isRecord(rawQuestion)) {
          throw new Error("Dữ liệu câu hỏi không hợp lệ.");
        }
        const selected = nullableString(rawQuestion.userSelectedKey);
        if (selected !== null && !["A", "B", "C", "D"].includes(selected)) {
          throw new Error("Đáp án đã lưu không hợp lệ.");
        }
        return {
          id: requiredString(rawQuestion.id, "Dữ liệu câu hỏi không hợp lệ."),
          number: requiredNumber(
            rawQuestion.number,
            "Dữ liệu câu hỏi không hợp lệ.",
          ),
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
    throw new Error("Giai đoạn bài thi không hợp lệ.");
  }

  const message = "Dữ liệu lượt thi không hợp lệ.";
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
    throw new Error("Kết quả bài thi không hợp lệ.");
  }
  const message = "Kết quả bài thi không hợp lệ.";
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
      if (!isRecord(part)) throw new Error("Điểm theo Part không hợp lệ.");
      return {
        part: requiredNumber(part.part, "Điểm theo Part không hợp lệ."),
        totalQuestions: requiredNumber(
          part.totalQuestions,
          "Điểm theo Part không hợp lệ.",
        ),
        correctCount: requiredNumber(
          part.correctCount,
          "Điểm theo Part không hợp lệ.",
        ),
        incorrectCount: requiredNumber(
          part.incorrectCount,
          "Điểm theo Part không hợp lệ.",
        ),
        skippedCount: requiredNumber(
          part.skippedCount,
          "Điểm theo Part không hợp lệ.",
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
    throw new LrApiError(502, "Dữ liệu xem lại không hợp lệ.");
  }
  const message = "Dữ liệu xem lại không hợp lệ.";

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
        throw new LrApiError(502, "Dữ liệu nhóm câu hỏi xem lại không hợp lệ.");
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
            throw new Error("Dữ liệu ngữ cảnh không hợp lệ.");
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
            throw new Error("Dữ liệu câu hỏi xem lại không hợp lệ.");
          }
          const status = rawQuestion.status;
          if (
            status !== "correct" &&
            status !== "wrong" &&
            status !== "skipped"
          ) {
            throw new Error("Trạng thái câu hỏi không hợp lệ.");
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
    throw new Error("Danh sách đề L&R không hợp lệ.");
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
  const message = "Danh sách audio Listening không hợp lệ.";
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

export async function getLrMediaUrl(
  attemptId: string,
  kind: "audio" | "images",
  assetId: string,
  signal?: AbortSignal,
): Promise<LrMediaUrlApi> {
  if (!assetId.trim()) {
    throw new LrApiError(400, "Thiếu mã asset media.");
  }
  const value = await lrRequest(
    `/api/lr/exam-attempts/${encodeURIComponent(attemptId)}/${kind}/${encodeURIComponent(assetId)}`,
    { signal },
  );
  if (!isRecord(value)) {
    throw new LrApiError(502, "Đường dẫn media không hợp lệ.");
  }
  return {
    url: requiredString(value.url, "Đường dẫn media không hợp lệ."),
    expiresAtUtc: requiredString(
      value.expiresAtUtc,
      "Đường dẫn media không hợp lệ.",
    ),
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
    throw new LrApiError(502, "Dữ liệu bài luyện không hợp lệ.");
  }

  const message = "Dữ liệu bài luyện không hợp lệ.";

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
    throw new LrApiError(400, "Part không hợp lệ.");
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
    throw new LrApiError(502, "Danh sách bài luyện không hợp lệ.");
  }

  const message = "Thông tin phân trang không hợp lệ.";

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
    throw new LrApiError(502, "Chi tiết bài luyện không hợp lệ.");
  }

  const message = "Chi tiết bài luyện không hợp lệ.";

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
        throw new LrApiError(502, "Dữ liệu câu hỏi không hợp lệ.");
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
    throw new LrApiError(502, "Kết quả chấm bài không hợp lệ.");
  }

  const message = "Kết quả chấm bài không hợp lệ.";

  return {
    itemId: requiredString(value.itemId, message),
    totalQuestions: requiredNumber(value.totalQuestions, message),
    correctCount: requiredNumber(value.correctCount, message),
    incorrectCount: requiredNumber(value.incorrectCount, message),
    questions: value.questions.map((raw): LrPracticeQuestionResultApi => {
      if (!isRecord(raw)) {
        throw new LrApiError(502, "Kết quả câu hỏi không hợp lệ.");
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
  const message = "Dữ liệu thống kê không hợp lệ.";
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
    throw new LrApiError(400, "Part không hợp lệ.");
  }

  const value = await lrRequest(
    `/api/lr/lr-practice/parts/${part}/statistics`,
    { signal },
  );

  if (!Array.isArray(value)) {
    throw new LrApiError(502, "Dữ liệu thống kê không hợp lệ.");
  }

  return value.map(parsePracticeStatisticsItem);
}
