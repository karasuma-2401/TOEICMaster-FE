import { adminFocus } from "@/features/admin/components/content/admin-styles";
import {
  difficultyLabel,
  difficultyOptions,
  exerciseStatusLabel,
  exerciseStatusOptions,
} from "@/features/speaking/admin-labels";
import {
  partQuestionCount,
  speakingPartSpecs,
} from "@/features/speaking/part-specs";
import {
  speakingParts,
  type SpeakingDifficulty,
  type SpeakingExerciseStatus,
  type SpeakingPart,
} from "@/features/speaking/types";

export interface ExerciseFilter {
  part: SpeakingPart;
  query: string;
  difficulty: SpeakingDifficulty | "ALL";
  status: SpeakingExerciseStatus | "ALL";
  pageNumber: number;
}

const control =
  "h-11 rounded-xl border border-[var(--admin-border)] bg-white px-3 text-sm";

export function SpeakingPartTabs({
  value,
  onChange,
}: {
  value: SpeakingPart;
  onChange: (part: SpeakingPart) => void;
}) {
  return (
    <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      {speakingParts.map((part) => (
        <button
          aria-pressed={part === value}
          className={`rounded-xl px-4 py-3 text-left text-sm font-bold transition ${adminFocus} ${part === value ? "bg-[var(--admin-nav-active)] text-[var(--admin-brand-red)]" : "bg-[var(--admin-surface-muted)] text-[var(--admin-muted)] hover:text-[var(--admin-ink)]"}`}
          key={part}
          onClick={() => onChange(part)}
          type="button"
        >
          Part {part}
          <span className="block text-[11px] font-semibold opacity-80">
            {speakingPartSpecs[part].subtitle} · {partQuestionCount(part)}{" "}
            câu/đề
          </span>
        </button>
      ))}
    </div>
  );
}

export function SpeakingExerciseFilters({
  filter,
  onChange,
}: {
  filter: ExerciseFilter;
  onChange: (next: Partial<ExerciseFilter>) => void;
}) {
  return (
    <div className="grid gap-3 border-b border-[var(--admin-border)] p-4 lg:grid-cols-[1fr_11rem_11rem]">
      <input
        aria-label="Tìm bài tập Speaking"
        className={control}
        onChange={(event) => onChange({ query: event.target.value })}
        placeholder="Tìm mã bài hoặc chủ đề..."
        value={filter.query}
      />
      <select
        aria-label="Lọc độ khó"
        className={control}
        onChange={(event) =>
          onChange({
            difficulty: event.target.value as ExerciseFilter["difficulty"],
          })
        }
        value={filter.difficulty}
      >
        <option value="ALL">Độ khó: Tất cả</option>
        {difficultyOptions.map((item) => (
          <option key={item} value={item}>
            {difficultyLabel[item]}
          </option>
        ))}
      </select>
      <select
        aria-label="Lọc trạng thái"
        className={control}
        onChange={(event) =>
          onChange({ status: event.target.value as ExerciseFilter["status"] })
        }
        value={filter.status}
      >
        <option value="ALL">Trạng thái: Tất cả</option>
        {exerciseStatusOptions.map((item) => (
          <option key={item} value={item}>
            {exerciseStatusLabel[item]}
          </option>
        ))}
      </select>
    </div>
  );
}
