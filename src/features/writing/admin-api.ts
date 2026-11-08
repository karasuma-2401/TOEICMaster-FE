import { writingRequest } from "./http";
import type { WritingDifficulty, WritingPart } from "./types";
import type { AdminWritingQuestion, AdminWritingTest } from "./admin-mock";

const base = "/api/admin/writing";

export interface WritingExerciseDto {
  id: string;
  part: 1 | 2 | 3;
  code: string;
  topic: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  rubricNotes: string;
  modelAnswer?: string | null;
  imageAssetId: string | null;
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
  version: number;
  createdAtUtc: string;
  updatedAtUtc: string;
}

export interface WritingExercisePageDto {
  items: WritingExerciseDto[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface WritingExerciseInput {
  part: number;
  code: string;
  topic: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  rubricNotes?: string | null;
  modelAnswer?: string | null;
  imageAssetId?: string | null;
  imageAlt?: string | null;
  keywordOne?: string | null;
  keywordTwo?: string | null;
  sender?: string | null;
  recipient?: string | null;
  subject?: string | null;
  emailBody?: string | null;
  directions?: string | null;
  prompt?: string | null;
  minimumWordCount?: number | null;
  outline?: string | null;
}

export interface WritingTestQuestionDto {
  id: string;
  exerciseId: string | null;
  part: 1 | 2 | 3;
  sequenceNumber: number;
  snapshotJson: string | null;
}

export interface WritingTestDto {
  id: string;
  code: string;
  title: string;
  description: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  version: number;
  createdAtUtc: string;
  updatedAtUtc: string;
  publishedAtUtc: string | null;
  questions: WritingTestQuestionDto[];
}

export interface WritingTestPageDto {
  items: WritingTestDto[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface WritingTestQuestionInput {
  exerciseId?: string | null;
  part: number;
  sequenceNumber: number;
  content?: WritingExerciseInput | null;
}

export interface WritingTestInput {
  code: string;
  title: string;
  description?: string | null;
  questions: WritingTestQuestionInput[];
}

export interface WritingMediaAssetDto {
  id: string;
  originalFileName: string;
  contentType: string;
  byteLength: number;
  uploadedAtUtc: string;
  downloadUrl: string;
}

export interface WritingImportPreview {
  rows: {
    rowNumber: number;
    code: string | null;
    errors: string[];
    isValid: boolean;
  }[];
  validRowCount: number;
  invalidRowCount: number;
}

export async function importWritingExerciseFile(
  part: number,
  file: File,
  validate: boolean,
) {
  const form = new FormData();
  form.set("file", file);
  const result = await writingRequest(
    `${base}/exercises/${validate ? "imports/validate" : "import"}?part=${part}`,
    {
      method: "POST",
      form,
      refresh: true,
      fallback: "Không thể xử lý file Excel.",
    },
  );
  if (!result || typeof result !== "object")
    throw new Error("Phản hồi import không hợp lệ.");
  if (!validate) {
    if (
      !("importedCount" in result) ||
      typeof result.importedCount !== "number"
    )
      throw new Error("Phản hồi import không hợp lệ.");
    return result.importedCount;
  }
  if (
    !("rows" in result) ||
    !Array.isArray(result.rows) ||
    !("validRowCount" in result) ||
    typeof result.validRowCount !== "number" ||
    !("invalidRowCount" in result) ||
    typeof result.invalidRowCount !== "number" ||
    !result.rows.every(
      (row: unknown) =>
        !!row &&
        typeof row === "object" &&
        "rowNumber" in row &&
        typeof row.rowNumber === "number" &&
        "code" in row &&
        (row.code === null || typeof row.code === "string") &&
        "errors" in row &&
        Array.isArray(row.errors) &&
        row.errors.every((error: unknown) => typeof error === "string") &&
        "isValid" in row &&
        typeof row.isValid === "boolean",
    )
  )
    throw new Error("Phản hồi kiểm tra Excel không hợp lệ.");
  return result as WritingImportPreview;
}

export async function importWritingTestFile(file: File, validate: boolean) {
  const form = new FormData();
  form.set("file", file);
  const result = await writingRequest(
    `${base}/tests/${validate ? "imports/validate" : "import"}`,
    {
      method: "POST",
      form,
      refresh: true,
      fallback: "Không thể xử lý file đề thi.",
    },
  );
  if (!result || typeof result !== "object")
    throw new Error("Phản hồi import không hợp lệ.");
  if (!validate) {
    if (!("id" in result) || typeof result.id !== "string")
      throw new Error("Phản hồi import không hợp lệ.");
    return { id: result.id };
  }
  if (
    !("isValid" in result) ||
    typeof result.isValid !== "boolean" ||
    !("errors" in result) ||
    !Array.isArray(result.errors) ||
    !result.errors.every((error: unknown) => typeof error === "string")
  )
    throw new Error("Phản hồi kiểm tra file đề thi không hợp lệ.");
  return { isValid: result.isValid, errors: result.errors as string[] };
}

export function toApiDifficulty(
  diff: WritingDifficulty,
): "EASY" | "MEDIUM" | "HARD" {
  switch (diff) {
    case "Dễ":
      return "EASY";
    case "Trung bình":
      return "MEDIUM";
    case "Khó":
      return "HARD";
    default:
      return "EASY";
  }
}

export function fromApiDifficulty(diff: string): WritingDifficulty {
  switch (diff.toUpperCase()) {
    case "EASY":
      return "Dễ";
    case "MEDIUM":
      return "Trung bình";
    case "HARD":
      return "Khó";
    default:
      return "Dễ";
  }
}

export function exerciseDtoToQuestion(
  dto: WritingExerciseDto,
): AdminWritingQuestion {
  const baseQ = {
    id: dto.id,
    code: dto.code,
    topic: dto.topic,
    difficulty: fromApiDifficulty(dto.difficulty),
    status: dto.status,
    updatedAtLabel: new Date(dto.updatedAtUtc).toLocaleString("vi-VN"),
    rubricNotes: dto.rubricNotes ?? "",
    modelAnswer: dto.modelAnswer ?? "",
    version: dto.version,
  };
  if (dto.part === 1) {
    return {
      ...baseQ,
      part: 1,
      imageName: dto.imageAssetId ?? "",
      imageAssetId: dto.imageAssetId ?? undefined,
      imageAlt: dto.imageAlt ?? "",
      keywordOne: dto.keywordOne ?? "",
      keywordTwo: dto.keywordTwo ?? "",
    };
  }
  if (dto.part === 2) {
    return {
      ...baseQ,
      part: 2,
      sender: dto.sender ?? "",
      recipient: dto.recipient ?? "",
      subject: dto.subject ?? "",
      emailBody: dto.emailBody ?? "",
      directions: dto.directions ?? "",
    };
  }
  return {
    ...baseQ,
    part: 3,
    prompt: dto.prompt ?? "",
    minimumWordCount: dto.minimumWordCount ?? 300,
    outline: dto.outline ?? "",
  };
}

export function testDtoToAdminTest(dto: WritingTestDto): AdminWritingTest {
  const questionIds: Record<WritingPart, string[]> = {
    1: [],
    2: [],
    3: [],
  };
  const sorted = [...dto.questions].sort(
    (a, b) => a.sequenceNumber - b.sequenceNumber,
  );
  for (const q of sorted) {
    if ((q.part === 1 || q.part === 2 || q.part === 3) && q.exerciseId) {
      questionIds[q.part].push(q.exerciseId);
    }
  }
  return {
    id: dto.id,
    code: dto.code,
    title: dto.title,
    description: dto.description ?? "",
    status: dto.status,
    timingTemplateId: "toeic-writing-standard",
    questionIds,
    version: dto.version,
    updatedAtLabel: new Date(dto.updatedAtUtc).toLocaleString("vi-VN"),
  };
}

function queryString(values: Record<string, unknown>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values))
    if (
      value !== undefined &&
      value !== null &&
      value !== "" &&
      value !== "ALL"
    )
      params.set(key, String(value));
  return params.toString();
}

export async function listWritingExercises(
  query: {
    part?: number;
    query?: string;
    difficulty?: string;
    status?: string;
    pageNumber?: number;
    pageSize?: number;
  },
  signal?: AbortSignal,
): Promise<WritingExercisePageDto> {
  const qs = queryString(query);
  return (await writingRequest(`${base}/exercises${qs ? `?${qs}` : ""}`, {
    signal,
    refresh: true,
    fallback: "Không thể tải danh sách bài tập Writing.",
  })) as WritingExercisePageDto;
}

export async function getWritingExercise(
  exerciseId: string,
  signal?: AbortSignal,
): Promise<WritingExerciseDto> {
  return (await writingRequest(
    `${base}/exercises/${encodeURIComponent(exerciseId)}`,
    {
      signal,
      refresh: true,
      fallback: "Không thể tải chi tiết bài tập Writing.",
    },
  )) as WritingExerciseDto;
}

export async function createWritingExercise(
  input: WritingExerciseInput,
): Promise<WritingExerciseDto> {
  return (await writingRequest(`${base}/exercises`, {
    method: "POST",
    json: input,
    refresh: true,
    fallback: "Không thể tạo bài tập Writing.",
  })) as WritingExerciseDto;
}

export async function updateWritingExercise(
  exerciseId: string,
  version: number,
  exercise: WritingExerciseInput,
): Promise<WritingExerciseDto> {
  return (await writingRequest(
    `${base}/exercises/${encodeURIComponent(exerciseId)}`,
    {
      method: "PUT",
      json: { version, exercise },
      refresh: true,
      fallback: "Không thể cập nhật bài tập Writing.",
    },
  )) as WritingExerciseDto;
}

export async function archiveWritingExercise(
  exerciseId: string,
  version: number,
): Promise<void> {
  await writingRequest(
    `${base}/exercises/${encodeURIComponent(exerciseId)}?version=${version}`,
    {
      method: "DELETE",
      refresh: true,
      fallback: "Không thể lưu trữ bài tập Writing.",
    },
  );
}

export async function uploadWritingImage(
  file: File,
): Promise<WritingMediaAssetDto> {
  const form = new FormData();
  form.set("file", file);
  return (await writingRequest(`${base}/media/images`, {
    method: "POST",
    form,
    refresh: true,
    fallback: "Không thể tải ảnh đề bài lên.",
  })) as WritingMediaAssetDto;
}

export async function listWritingTests(
  query: {
    query?: string;
    status?: string;
    pageNumber?: number;
    pageSize?: number;
  },
  signal?: AbortSignal,
): Promise<WritingTestPageDto> {
  const qs = queryString(query);
  return (await writingRequest(`${base}/tests${qs ? `?${qs}` : ""}`, {
    signal,
    refresh: true,
    fallback: "Không thể tải danh sách đề Writing.",
  })) as WritingTestPageDto;
}

export async function getWritingTest(
  testId: string,
  signal?: AbortSignal,
): Promise<WritingTestDto> {
  return (await writingRequest(`${base}/tests/${encodeURIComponent(testId)}`, {
    signal,
    refresh: true,
    fallback: "Không thể tải chi tiết đề Writing.",
  })) as WritingTestDto;
}

export async function createWritingTest(
  input: WritingTestInput,
): Promise<WritingTestDto> {
  return (await writingRequest(`${base}/tests`, {
    method: "POST",
    json: input,
    refresh: true,
    fallback: "Không thể tạo đề Writing.",
  })) as WritingTestDto;
}

export async function updateWritingTest(
  testId: string,
  version: number,
  test: WritingTestInput,
): Promise<WritingTestDto> {
  return (await writingRequest(`${base}/tests/${encodeURIComponent(testId)}`, {
    method: "PUT",
    json: { version, test },
    refresh: true,
    fallback: "Không thể cập nhật đề Writing.",
  })) as WritingTestDto;
}

export async function publishWritingTest(
  testId: string,
  version: number,
): Promise<WritingTestDto> {
  return (await writingRequest(
    `${base}/tests/${encodeURIComponent(testId)}/publish`,
    {
      method: "POST",
      json: { version },
      refresh: true,
      fallback: "Không thể công bố đề Writing.",
    },
  )) as WritingTestDto;
}

export async function deleteWritingTestDraft(
  testId: string,
  version: number,
): Promise<void> {
  await writingRequest(
    `${base}/tests/${encodeURIComponent(testId)}?version=${version}`,
    {
      method: "DELETE",
      refresh: true,
      fallback: "Không thể xóa đề nháp Writing.",
    },
  );
}

export async function archiveWritingTest(
  testId: string,
  version: number,
): Promise<WritingTestDto> {
  return (await writingRequest(
    `${base}/tests/${encodeURIComponent(testId)}/archive`,
    {
      method: "POST",
      json: { version },
      refresh: true,
      fallback: "Không thể lưu trữ đề Writing.",
    },
  )) as WritingTestDto;
}

export async function restoreWritingTest(
  testId: string,
  version: number,
): Promise<WritingTestDto> {
  return (await writingRequest(
    `${base}/tests/${encodeURIComponent(testId)}/restore`,
    {
      method: "POST",
      json: { version },
      refresh: true,
      fallback: "Không thể khôi phục đề Writing.",
    },
  )) as WritingTestDto;
}
