import { AuthError, refreshSession } from "@/features/auth/api";
import { ApiError, getJson } from "@/shared/api/client";
import {
  parseReadingExamPage,
  parseReadingRevision,
  parseScoreProfiles,
  type ReadingExamPage,
  type ReadingRevision,
  type ScoreProfile,
} from "./exam-management";

export class AdminExamApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "AdminExamApiError";
  }
}

export interface ReadingListRequest {
  status: "ALL" | "DRAFT" | "PUBLISHED";
  page: number;
  pageSize: number;
}

export interface CreateReadingExamInput {
  code: string;
  title: string;
  scoreProfileId: string;
}

export interface ReadingDraft {
  examId: string;
  revisionId: string;
  code: string;
  title: string;
  versionNumber: number;
  status: string;
  questionCount: number;
}

export interface UpdateReadingQuestionInput {
  code: string;
  stem: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string | null;
  correctKey: string;
  translation: string | null;
  explanation: string | null;
  imageAssetId: string | null;
}

export interface UpdateReadingContextsInput {
  contexts: Array<{
    ordinal: number;
    type: "Text" | "Image";
    text: string | null;
    imageAssetId: string | null;
    altText: string | null;
  }>;
}

function messageFromResponse(response: Response): Promise<string> {
  return response
    .json()
    .then((body: unknown) => {
      if (
        body &&
        typeof body === "object" &&
        "title" in body &&
        typeof body.title === "string"
      )
        return body.title;
      return "Không thể kết nối dịch vụ.";
    })
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
  method: "POST" | "PUT" | "DELETE",
  body?: object | FormData,
  signal?: AbortSignal,
): Promise<T | undefined> {
  const send = async () => {
    const isFormData = body instanceof FormData;
    const response = await fetch(path, {
      method,
      headers: {
        Accept: "application/json",
        ...(body && !isFormData ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: isFormData ? body : JSON.stringify(body) } : {}),
      signal,
      cache: "no-store",
    });
    if (!response.ok)
      throw new ApiError(response.status, await messageFromResponse(response));
    if (response.status === 204) return undefined;
    if (!response.headers.get("content-type")?.includes("application/json"))
      return undefined;
    return (await response.json()) as T;
  };

  try {
    try {
      return await send();
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) throw error;
      if (signal?.aborted) throw error;
      try {
        await refreshAdminSession();
      } catch {
        throw new AdminExamApiError(401, "Phiên đăng nhập đã hết hạn.");
      }
      return await send();
    }
  } catch (error) {
    if (error instanceof AdminExamApiError) throw error;
    if (error instanceof AuthError)
      throw new AdminExamApiError(error.status, error.message);
    if (error instanceof ApiError)
      throw new AdminExamApiError(error.status, error.message);
    throw new AdminExamApiError(502, "Không thể kết nối dịch vụ.");
  }
}

function readingStatus(status: ReadingListRequest["status"]): string {
  return status === "ALL" ? "" : status === "DRAFT" ? "Draft" : "Published";
}

export async function getReadingExams(
  query: ReadingListRequest,
  signal?: AbortSignal,
): Promise<ReadingExamPage> {
  const params = new URLSearchParams({
    status: readingStatus(query.status),
    pageNumber: String(query.page),
    pageSize: String(query.pageSize),
  });
  try {
    return parseReadingExamPage(
      await getJson<unknown>(`/api/admin/exams?${params}`, signal),
    );
  } catch (error) {
    throw normalizeReadError(
      error,
      "Dữ liệu danh sách đề Reading không hợp lệ.",
    );
  }
}

function normalizeReadError(
  error: unknown,
  fallback: string,
): AdminExamApiError {
  if (error instanceof AdminExamApiError) return error;
  if (error instanceof ApiError)
    return new AdminExamApiError(error.status, error.message);
  return new AdminExamApiError(502, fallback);
}

