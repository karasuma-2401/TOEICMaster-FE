import type { SpeakingExercise } from "@/features/speaking/types";
import { SpeakingPrompt } from "../prompts/speaking-prompt";
import { LinkIcon, MonitorIcon } from "../ui/icons";
import { Chip } from "../ui/primitives";

/** Right column of the builder: the focused exercise as learners see it. */
export function TestPreviewPanel({
  focusedId,
  lookup,
}: {
  focusedId: string | null;
  lookup: (id: string) => SpeakingExercise | undefined;
}) {
  const exercise = focusedId ? lookup(focusedId) : undefined;
  return (
    <div className="space-y-3 xl:sticky xl:top-0">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-semibold">
          <MonitorIcon size={18} /> Live Preview
        </h3>
        <Chip dot tone="success">
          Đồng bộ
        </Chip>
      </div>
      <section className="overflow-hidden rounded-[14px] border border-(--sp-line) bg-(--sp-surface)">
        <header className="flex justify-between border-b border-(--sp-line) px-4 py-2.5 text-xs">
          <b className="font-semibold">TOEICMaster</b>
          <span className="text-(--sp-ink-3)">Góc nhìn thí sinh</span>
        </header>
        <div className="p-4">
          {exercise ? (
            <SpeakingPrompt
              content={exercise}
              showAllQuestions
              showDirections={false}
            />
          ) : (
            <p className="p-8 text-center text-[13px] text-(--sp-ink-3)">
              Chưa chọn bài để xem trước.
            </p>
          )}
        </div>
      </section>
      {exercise && (
        <div className="sp-card flex items-center gap-2 p-3 text-[13px]">
          <LinkIcon className="text-(--sp-brand)" size={16} />
          <div>
            <p>
              {exercise.code} · {exercise.topic}
            </p>
            <p className="text-xs text-(--sp-ink-3)">
              Bản xem trước tĩnh · Không ghi âm thật
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
