import { SpeakingApiError } from "./http";
import type {
  InformationRow,
  Page,
  SpeakingContent,
  SpeakingDifficulty,
  SpeakingExercise,
  SpeakingExerciseStatus,
  SpeakingMode,
  SpeakingPart,
  SpeakingTest,
  SpeakingTestStatus,
} from "./types";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function invalid(what: string): never {
  throw new SpeakingApiError(502, `Phản hồi ${what} không hợp lệ.`);
}

export const isString = (value: unknown): value is string =>
  typeof value === "string";
export const isDate = (value: unknown): value is string =>
  isString(value) && !Number.isNaN(Date.parse(value));
export const isNullableDate = (value: unknown): value is string | null =>
  value === null || isDate(value);
export const isCount = (value: unknown): value is number =>
  Number.isInteger(value) && (value as number) >= 0;
export const isPart = (value: unknown): value is SpeakingPart =>
  value === 1 || value === 2 || value === 3 || value === 4 || value === 5;
export const isMode = (value: unknown): value is SpeakingMode =>
  value === "FULL" || (isString(value) && /^PART_[1-5]$/.test(value));
const isDifficulty = (value: unknown): value is SpeakingDifficulty =>
  value === "EASY" || value === "MEDIUM" || value === "HARD";
const isExerciseStatus = (value: unknown): value is SpeakingExerciseStatus =>
  value === "DRAFT" || value === "PUBLISHED" || value === "ARCHIVED";
const isTestStatus = (value: unknown): value is SpeakingTestStatus =>
  value === "DRAFT" || value === "PUBLISHED";

/** Same-origin media URL for an asset, through the admin or learner BFF. */
export type MediaScope = "admin" | "public";

export function mediaUrl(scope: MediaScope, assetId: string) {
  return `${scope === "admin" ? "/api/admin/speaking" : "/api/speaking"}/media/${encodeURIComponent(assetId)}`;
}

function questions(value: unknown, what: string) {
  if (
    !Array.isArray(value) ||
    value.length !== 3 ||
    !value.every((item) => item === null || isString(item))
  )
    invalid(what);
  return value as (string | null)[];
}

function rows(value: unknown, what: string): InformationRow[] {
  if (
    !Array.isArray(value) ||
    !value.every(
      (row) => isRecord(row) && isString(row.label) && isString(row.value),
    )
  )
    invalid(what);
  return value.map((row) => ({ label: row.label, value: row.value }));
}

/** Validates the Part-specific content of an exercise or attempt question. */
export function parseContent(
  value: unknown,
  scope: MediaScope,
  what: string,
): SpeakingContent {
  if (!isRecord(value) || !isPart(value.part)) invalid(what);
  switch (value.part) {
    case 1:
      if (!isString(value.passage)) invalid(what);
      return { part: 1, passage: value.passage };
    case 2: {
      const assetId = value.imageAssetId;
      if (!(assetId === null || isString(assetId)) || !isString(value.imageAlt))
        invalid(what);
      return {
        part: 2,
        imageAssetId: assetId,
        imageUrl: assetId ? mediaUrl(scope, assetId) : null,
        imageAlt: value.imageAlt,
      };
    }
    case 3:
      if (!isString(value.context)) invalid(what);
      return {
        part: 3,
        context: value.context,
        questions: questions(value.questions, what),
      };
    case 4:
      if (
        !isString(value.documentTitle) ||
        !(value.callerIntro === undefined || isString(value.callerIntro))
      )
        invalid(what);
      return {
        part: 4,
        documentTitle: value.documentTitle,
        documentRows: rows(value.documentRows, what),
        callerIntro: value.callerIntro ?? "",
        questions: questions(value.questions, what),
      };
    case 5:
      if (!isString(value.prompt)) invalid(what);
      return { part: 5, prompt: value.prompt };
  }
}

