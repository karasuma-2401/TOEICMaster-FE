import type {
  SpeakingContent,
  SpeakingDifficulty,
  SpeakingExerciseStatus,
} from "./types";

export const difficultyOptions: SpeakingDifficulty[] = [
  "EASY",
  "MEDIUM",
  "HARD",
];

export const difficultyLabel: Record<SpeakingDifficulty, string> = {
  EASY: "Dễ",
  MEDIUM: "Trung bình",
  HARD: "Khó",
};

export const exerciseStatusOptions: SpeakingExerciseStatus[] = [
  "PUBLISHED",
  "DRAFT",
  "ARCHIVED",
];

export const exerciseStatusLabel: Record<SpeakingExerciseStatus, string> = {
  PUBLISHED: "Hiển thị",
  DRAFT: "Bản nháp",
  ARCHIVED: "Lưu trữ",
};

/** Short content preview for tables and pickers. */
export function exerciseHeadline(content: SpeakingContent) {
  switch (content.part) {
    case 1:
      return content.passage;
    case 2:
      return content.imageAlt;
    case 3:
      return content.context;
    case 4:
      return content.documentTitle;
    case 5:
      return content.prompt;
  }
}

export function formatUpdatedAt(value: string) {
  return new Date(value).toLocaleString("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  });
}
