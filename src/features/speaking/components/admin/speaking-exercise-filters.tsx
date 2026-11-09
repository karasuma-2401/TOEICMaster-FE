import {
  AdminFilterBar,
  AdminFilterSelect,
  AdminSearchField,
  type SearchSuggestion,
} from "@/features/admin/components/content/admin-filters";
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
  suggestions,
}: {
  filter: ExerciseFilter;
  onChange: (next: Partial<ExerciseFilter>) => void;
  suggestions?: SearchSuggestion[];
}) {
  return (
    <AdminFilterBar className="border-b border-(--sp-line) p-3">
      <AdminSearchField
        label="Tìm bài tập Speaking"
        onChange={(query) => onChange({ query })}
        placeholder="Tìm theo chủ đề hoặc mã bài tập"
        suggestions={suggestions}
        value={filter.query}
      />
      <AdminFilterSelect
        allValue="ALL"
        ariaLabel="Lọc độ khó"
        label="Độ khó"
        onChange={(difficulty: ExerciseFilter["difficulty"]) =>
          onChange({ difficulty })
        }
        options={difficultyOptions.map((value) => ({
          value,
          label: difficultyLabel[value],
        }))}
        value={filter.difficulty}
      />
      <AdminFilterSelect
        allValue="ALL"
        ariaLabel="Lọc trạng thái"
        label="Trạng thái"
        onChange={(status: ExerciseFilter["status"]) => onChange({ status })}
        options={exerciseStatusOptions.map((value) => ({
          value,
          label: exerciseStatusLabel[value],
        }))}
        value={filter.status}
      />
    </AdminFilterBar>
  );
}
