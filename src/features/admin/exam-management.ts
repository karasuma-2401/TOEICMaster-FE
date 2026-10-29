export const ADMIN_EXAM_PAGE_SIZES = [10, 20, 50] as const;
export const EXAM_STATUSES = ["DRAFT", "PUBLISHED"] as const;

export type ExamKind = "reading" | "writing";
export type ExamStatus = "ALL" | (typeof EXAM_STATUSES)[number];

export interface ExamListQuery {
  kind: ExamKind;
  status: ExamStatus;
  page: number;
  pageSize: (typeof ADMIN_EXAM_PAGE_SIZES)[number];
  q: string;
}

export const DEFAULT_EXAM_LIST_QUERY: ExamListQuery = {
  kind: "reading",
  status: "ALL",
  page: 1,
  pageSize: 20,
  q: "",
};

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

export interface WritingTestQuestion {
  id: string;
  exerciseId: string;
  part: 1 | 2 | 3;
  sequenceNumber: number;
  snapshotJson: string | null;
}

export interface WritingTest {
  id: string;
  code: string;
  title: string;
  description: string;
  status: "DRAFT" | "PUBLISHED";
  version: number;
  createdAtUtc: string;
  updatedAtUtc: string;
  publishedAtUtc: string | null;
  questions: WritingTestQuestion[];
}

export interface WritingTestPage {
  items: WritingTest[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface WritingExercise {
  id: string;
  part: 1 | 2 | 3;
  code: string;
  topic: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  rubricNotes: string;
  modelAnswer: string;
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

export interface WritingExercisePage {
  items: WritingExercise[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
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

function isWritingTestQuestion(value: unknown): value is WritingTestQuestion {
  if (!isRecord(value)) return false;
  return (
    isGuid(value.id) &&
    isGuid(value.exerciseId) &&
    (value.part === 1 || value.part === 2 || value.part === 3) &&
    isPositiveInteger(value.sequenceNumber) &&
    isNullableString(value.snapshotJson)
  );
}

function isWritingTest(value: unknown): value is WritingTest {
  if (!isRecord(value)) return false;
  return (
    isGuid(value.id) &&
    typeof value.code === "string" &&
    typeof value.title === "string" &&
    typeof value.description === "string" &&
    (value.status === "DRAFT" || value.status === "PUBLISHED") &&
    isPositiveInteger(value.version) &&
    isDate(value.createdAtUtc) &&
    isDate(value.updatedAtUtc) &&
    (value.publishedAtUtc === null || isDate(value.publishedAtUtc)) &&
    Array.isArray(value.questions) &&
    value.questions.every(isWritingTestQuestion)
  );
}

function isWritingExercise(value: unknown): value is WritingExercise {
  if (!isRecord(value)) return false;
  return (
    isGuid(value.id) &&
    (value.part === 1 || value.part === 2 || value.part === 3) &&
    typeof value.code === "string" &&
    typeof value.topic === "string" &&
    (value.difficulty === "EASY" ||
      value.difficulty === "MEDIUM" ||
      value.difficulty === "HARD") &&
    (value.status === "DRAFT" ||
      value.status === "PUBLISHED" ||
      value.status === "ARCHIVED") &&
    typeof value.rubricNotes === "string" &&
    typeof value.modelAnswer === "string" &&
    isNullableGuid(value.imageAssetId) &&
    isNullableString(value.imageAlt) &&
    isNullableString(value.keywordOne) &&
    isNullableString(value.keywordTwo) &&
    isNullableString(value.sender) &&
    isNullableString(value.recipient) &&
    isNullableString(value.subject) &&
    isNullableString(value.emailBody) &&
    isNullableString(value.directions) &&
    isNullableString(value.prompt) &&
    (value.minimumWordCount === null ||
      isPositiveInteger(value.minimumWordCount)) &&
    isNullableString(value.outline) &&
    isPositiveInteger(value.version) &&
    isDate(value.createdAtUtc) &&
    isDate(value.updatedAtUtc)
  );
}

export function parseExamListQuery(params: URLSearchParams): ExamListQuery {
  const page = Number(params.get("page"));
  const pageSize = Number(params.get("pageSize"));
  const requestedStatus = params.get("status");
  return {
    kind: params.get("kind") === "writing" ? "writing" : "reading",
    status:
      requestedStatus === "DRAFT" || requestedStatus === "PUBLISHED"
        ? requestedStatus
        : "ALL",
    page: Number.isInteger(page) && page > 0 ? Math.min(page, 10_000) : 1,
    pageSize:
      Number.isInteger(pageSize) &&
      pageSize > ADMIN_EXAM_PAGE_SIZES[ADMIN_EXAM_PAGE_SIZES.length - 1]
        ? ADMIN_EXAM_PAGE_SIZES[ADMIN_EXAM_PAGE_SIZES.length - 1]
        : (ADMIN_EXAM_PAGE_SIZES.find((value) => value === pageSize) ??
          DEFAULT_EXAM_LIST_QUERY.pageSize),
    q: (params.get("q") ?? "").trim().slice(0, 100),
  };
}

export function examListQueryString(query: ExamListQuery): string {
  const params = new URLSearchParams({
    kind: query.kind,
    page: String(query.page),
    pageSize: String(query.pageSize),
  });
  if (query.status !== "ALL") params.set("status", query.status);
  if (query.q) params.set("q", query.q);
  return params.toString();
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

export function parseWritingTestPage(value: unknown): WritingTestPage {
  if (
    !isRecord(value) ||
    !Array.isArray(value.items) ||
    !value.items.every(isWritingTest) ||
    !isPositiveInteger(value.pageNumber) ||
    !isPositiveInteger(value.pageSize) ||
    !isNonNegativeInteger(value.totalCount)
  )
    throw new Error("Phản hồi danh sách đề Writing không hợp lệ.");
  return {
    items: value.items,
    pageNumber: value.pageNumber,
    pageSize: value.pageSize,
    totalCount: value.totalCount,
    totalPages: Math.ceil(value.totalCount / value.pageSize),
  };
}

export function parseWritingTest(value: unknown): WritingTest {
  if (!isWritingTest(value))
    throw new Error("Phản hồi đề Writing không hợp lệ.");
  return value;
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

export function parseWritingExercisePage(value: unknown): WritingExercisePage {
  if (
    !isRecord(value) ||
    !Array.isArray(value.items) ||
    !value.items.every(isWritingExercise) ||
    !isPositiveInteger(value.pageNumber) ||
    !isPositiveInteger(value.pageSize) ||
    !isNonNegativeInteger(value.totalCount)
  )
    throw new Error("Phản hồi ngân hàng bài tập Writing không hợp lệ.");
  return {
    items: value.items,
    pageNumber: value.pageNumber,
    pageSize: value.pageSize,
    totalCount: value.totalCount,
    totalPages: Math.ceil(value.totalCount / value.pageSize),
  };
}

export function writingPartLabel(part: 1 | 2 | 3): string {
  return (
    {
      1: "Part 1 · Viết câu theo tranh",
      2: "Part 2 · Trả lời email",
      3: "Part 3 · Viết bài luận",
    } as const
  )[part];
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
