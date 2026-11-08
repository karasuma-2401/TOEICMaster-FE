import type { SpeakingAttemptQuestion } from "@/features/speaking/attempt";
import {
  ProgressRail,
  type ProgressGroup,
} from "@/shared/components/practice/progress-rail";

/** Question map grouped by Part, like the TOEIC Speaking 11-question layout. */
export function SessionProgress({
  questions,
  currentPosition,
}: {
  questions: Pick<
    SpeakingAttemptQuestion,
    "position" | "part" | "lockedAtUtc"
  >[];
  currentPosition: number | null;
}) {
  const groups: ProgressGroup[] = [];
  for (const question of questions) {
    const label = `Part ${question.part}`;
    let group = groups.find((item) => item.label === label);
    if (!group) {
      group = { label, items: [] };
      groups.push(group);
    }
    group.items.push({
      id: question.position,
      label: String(question.position),
      state:
        question.position === currentPosition
          ? "current"
          : question.lockedAtUtc
            ? "done"
            : "todo",
    });
  }
  return <ProgressRail groups={groups} hint="Câu đã khóa không thể làm lại." />;
}