export async function getScoreProfiles(
  signal?: AbortSignal,
): Promise<ScoreProfile[]> {
  try {
    return parseScoreProfiles(
      await getJson<unknown>("/api/admin/score-profiles", signal),
    );
  } catch (error) {
    throw normalizeReadError(error, "Dữ liệu barem điểm không hợp lệ.");
  }
}

export async function getReadingRevision(
  examId: string,
  revisionId: string,
  signal?: AbortSignal,
): Promise<ReadingRevision> {
  try {
    return parseReadingRevision(
      await getJson<unknown>(
        `/api/admin/exams/${encodeURIComponent(examId)}/revisions/${encodeURIComponent(revisionId)}`,
        signal,
      ),
    );
  } catch (error) {
    throw normalizeReadError(error, "Dữ liệu đề Reading không hợp lệ.");
  }
}

export async function createReadingExam(
  input: CreateReadingExamInput,
): Promise<ReadingDraft> {
  const value = await request<unknown>("/api/admin/exams", "POST", input);
  if (!isReadingDraft(value))
    throw new AdminExamApiError(
      502,
      "Dữ liệu đề Reading vừa tạo không hợp lệ.",
    );
  return value;
}

export async function importReadingExam(
  workbook: File,
  masterAudio: File,
): Promise<ReadingDraft> {
  const formData = new FormData();
  formData.set("workbook", workbook);
  formData.set("masterAudio", masterAudio);
  const value = await request<unknown>(
    "/api/admin/exams/import",
    "POST",
    formData,
  );
  if (!isReadingDraft(value))
    throw new AdminExamApiError(
      502,
      "Dữ liệu đề Reading vừa import không hợp lệ.",
    );
  return value;
}

export async function updateReadingQuestion(
  examId: string,
  revisionId: string,
  questionNumber: number,
  input: UpdateReadingQuestionInput,
) {
  await request(
    `/api/admin/exams/${encodeURIComponent(examId)}/revisions/${encodeURIComponent(revisionId)}/questions/${questionNumber}`,
    "PUT",
    input,
  );
}
export async function updateReadingContexts(
  examId: string,
  revisionId: string,
  blockKey: string,
  input: UpdateReadingContextsInput,
) {
  await request(
    `/api/admin/exams/${encodeURIComponent(examId)}/revisions/${encodeURIComponent(revisionId)}/blocks/${encodeURIComponent(blockKey)}/contexts`,
    "PUT",
    input,
  );
}

export async function uploadReadingImage(file: File): Promise<{ id: string }> {
  const formData = new FormData();
  formData.set("file", file);
  const value = await request<unknown>(
    "/api/admin/exam-media/images",
    "POST",
    formData,
  );
  if (
    !value ||
    typeof value !== "object" ||
    !isGuid((value as { id?: unknown }).id)
  )
    throw new AdminExamApiError(502, "Ảnh vừa tải lên không hợp lệ.");
  return { id: (value as { id: string }).id };
}

export async function uploadReadingMasterAudio(
  examId: string,
  revisionId: string,
  file: File,
) {
  const formData = new FormData();
  formData.set("file", file);
  await request(
    `/api/admin/exams/${encodeURIComponent(examId)}/revisions/${encodeURIComponent(revisionId)}/master-audio`,
    "PUT",
    formData,
  );
}

export async function publishReadingRevision(
  examId: string,
  revisionId: string,
) {
  const value = await request<unknown>(
    `/api/admin/exams/${encodeURIComponent(examId)}/revisions/${encodeURIComponent(revisionId)}/publish`,
    "POST",
    {},
  );
  if (!isReadingDraft(value))
    throw new AdminExamApiError(
      502,
      "Phản hồi xuất bản đề Reading không hợp lệ.",
    );
  return value;
}

function isGuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

function isReadingDraft(value: unknown): value is ReadingDraft {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    isGuid(record.examId) &&
    isGuid(record.revisionId) &&
    typeof record.code === "string" &&
    typeof record.title === "string" &&
    typeof record.versionNumber === "number" &&
    typeof record.status === "string" &&
    typeof record.questionCount === "number"
  );
}
