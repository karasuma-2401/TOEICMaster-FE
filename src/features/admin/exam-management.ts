export interface ReadingExamListItem {
  examId: string;
  code: string;
  title: string;
  revisionId: string;
  versionNumber: number;
  status: "Draft" | "Published";
  createdAtUtc: string;
}

export interface ReadingExamPage {
  items: ReadingExamListItem[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ScoreProfile {
  id: string;
  name: string;
  isComplete: boolean;
  mappingCount: number;
}

export interface ReadingQuestion {
  number: number;
  code: string | null;
  stem: string | null;
  optionA: string | null;
  optionB: string | null;
  optionC: string | null;
  optionD: string | null;
  correctKey: string | null;
  translation: string | null;
  explanation: string | null;
  imageAssetId: string | null;
}

export interface ReadingContext {
  ordinal: number;
  type: "Text" | "Image";
  text: string | null;
  imageAssetId: string | null;
  altText: string | null;
}

export interface ReadingBlock {
  key: string;
  part: number;
  type: string;
  firstQuestionNumber: number;
  contextBlocks: ReadingContext[];
  questions: ReadingQuestion[];
}

export interface ReadingRevision {
  examId: string;
  code: string;
  title: string;
  revisionId: string;
  versionNumber: number;
  status: "Draft" | "Published";
  scoreProfileId: string;
  hasMasterAudio: boolean;
  blocks: ReadingBlock[];
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

function isNullableGuid(value: unknown): value is string | null {
  return value === null || isGuid(value);
}

function isReadingExamListItem(value: unknown): value is ReadingExamListItem {
  if (!isRecord(value)) return false;
  return (
    isGuid(value.examId) &&
    typeof value.code === "string" &&
    typeof value.title === "string" &&
    isGuid(value.revisionId) &&
    isPositiveInteger(value.versionNumber) &&
    (value.status === "Draft" || value.status === "Published") &&
    isDate(value.createdAtUtc)
  );
}

export function parseReadingExamPage(value: unknown): ReadingExamPage {
  if (
    !isRecord(value) ||
    !Array.isArray(value.items) ||
    !value.items.every(isReadingExamListItem) ||
    !isPositiveInteger(value.pageNumber) ||
    !isPositiveInteger(value.pageSize) ||
    !isNonNegativeInteger(value.totalCount) ||
    !isNonNegativeInteger(value.totalPages) ||
    typeof value.hasNextPage !== "boolean" ||
    typeof value.hasPreviousPage !== "boolean"
  )
    throw new Error("Phản hồi danh sách đề Reading không hợp lệ.");
  return value as unknown as ReadingExamPage;
}

function isReadingQuestion(value: unknown): value is ReadingQuestion {
  if (!isRecord(value)) return false;
  return (
    isPositiveInteger(value.number) &&
    isNullableString(value.code) &&
    isNullableString(value.stem) &&
    isNullableString(value.optionA) &&
    isNullableString(value.optionB) &&
    isNullableString(value.optionC) &&
    isNullableString(value.optionD) &&
    isNullableString(value.correctKey) &&
    isNullableString(value.translation) &&
    isNullableString(value.explanation) &&
    isNullableGuid(value.imageAssetId)
  );
}

function isReadingContext(value: unknown): value is ReadingContext {
  if (!isRecord(value)) return false;
  return (
    isPositiveInteger(value.ordinal) &&
    (value.type === "Text" || value.type === "Image") &&
    isNullableString(value.text) &&
    isNullableGuid(value.imageAssetId) &&
    isNullableString(value.altText)
  );
}

function isReadingBlock(value: unknown): value is ReadingBlock {
  if (!isRecord(value)) return false;
  return (
    typeof value.key === "string" &&
    isPositiveInteger(value.part) &&
    typeof value.type === "string" &&
    isPositiveInteger(value.firstQuestionNumber) &&
    Array.isArray(value.contextBlocks) &&
    value.contextBlocks.every(isReadingContext) &&
    Array.isArray(value.questions) &&
    value.questions.every(isReadingQuestion)
  );
}

export function parseReadingRevision(value: unknown): ReadingRevision {
  if (
    !isRecord(value) ||
    !isGuid(value.examId) ||
    typeof value.code !== "string" ||
    typeof value.title !== "string" ||
    !isGuid(value.revisionId) ||
    !isPositiveInteger(value.versionNumber) ||
    (value.status !== "Draft" && value.status !== "Published") ||
    !isGuid(value.scoreProfileId) ||
    typeof value.hasMasterAudio !== "boolean" ||
    !Array.isArray(value.blocks) ||
    !value.blocks.every(isReadingBlock)
  )
    throw new Error("Phản hồi revision Reading không hợp lệ.");
  return value as unknown as ReadingRevision;
}

export function parseScoreProfiles(value: unknown): ScoreProfile[] {
  if (
    !Array.isArray(value) ||
    !value.every(
      (item) =>
        isRecord(item) &&
        isGuid(item.id) &&
        typeof item.name === "string" &&
        typeof item.isComplete === "boolean" &&
        isNonNegativeInteger(item.mappingCount),
    )
  )
    throw new Error("Phản hồi barem điểm không hợp lệ.");
  return value as ScoreProfile[];
}

export function formatAdminDate(value: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
