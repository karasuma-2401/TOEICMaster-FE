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
  if (typeof value !== "string") throw new Error(message);
  return value;
}

function requiredNumber(value: unknown, message: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(message);
  }
  return value;
}

function nullableString(value: unknown): string | null {
  return value === null || value === undefined
    ? null
    : requiredString(value, "Phản hồi L&R không hợp lệ.");
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
        options.body === undefined
          ? undefined
          : JSON.stringify(options.body),
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
  masterAudioObjectKey: string | null;
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
      part: requiredNumber(
        rawBlock.part,
        "Dữ liệu nhóm câu hỏi không hợp lệ.",
      ),
      firstQuestionNumber: requiredNumber(
        rawBlock.firstQuestionNumber,
        "Dữ liệu nhóm câu hỏi không hợp lệ.",
      ),
      audioAssetId: nullableString(rawBlock.audioAssetId),
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
          userSelectedKey:
            selected as LrSheetQuestionApi["userSelectedKey"],
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
    masterAudioObjectKey: nullableString(value.masterAudioObjectKey),
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
    readingMaxScaledScore: requiredNumber(
      value.readingMaxScaledScore,
      message,
    ),
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
    throw new Error("Dữ liệu xem lại không hợp lệ.");
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
        throw new Error("Dữ liệu nhóm câu hỏi xem lại không hợp lệ.");
      }

      return {
        id: requiredString(rawBlock.id, message),
        part: requiredNumber(rawBlock.part, message),
        firstQuestionNumber: requiredNumber(
          rawBlock.firstQuestionNumber,
          message,
        ),
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

export async function getLrOverview(
  examId: string,
  signal?: AbortSignal,
) {
  return parseOverview(
    await lrRequest(
      `/api/lr/exams/${encodeURIComponent(examId)}/lr-overview`,
      { signal },
    ),
  );
}

export async function startLrAttempt(examId: string) {
  return parseSheet(
    await lrRequest(
      `/api/lr/exams/${encodeURIComponent(examId)}/attempts`,
      { method: "POST" },
    ),
  );
}

export async function getLrAttempt(
  attemptId: string,
  signal?: AbortSignal,
) {
  return parseSheet(
    await lrRequest(
      `/api/lr/exam-attempts/${encodeURIComponent(attemptId)}`,
      { signal },
    ),
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

export async function getLrResult(
  attemptId: string,
  signal?: AbortSignal,
) {
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

export async function getLrMediaUrl(
  attemptId: string,
  kind: "audio" | "images",
  assetId?: string,
  signal?: AbortSignal,
): Promise<LrMediaUrlApi> {
  const suffix = assetId ? `/${encodeURIComponent(assetId)}` : "";
  const value = await lrRequest(
    `/api/lr/exam-attempts/${encodeURIComponent(attemptId)}/${kind}${suffix}`,
    { signal },
  );
  if (!isRecord(value)) throw new Error("Đường dẫn media không hợp lệ.");
  return {
    url: requiredString(value.url, "Đường dẫn media không hợp lệ."),
    expiresAtUtc: requiredString(
      value.expiresAtUtc,
      "Đường dẫn media không hợp lệ.",
    ),
  };
}
