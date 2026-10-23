import type { SpeakingExerciseInput } from "./admin-api";
import type {
  InformationRow,
  SpeakingContent,
  SpeakingDifficulty,
  SpeakingExercise,
  SpeakingExerciseStatus,
  SpeakingPart,
} from "./types";

/** Flat editable form state covering every Speaking Part. */
export interface SpeakingDraft {
  /** `null` until the backend has created the exercise. */
  id: string | null;
  version: number;
  part: SpeakingPart;
  code: string;
  topic: string;
  difficulty: SpeakingDifficulty;
  status: SpeakingExerciseStatus;
  rubricNotes: string;
  modelAnswer: string;
  passage: string;
  imageAssetId: string | null;
  imageUrl: string | null;
  imageAlt: string;
  context: string;
  documentTitle: string;
  /** One `label | value` pair per line. */
  documentRows: string;
  callerIntro: string;
  questions: [string, string, string];
  prompt: string;
}

export function formatDocumentRows(rows: InformationRow[]) {
  return rows.map((row) => `${row.label} | ${row.value}`).join("\n");
}

export function parseDocumentRows(value: string): InformationRow[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, ...rest] = line.split("|");
      return { label: label.trim(), value: rest.join("|").trim() };
    });
}

const threeQuestions = (questions: (string | null)[]) =>
  [0, 1, 2].map((index) => questions[index] ?? "") as [string, string, string];

export function toSpeakingDraft(
  exercise?: SpeakingExercise,
  part: SpeakingPart = 1,
): SpeakingDraft {
  const draft: SpeakingDraft = {
    id: exercise?.id ?? null,
    version: exercise?.version ?? 0,
    part: exercise?.part ?? part,
    code: exercise?.code ?? "",
    topic: exercise?.topic ?? "",
    difficulty: exercise?.difficulty ?? "EASY",
    status: exercise?.status ?? "DRAFT",
    rubricNotes: exercise?.rubricNotes ?? "",
    modelAnswer: exercise?.modelAnswer ?? "",
    passage: "",
    imageAssetId: null,
    imageUrl: null,
    imageAlt: "",
    context: "",
    documentTitle: "",
    documentRows: "",
    callerIntro: "",
    questions: ["", "", ""],
    prompt: "",
  };
  if (!exercise) return draft;
  switch (exercise.part) {
    case 1:
      return { ...draft, passage: exercise.passage };
    case 2:
      return {
        ...draft,
        imageAssetId: exercise.imageAssetId,
        imageUrl: exercise.imageUrl,
        imageAlt: exercise.imageAlt,
      };
    case 3:
      return {
        ...draft,
        context: exercise.context,
        questions: threeQuestions(exercise.questions),
      };
    case 4:
      return {
        ...draft,
        documentTitle: exercise.documentTitle,
        documentRows: formatDocumentRows(exercise.documentRows),
        callerIntro: exercise.callerIntro,
        questions: threeQuestions(exercise.questions),
      };
    case 5:
      return { ...draft, prompt: exercise.prompt };
  }
}

/** Validates the draft and builds the request body, or returns a Vietnamese error. */
export function fromSpeakingDraft(
  draft: SpeakingDraft,
): { input: SpeakingExerciseInput } | { error: string } {
  const base = {
    code: draft.code.trim(),
    topic: draft.topic.trim(),
    difficulty: draft.difficulty,
    status: draft.status,
    rubricNotes: draft.rubricNotes.trim(),
    modelAnswer: draft.modelAnswer.trim(),
  };
  if (!base.code || !base.topic)
    return { error: "Mã bài và chủ đề là bắt buộc." };
  if (!base.modelAnswer)
    return { error: "Bài mẫu là bắt buộc để chấm và tự đánh giá." };
  const questions = draft.questions.map((question) => question.trim());
  switch (draft.part) {
    case 1:
      return draft.passage.trim()
        ? { input: { ...base, part: 1, passage: draft.passage.trim() } }
        : { error: "Part 1 cần đoạn văn để đọc." };
    case 2:
      return draft.imageAssetId && draft.imageAlt.trim()
        ? {
            input: {
              ...base,
              part: 2,
              imageAssetId: draft.imageAssetId,
              imageAlt: draft.imageAlt.trim(),
            },
          }
        : { error: "Part 2 cần ảnh đã tải lên và mô tả ảnh." };
    case 3:
      return draft.context.trim() && questions.every(Boolean)
        ? {
            input: {
              ...base,
              part: 3,
              context: draft.context.trim(),
              questions,
            },
          }
        : { error: "Part 3 cần bối cảnh và đủ 3 câu hỏi." };
    case 4: {
      const rows = parseDocumentRows(draft.documentRows);
      if (
        !draft.documentTitle.trim() ||
        rows.length === 0 ||
        rows.some((row) => !row.label || !row.value)
      )
        return {
          error: "Part 4 cần tiêu đề và bảng thông tin dạng “nhãn | nội dung”.",
        };
      if (!questions.every(Boolean))
        return { error: "Part 4 cần đủ 3 câu hỏi." };
      return {
        input: {
          ...base,
          part: 4,
          documentTitle: draft.documentTitle.trim(),
          documentRows: rows,
          callerIntro: draft.callerIntro.trim(),
          questions,
        },
      };
    }
    case 5:
      return draft.prompt.trim()
        ? { input: { ...base, part: 5, prompt: draft.prompt.trim() } }
        : { error: "Part 5 cần đề bài nêu quan điểm." };
  }
}

const placeholder = "…";

/** Lenient conversion for the live preview; empty fields show a placeholder. */
export function previewFromDraft(draft: SpeakingDraft): SpeakingContent {
  const text = (value: string) => value.trim() || placeholder;
  const questions = draft.questions.map(text);
  switch (draft.part) {
    case 1:
      return { part: 1, passage: text(draft.passage) };
    case 2:
      return {
        part: 2,
        imageAssetId: draft.imageAssetId,
        imageUrl: draft.imageUrl,
        imageAlt: text(draft.imageAlt),
      };
    case 3:
      return { part: 3, context: text(draft.context), questions };
    case 4: {
      const rows = parseDocumentRows(draft.documentRows);
      return {
        part: 4,
        documentTitle: text(draft.documentTitle),
        documentRows: rows.length
          ? rows
          : [{ label: placeholder, value: placeholder }],
        callerIntro: text(draft.callerIntro),
        questions,
      };
    }
    case 5:
      return { part: 5, prompt: text(draft.prompt) };
  }
}