export function parseExercise(value: unknown): SpeakingExercise {
  const what = "bài tập Speaking";
  if (
    !isRecord(value) ||
    !isString(value.id) ||
    !isString(value.code) ||
    !isString(value.topic) ||
    !isDifficulty(value.difficulty) ||
    !isExerciseStatus(value.status) ||
    !isString(value.rubricNotes) ||
    !isString(value.modelAnswer) ||
    !isCount(value.version) ||
    !isDate(value.updatedAtUtc)
  )
    invalid(what);
  return {
    id: value.id,
    code: value.code,
    topic: value.topic,
    difficulty: value.difficulty,
    status: value.status,
    rubricNotes: value.rubricNotes,
    modelAnswer: value.modelAnswer,
    version: value.version,
    updatedAtUtc: value.updatedAtUtc,
    ...parseContent(value, "admin", what),
  };
}

export function parsePage<T>(
  value: unknown,
  item: (value: unknown) => T,
  what: string,
): Page<T> {
  if (
    !isRecord(value) ||
    !Array.isArray(value.items) ||
    !isCount(value.pageNumber) ||
    !isCount(value.pageSize) ||
    !isCount(value.totalCount) ||
    !isCount(value.totalPages)
  )
    invalid(what);
  return {
    items: value.items.map(item),
    pageNumber: value.pageNumber,
    pageSize: value.pageSize,
    totalCount: value.totalCount,
    totalPages: value.totalPages,
  };
}

function emptySlots(): SpeakingTest["exerciseIds"] {
  return { 1: [], 2: [], 3: [], 4: [], 5: [] };
}

/** Admin test detail: the test plus the exercises it references. */
export function parseTestDetail(value: unknown): {
  test: SpeakingTest;
  exercises: SpeakingExercise[];
} {
  const what = "đề Speaking";
  if (
    !isRecord(value) ||
    !isString(value.id) ||
    !isString(value.code) ||
    !isString(value.title) ||
    !isString(value.description) ||
    !isTestStatus(value.status) ||
    !isCount(value.version) ||
    !isDate(value.updatedAtUtc) ||
    !isNullableDate(value.publishedAtUtc) ||
    !Array.isArray(value.exercises)
  )
    invalid(what);
  const slots = value.exercises.map((slot) => {
    if (
      !isRecord(slot) ||
      !isString(slot.exerciseId) ||
      !isPart(slot.part) ||
      !isCount(slot.sequenceNumber)
    )
      invalid(what);
    return {
      exerciseId: slot.exerciseId,
      part: slot.part,
      sequenceNumber: slot.sequenceNumber,
      exercise: parseExercise(slot.exercise),
    };
  });
  const exerciseIds = emptySlots();
  for (const slot of [...slots].sort(
    (a, b) => a.sequenceNumber - b.sequenceNumber,
  ))
    exerciseIds[slot.part].push(slot.exerciseId);
  return {
    test: {
      id: value.id,
      code: value.code,
      title: value.title,
      description: value.description,
      status: value.status,
      version: value.version,
      updatedAtUtc: value.updatedAtUtc,
      publishedAtUtc: value.publishedAtUtc,
      exerciseIds,
    },
    exercises: slots.map((slot) => slot.exercise),
  };
}

export interface SpeakingTestListItem {
  id: string;
  code: string;
  title: string;
  status: SpeakingTestStatus;
  version: number;
  updatedAtUtc: string;
  publishedAtUtc: string | null;
  partCounts: Record<SpeakingPart, number>;
  questionCount: number;
}

export function parseTestListItem(value: unknown): SpeakingTestListItem {
  const what = "danh sách đề Speaking";
  if (
    !isRecord(value) ||
    !isString(value.id) ||
    !isString(value.code) ||
    !isString(value.title) ||
    !isTestStatus(value.status) ||
    !isCount(value.version) ||
    !isDate(value.updatedAtUtc) ||
    !isNullableDate(value.publishedAtUtc) ||
    !isRecord(value.partCounts) ||
    !isCount(value.questionCount)
  )
    invalid(what);
  const counts = value.partCounts;
  const partCounts = emptyCounts();
  for (const part of [1, 2, 3, 4, 5] as const) {
    const count = counts[String(part)];
    if (!isCount(count)) invalid(what);
    partCounts[part] = count;
  }
  return {
    id: value.id,
    code: value.code,
    title: value.title,
    status: value.status,
    version: value.version,
    updatedAtUtc: value.updatedAtUtc,
    publishedAtUtc: value.publishedAtUtc,
    partCounts,
    questionCount: value.questionCount,
  };
}

function emptyCounts(): Record<SpeakingPart, number> {
  return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
}
