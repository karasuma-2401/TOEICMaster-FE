import { AdminPanel } from "@/features/admin/components/content/admin-workspace";
import {
  partQuestionCount,
  speakingPartSpecs,
} from "@/features/speaking/part-specs";
import {
  speakingParts,
  type SpeakingExercise,
  type SpeakingTest,
} from "@/features/speaking/types";
import { SpeakingPrompt } from "../prompts/speaking-prompt";

/** Right column of the test editor: test outline plus the focused exercise. */
export function TestPreviewPanel({
  test,
  focusedId,
  lookup,
}: {
  test: Pick<SpeakingTest, "title" | "description" | "exerciseIds">;
  focusedId: string | null;
  lookup: (id: string) => SpeakingExercise | undefined;
}) {
  const exercise = focusedId ? lookup(focusedId) : undefined;
  return (
    <div className="space-y-6 xl:sticky xl:top-0">
      <AdminPanel
        description={test.description || "Chưa có mô tả cho đề Speaking này."}
        title={test.title || "Chưa đặt tên đề"}
      >
        <ol className="space-y-2">
          {speakingParts.map((part) => (
            <li
              className="flex items-center justify-between gap-3 rounded-xl bg-[var(--admin-surface-muted)] px-3 py-2 text-sm"
              key={part}
            >
              <span className="font-semibold">
                Part {part} · {speakingPartSpecs[part].subtitle}
              </span>
              <span className="text-xs text-[var(--admin-muted)]">
                {test.exerciseIds[part].filter(Boolean).length}/
                {speakingPartSpecs[part].slots} bài · {partQuestionCount(part)}{" "}
                câu
              </span>
            </li>
          ))}
        </ol>
      </AdminPanel>
      <AdminPanel
        description={
          exercise
            ? `${exercise.code} · ${exercise.topic}`
            : "Bấm “Xem” ở một vị trí để xem bài như User nhìn thấy."
        }
        title="Góc nhìn User"
      >
        {exercise ? (
          <div className="rounded-xl bg-stone-50 p-4 text-slate-900">
            <SpeakingPrompt content={exercise} showAllQuestions />
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-[var(--admin-border)] p-8 text-center text-sm text-[var(--admin-muted)]">
            Chưa chọn bài để xem trước.
          </p>
        )}
      </AdminPanel>
    </div>
  );
}
