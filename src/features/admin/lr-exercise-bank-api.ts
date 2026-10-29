import { AuthError, refreshSession } from "@/features/auth/api";
import { ApiError } from "@/shared/api/client";

export type LrExerciseDifficulty = "EASY" | "MEDIUM" | "HARD";
export type LrExerciseStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type LrExerciseKind = "SINGLE" | "GROUP";

export interface LrExerciseQuestion {
  id: string;
  ordinal: number;
  code: string;
  prompt: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string | null;
  correctKey: "A" | "B" | "C" | "D";
  translation: string | null;
  explanation: string | null;
}

export interface LrExerciseItem {
  id: string;
  part: number;
  kind: LrExerciseKind;
  code: string;
  topic: string;
  difficulty: LrExerciseDifficulty;
  status: LrExerciseStatus;
  context: string | null;
  audioUrl: string | null;
  imageUrl: string | null;
  questions: LrExerciseQuestion[];
  version: number;
  createdAtUtc: string;
  updatedAtUtc: string;
}

export interface LrExercisePartSummary {
  part: number;
  kind: LrExerciseKind;
  itemCount: number;
  questionCount: number;
  updatedAtUtc: string | null;
}

export interface LrExerciseSummary {
  totalQuestionCount: number;
  updatedAtUtc: string | null;
  parts: LrExercisePartSummary[];
}

