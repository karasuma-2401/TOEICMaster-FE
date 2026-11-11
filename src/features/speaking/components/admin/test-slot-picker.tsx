import { AdminFilterSelect } from "@/features/admin/components/content/admin-filters";
import { speakingPartSpecs } from "@/features/speaking/part-specs";
import type { SpeakingExercise, SpeakingPart } from "@/features/speaking/types";

/** Question labels of each slot, in test order. */
export const slotLabels: Record<SpeakingPart, string[]> = {
  1: ["Q1", "Q2"],
  2: ["Q3", "Q4"],
  3: ["Q5–7"],
  4: ["Q8–10"],
  5: ["Q11"],
};

/** One Part of the builder: a row per slot. */
export function TestSlotPicker({
  part,
  options,
  lookup,
  disabled,
  selected,
  duplicates,
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
  duplicates: Set<string>;
  focusedId: string | null;
  onChange: (index: number, id: string) => void;
  onFocus: (id: string) => void;
}) {
  const spec = speakingPartSpecs[part];
  return (
    <section className="sp-card overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b border-(--sp-line) px-4 py-3 text-[13px]">
        <p>
          <b className="font-semibold">Part {part}</b>
          <span className="ml-3">{spec.title}</span>
        </p>
        <span className="text-(--sp-ink-3)">
          {slotLabels[part].length} slot
        </span>
      </header>
      {Array.from({ length: spec.slots }, (_, index) => {
        const id = selected[index] ?? "";
        const exercise = id ? lookup(id) : undefined;
        const duplicate = Boolean(id) && duplicates.has(id);
        const focused = Boolean(id) && id === focusedId;
        const label = slotLabels[part][index];
        const badge = duplicate
          ? "bg-(--sp-danger-bg) text-(--sp-danger)"
          : id
            ? "bg-(--sp-success-bg) text-(--sp-success)"
            : "bg-(--sp-subtle) text-(--sp-ink-3)";
        return (
          <div
            className={`flex flex-wrap items-center gap-3 border-t border-(--sp-line) p-3 first-of-type:border-t-0 ${focused ? "bg-(--sp-cream) outline-[1.5px] -outline-offset-[1.5px] outline-(--sp-brand)" : ""}`}
            key={index}
          >
            <span
              className={`grid h-10 w-[70px] shrink-0 place-items-center rounded-md text-[13px] font-semibold ${badge}`}
            >
              {label}
            </span>
            <div className="min-w-40 flex-1">
              <p className="flex flex-wrap items-center gap-2">
                {exercise?.topic ?? "Chưa chọn bài tập"}
                {duplicate && (
                  <span className="sp-chip sp-chip-danger">Trùng bài</span>
                )}
                {focused && !duplicate && (
                  <span className="text-xs text-(--sp-brand)">Đang xem</span>
                )}
              </p>
              <p
                className={`text-xs ${duplicate ? "text-(--sp-danger)" : "text-(--sp-ink-3)"}`}
              >
                {exercise ? exercise.code : "Chọn 1 bài từ ngân hàng bài tập"}
              </p>
            </div>
            <AdminFilterSelect
              allLabel="Chọn bài"
              allValue=""
              ariaLabel={`Chọn bài cho ${label}`}
              disabled={disabled}
              onChange={(next) => {
                if (next) onChange(index, next);
              }}
              options={options.map((option) => ({
                value: option.id,
                label: `${option.code} · ${option.topic}`,
              }))}
              value=""
            />
            <button
              aria-label={`Xem ${label}`}
              className="sp-btn sp-btn-ghost sp-btn-sm"
              disabled={!id}
              onClick={() => onFocus(id)}
              type="button"
            >
              Xem
            </button>
            <button
              aria-label={`Gỡ ${label}`}
              className="sp-btn sp-btn-ghost sp-btn-sm"
              disabled={!id || disabled}
              onClick={() => onChange(index, "")}
              type="button"
            >
              Gỡ
            </button>
          </div>
        );
      })}
    </section>
  );
}
