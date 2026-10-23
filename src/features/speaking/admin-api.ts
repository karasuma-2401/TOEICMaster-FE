import { speakingRequest } from "./http";
import {
  invalid,
  isCount,
  isRecord,
  isString,
  parseExercise,
  parsePage,
  parseTestDetail,
  parseTestListItem,
} from "./parsers";
import {
  speakingParts,
  type DescribePictureContent,
  type SpeakingContent,
  type SpeakingDifficulty,
  type SpeakingExercise,
  type SpeakingExerciseMeta,
  type SpeakingExerciseStatus,
  type SpeakingPart,
  type SpeakingTest,
  type SpeakingTestStatus,
} from "./types";

// Admin Speaking API through the same-origin BFF `/api/admin/speaking/*`.

const base = "/api/admin/speaking";

/** Body for creating or updating an exercise; `imageUrl` is display-only. */
export type SpeakingExerciseInput = Omit<
  SpeakingExerciseMeta,
  "id" | "version" | "updatedAtUtc"
> &
  (
    | Exclude<SpeakingContent, DescribePictureContent>
    | Omit<DescribePictureContent, "imageUrl">
  );

export interface SpeakingTestInput {
  code: string;
  title: string;
  description: string;
  exerciseIds: SpeakingTest["exerciseIds"];
}

export interface ExerciseQuery {
  part?: SpeakingPart;
  query?: string;
  difficulty?: SpeakingDifficulty;
  status?: SpeakingExerciseStatus;
  pageNumber: number;
  pageSize: number;
}

export interface TestQuery {
  query?: string;
  status?: SpeakingTestStatus;
  pageNumber: number;
  pageSize: number;
}

export interface SpeakingAdminSummary {
  exercises: {
    total: number;
    published: number;
    draft: number;
    archived: number;
  };
  tests: { total: number; published: number; draft: number };
}

function queryString(values: object) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values))
    if (value !== undefined && value !== "") params.set(key, String(value));
  return params.toString();
}

function testBody(input: SpeakingTestInput) {
  return {
    code: input.code,
    title: input.title,
    description: input.description,
    exercises: speakingParts.flatMap((part) =>
      input.exerciseIds[part].map((exerciseId, index) => ({
        exerciseId,
        part,
        sequenceNumber: index + 1,
      })),
    ),
  };
}

export async function getSpeakingAdminSummary(
  signal?: AbortSignal,
): Promise<SpeakingAdminSummary> {
  const value = await speakingRequest(`${base}/summary`, {
    signal,
    refresh: true,
    fallback: "Không thể tải thống kê Speaking.",
  });
  const counts = (record: unknown, keys: string[]) =>
    isRecord(record) && keys.every((key) => isCount(record[key]));
  if (
    !isRecord(value) ||
    !counts(value.exercises, ["total", "published", "draft", "archived"]) ||
    !counts(value.tests, ["total", "published", "draft"])
  )
    invalid("thống kê Speaking");
  return value as unknown as SpeakingAdminSummary;
}

export async function listSpeakingExercises(
  query: ExerciseQuery,
  signal?: AbortSignal,
) {
  return parsePage(
    await speakingRequest(`${base}/exercises?${queryString(query)}`, {
      signal,
      refresh: true,
      fallback: "Không thể tải ngân hàng bài tập Speaking.",
    }),
    parseExercise,
    "danh sách bài tập Speaking",
  );
}

export async function createSpeakingExercise(input: SpeakingExerciseInput) {
  return parseExercise(
    await speakingRequest(`${base}/exercises`, {
      method: "POST",
      json: input,
      refresh: true,
      fallback: "Không thể tạo bài tập Speaking.",
    }),
  );
}

export async function updateSpeakingExercise(
  id: string,
  version: number,
  input: SpeakingExerciseInput,
) {
  return parseExercise(
    await speakingRequest(`${base}/exercises/${encodeURIComponent(id)}`, {
      method: "PUT",
      json: { version, exercise: input },
      refresh: true,
      fallback: "Không thể lưu bài tập Speaking.",
    }),
  );
}

export async function archiveSpeakingExercise(
  exercise: Pick<SpeakingExercise, "id" | "version">,
) {
  await speakingRequest(
    `${base}/exercises/${encodeURIComponent(exercise.id)}?version=${exercise.version}`,
    {
      method: "DELETE",
      refresh: true,
      fallback: "Không thể lưu trữ bài tập Speaking.",
    },
  );
}

export async function uploadSpeakingImage(file: File) {
  const form = new FormData();
  form.set("file", file);
  const value = await speakingRequest(`${base}/media/images`, {
    method: "POST",
    form,
    refresh: true,
    fallback: "Không thể tải ảnh lên.",
  });
  if (!isRecord(value) || !isString(value.id)) invalid("tải ảnh");
  return { id: value.id };
}

export async function listSpeakingTests(
  query: TestQuery,
  signal?: AbortSignal,
) {
  return parsePage(
    await speakingRequest(`${base}/tests?${queryString(query)}`, {
      signal,
      refresh: true,
      fallback: "Không thể tải danh sách đề Speaking.",
    }),
    parseTestListItem,
    "danh sách đề Speaking",
  );
}

export async function getSpeakingTestDetail(id: string, signal?: AbortSignal) {
  return parseTestDetail(
    await speakingRequest(`${base}/tests/${encodeURIComponent(id)}`, {
      signal,
      refresh: true,
      fallback: "Không thể tải đề Speaking.",
    }),
  );
}

export async function createSpeakingTest(input: SpeakingTestInput) {
  return parseTestDetail(
    await speakingRequest(`${base}/tests`, {
      method: "POST",
      json: testBody(input),
      refresh: true,
      fallback: "Không thể tạo đề Speaking.",
    }),
  );
}

export async function updateSpeakingTest(
  id: string,
  version: number,
  input: SpeakingTestInput,
) {
  return parseTestDetail(
    await speakingRequest(`${base}/tests/${encodeURIComponent(id)}`, {
      method: "PUT",
      json: { version, test: testBody(input) },
      refresh: true,
      fallback: "Không thể lưu đề Speaking.",
    }),
  );
}

export async function publishSpeakingTest(id: string, version: number) {
  return parseTestDetail(
    await speakingRequest(`${base}/tests/${encodeURIComponent(id)}/publish`, {
      method: "POST",
      json: { version },
      refresh: true,
      fallback: "Không thể công bố đề Speaking.",
    }),
  );
}
