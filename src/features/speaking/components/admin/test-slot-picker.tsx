import { adminFocus } from "@/features/admin/components/content/admin-styles";
import { AdminPanel } from "@/features/admin/components/content/admin-workspace";
import { exerciseHeadline } from "@/features/speaking/admin-labels";
import {
  partQuestionCount,
  partTimingLabel,
  speakingPartSpecs,
} from "@/features/speaking/part-specs";
import type { SpeakingExercise, SpeakingPart } from "@/features/speaking/types";

/** Exercise selectors for one Part of the Speaking test editor. */
export function TestSlotPicker({
  part,
  options,
  lookup,
  disabled,
  selected,
  focusedId,
  onChange,
  onFocus,
}: {
  part: SpeakingPart;
  /** Published exercises of this Part that can fill a slot. */
  options: SpeakingExercise[];
  lookup: (id: string) => SpeakingExercise | undefined;
  disabled: boolean;
  selected: string[];
  focusedId: string | null;
  onChange: (index: number, id: string) => void;
  onFocus: (id: string) => void;
}) {
  const spec = speakingPartSpecs[part];
  const filled = selected.filter(Boolean).length;
  return (
    <AdminPanel
      aside={
        <span
          className={`rounded-full px-2 py-1 text-xs font-bold ${filled === spec.slots ? "bg-[var(--admin-success-soft)] text-[var(--admin-success)]" : "bg-[var(--admin-warning-soft)] text-[var(--admin-warning)]"}`}
        >
          {filled}/{spec.slots}
        </span>
      }
      description={`${partQuestionCount(part)} câu · ${partTimingLabel(part)}`}
      title={`Part ${part} · ${spec.subtitle}`}
    >
      <div className="space-y-3">
        {Array.from({ length: spec.slots }, (_, index) => {
          const id = selected[index] ?? "";
          return (
            <div
              className={`rounded-xl border p-3 transition ${id && id === focusedId ? "border-[var(--admin-brand-orange)] bg-[var(--admin-nav-active)]" : "border-[var(--admin-border)]"}`}
              key={index}
            >
              <label
                className="block text-xs font-bold text-[var(--admin-muted)]"
                htmlFor={`slot-${part}-${index}`}
              >
                BÀI {index + 1}
              </label>
              <div className="mt-1.5 flex gap-2">
                <select
                  disabled={disabled}
                  className="h-10 min-w-0 flex-1 rounded-lg border border-[var(--admin-border)] bg-white px-3 text-sm"
                  id={`slot-${part}-${index}`}
                  onChange={(event) => onChange(index, event.target.value)}
                  value={id}
                >
                  <option value="">Chọn bài tập</option>
                  {id && !options.some((exercise) => exercise.id === id) && (
                    <option value={id}>
                      {lookup(id)?.code ?? "Bài không còn khả dụng"}
                    </option>
                  )}
                  {options.map((exercise) => (
                    <option key={exercise.id} value={exercise.id}>
                      {exercise.code} · {exercise.topic}
                    </option>
                  ))}
                </select>
                <button
                  aria-label={`Xem trước bài ${index + 1} Part ${part}`}
                  className={`h-10 shrink-0 rounded-lg border border-[var(--admin-border)] px-3 text-sm font-bold text-[var(--admin-brand-red)] hover:bg-[var(--admin-surface-muted)] disabled:opacity-40 ${adminFocus}`}
                  disabled={!id}
                  onClick={() => onFocus(id)}
                  type="button"
                >
                  Xem
                </button>
              </div>
              {id && lookup(id) && (
                <p
                  className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--admin-ink-soft)]"
                  lang="en"
                >
                  {exerciseHeadline(lookup(id)!)}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </AdminPanel>
  );
}
