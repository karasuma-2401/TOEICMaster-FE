import { partQuestionCount, speakingPartSpecs } from "./part-specs";
import {
  speakingParts,
  type SpeakingExercise,
  type SpeakingTest,
} from "./types";

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

type Lookup = (id: string) => SpeakingExercise | undefined;
type Draft = Pick<SpeakingTest, "code" | "title" | "exerciseIds">;

/**
 * Live publish requirements shown beside the test editor. The backend
 * re-checks them on publish; this only gives early feedback.
 */
export function publishChecklist(test: Draft, lookup: Lookup): ChecklistItem[] {
  const ids = speakingParts.flatMap((part) =>
    test.exerciseIds[part].filter(Boolean),
  );
  return [
    {
      id: "info",
      label: "Có mã đề và tên đề",
      done: Boolean(test.code.trim() && test.title.trim()),
    },
    ...speakingParts.map((part) => {
      const { slots, subtitle } = speakingPartSpecs[part];
      const selected = test.exerciseIds[part].filter(Boolean);
      return {
        id: `part-${part}`,
        label: `Part ${part} · ${subtitle}: ${selected.length}/${slots} bài (${partQuestionCount(part)} câu)`,
        done:
          selected.length === slots &&
          selected.every((id) => {
            const exercise = lookup(id);
            return exercise?.part === part && exercise.status === "PUBLISHED";
          }),
      };
    }),
    {
      id: "unique",
      label: "Không trùng bài giữa các vị trí",
      done: new Set(ids).size === ids.length,
    },
  ];
}