export interface LrExercisePage {
  items: LrExerciseItem[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface CreateLrExerciseItemInput {
  code: string;
  topic: string;
  difficulty: LrExerciseDifficulty;
  status: LrExerciseStatus;
  context: string | null;
  audioUrl: string | null;
  imageUrl: string | null;
  questions: Array<{
    code: string;
    prompt: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string | null;
    correctKey: "A" | "B" | "C" | "D";
    translation: string | null;
    explanation: string | null;
  }>;
}

export class LrExerciseBankApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "LrExerciseBankApiError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isGuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

function isDate(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isQuestion(value: unknown): value is LrExerciseQuestion {
  if (!isRecord(value)) return false;
  return (
    isGuid(value.id) &&
    isPositiveInteger(value.ordinal) &&
    typeof value.code === "string" &&
    typeof value.prompt === "string" &&
    typeof value.optionA === "string" &&
    typeof value.optionB === "string" &&
    typeof value.optionC === "string" &&
    isNullableString(value.optionD) &&
    (value.correctKey === "A" ||
      value.correctKey === "B" ||
      value.correctKey === "C" ||
      value.correctKey === "D") &&
    isNullableString(value.translation) &&
    isNullableString(value.explanation)
  );
}

function isItem(value: unknown): value is LrExerciseItem {
  if (!isRecord(value)) return false;
  return (
    isGuid(value.id) &&
    isPositiveInteger(value.part) &&
    (value.kind === "SINGLE" || value.kind === "GROUP") &&
    typeof value.code === "string" &&
    typeof value.topic === "string" &&
    (value.difficulty === "EASY" ||
      value.difficulty === "MEDIUM" ||
      value.difficulty === "HARD") &&
    (value.status === "DRAFT" ||
      value.status === "PUBLISHED" ||
      value.status === "ARCHIVED") &&
    isNullableString(value.context) &&
    isNullableString(value.audioUrl) &&
    isNullableString(value.imageUrl) &&
    Array.isArray(value.questions) &&
    value.questions.every(isQuestion) &&
    isPositiveInteger(value.version) &&
    isDate(value.createdAtUtc) &&
    isDate(value.updatedAtUtc)
  );
}

function parseItem(value: unknown): LrExerciseItem {
  if (!isItem(value))
    throw new LrExerciseBankApiError(
      502,
      "Phản hồi bài tập từ hệ thống không hợp lệ.",
    );
  return value;
}

function parsePage(value: unknown): LrExercisePage {
  if (
    !isRecord(value) ||
    !Array.isArray(value.items) ||
    !value.items.every(isItem) ||
    !isPositiveInteger(value.pageNumber) ||
    !isPositiveInteger(value.pageSize) ||
    !isNonNegativeInteger(value.totalCount) ||
    !isNonNegativeInteger(value.totalPages)
  )
    throw new LrExerciseBankApiError(
      502,
      "Phản hồi danh sách bài tập không hợp lệ.",
    );
  return value as unknown as LrExercisePage;
}

function parseSummary(value: unknown): LrExerciseSummary {
  if (
    !isRecord(value) ||
    !isNonNegativeInteger(value.totalQuestionCount) ||
    !isNullableString(value.updatedAtUtc) ||
    (value.updatedAtUtc !== null && !isDate(value.updatedAtUtc)) ||
    !Array.isArray(value.parts) ||
    value.parts.length !== 7 ||
    !value.parts.every(
      (part) =>
        isRecord(part) &&
        isPositiveInteger(part.part) &&
        (part.kind === "SINGLE" || part.kind === "GROUP") &&
        isNonNegativeInteger(part.itemCount) &&
        isNonNegativeInteger(part.questionCount) &&
        isNullableString(part.updatedAtUtc) &&
        (part.updatedAtUtc === null || isDate(part.updatedAtUtc)),
    )
  )
    throw new LrExerciseBankApiError(
      502,
      "Phản hồi tổng quan ngân hàng bài tập không hợp lệ.",
    );
  return value as unknown as LrExerciseSummary;
}

async function messageFromResponse(response: Response): Promise<string> {
  return response
    .json()
    .then((body: unknown) =>
      isRecord(body) && typeof body.title === "string"
        ? body.title
        : "Không thể kết nối dịch vụ.",
    )
    .catch(() => "Không thể kết nối dịch vụ.");
}

async function refreshAdminSession() {
  const refresh = () => refreshSession();
  if (typeof navigator !== "undefined" && navigator.locks) {
    await navigator.locks.request("toeicmaster-refresh", refresh);
    return;
  }
  await refresh();
}

async function request<T>(
  path: string,
  method: "GET" | "POST",
  body?: FormData | object,
  signal?: AbortSignal,
): Promise<T> {
  const send = async () => {
    const form = body instanceof FormData;
    const response = await fetch(path, {
      method,
      headers: {
        Accept: "application/json",
        ...(body && !form ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: form ? body : JSON.stringify(body) } : {}),
      signal,
      cache: "no-store",
    });
    if (!response.ok)
      throw new ApiError(response.status, await messageFromResponse(response));
    return (await response.json()) as T;
  };
  try {
    try {
      return await send();
    } catch (error) {
      if (
        !(error instanceof ApiError) ||
        error.status !== 401 ||
        signal?.aborted
      )
        throw error;
      await refreshAdminSession();
      return await send();
    }
  } catch (error) {
    if (error instanceof LrExerciseBankApiError) throw error;
    if (error instanceof AuthError)
      throw new LrExerciseBankApiError(error.status, error.message);
    if (error instanceof ApiError)
      throw new LrExerciseBankApiError(error.status, error.message);
    throw new LrExerciseBankApiError(502, "Không thể kết nối dịch vụ.");
  }
}

export async function getLrExerciseSummary(
  signal?: AbortSignal,
): Promise<LrExerciseSummary> {
  return parseSummary(
    await request<unknown>(
      "/api/admin/lr-exercise-bank/summary",
      "GET",
      undefined,
      signal,
    ),
  );
}

export async function getLrExerciseItems(
  part: number,
  query: { query: string; difficulty: string; status: string; page: number },
  signal?: AbortSignal,
): Promise<LrExercisePage> {
  const params = new URLSearchParams({
    pageNumber: String(query.page),
    pageSize: "20",
  });
  if (query.query) params.set("query", query.query);
  if (query.difficulty) params.set("difficulty", query.difficulty);
  if (query.status) params.set("status", query.status);
  return parsePage(
    await request<unknown>(
      `/api/admin/lr-exercise-bank/parts/${part}/items?${params}`,
      "GET",
      undefined,
      signal,
    ),
  );
}

export async function createLrExerciseItem(
  part: number,
  input: CreateLrExerciseItemInput,
): Promise<LrExerciseItem> {
  return parseItem(
    await request<unknown>(
      `/api/admin/lr-exercise-bank/parts/${part}/items`,
      "POST",
      input,
    ),
  );
}

export async function importLrExerciseItems(
  part: number,
  file: File,
): Promise<LrExerciseSummary> {
  const form = new FormData();
  form.set("file", file);
  const value = await request<unknown>(
    `/api/admin/lr-exercise-bank/parts/${part}/imports`,
    "POST",
    form,
  );
  if (!isRecord(value) || !isRecord(value.summary))
    throw new LrExerciseBankApiError(
      502,
      "Phản hồi import bài tập không hợp lệ.",
    );
  return parseSummary(value.summary);
}
