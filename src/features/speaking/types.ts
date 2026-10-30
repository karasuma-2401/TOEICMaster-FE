// Speaking domain types. Field names and enum values match the backend
// contract in docs/speaking-be-handoff.md.

export type SpeakingPart = 1 | 2 | 3 | 4 | 5;

export const speakingParts: readonly SpeakingPart[] = [1, 2, 3, 4, 5];

export type SpeakingDifficulty = "EASY" | "MEDIUM" | "HARD";

export type SpeakingExerciseStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type SpeakingTestStatus = "DRAFT" | "PUBLISHED";

export type SpeakingMode =
  "FULL" | "PART_1" | "PART_2" | "PART_3" | "PART_4" | "PART_5";

/** Part 1 · Read a text aloud. */
export interface ReadAloudContent {
  part: 1;
  passage: string;
}

/** Part 2 · Describe a picture. `imageUrl` is the same-origin BFF URL. */
export interface DescribePictureContent {
  part: 2;
  imageAssetId: string | null;
  imageUrl: string | null;
  imageAlt: string;
}

/**
 * Part 3 · Respond to three questions about one everyday topic. In an attempt,
 * questions the learner has not reached yet are `null`.
 */
export interface RespondQuestionsContent {
  part: 3;
  context: string;
  questions: (string | null)[];
}

export interface InformationRow {
  label: string;
  value: string;
}

/** Part 4 · Respond to three questions using a schedule or agenda. */
export interface InformationContent {
  part: 4;
  documentTitle: string;
  documentRows: InformationRow[];
  callerIntro: string;
  questions: (string | null)[];
}

/** Part 5 · Express an opinion. */
export interface OpinionContent {
  part: 5;
  prompt: string;
}

/** What a learner sees for one exercise; shared by attempts and admin previews. */
export type SpeakingContent =
  | ReadAloudContent
  | DescribePictureContent
  | RespondQuestionsContent
  | InformationContent
  | OpinionContent;

export interface SpeakingExerciseMeta {
  id: string;
  code: string;
  topic: string;
  difficulty: SpeakingDifficulty;
  status: SpeakingExerciseStatus;
  rubricNotes: string;
  modelAnswer: string;
  version: number;
  updatedAtUtc: string;
}

/** Admin view of a bank exercise. */
export type SpeakingExercise = SpeakingExerciseMeta & SpeakingContent;

/** Admin view of a test; `exerciseIds` lists slot order per Part. */
export interface SpeakingTest {
  id: string;
  code: string;
  title: string;
  description: string;
  status: SpeakingTestStatus;
  version: number;
  updatedAtUtc: string;
  publishedAtUtc: string | null;
  exerciseIds: Record<SpeakingPart, string[]>;
}

export interface Page<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}
