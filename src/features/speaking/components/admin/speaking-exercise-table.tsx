import {
  difficultyLabel,
  exerciseHeadline,
  exerciseStatusLabel,
} from "@/features/speaking/admin-labels";
import { speakingPartSpecs } from "@/features/speaking/part-specs";
import type {
  SpeakingDifficulty,
  SpeakingExercise,
} from "@/features/speaking/types";
import { ArchiveIcon, PencilIcon } from "../ui/icons";
import { Chip, type ChipTone } from "../ui/primitives";

const statusTone: Record<SpeakingExercise["status"], ChipTone> = {
  PUBLISHED: "success",
  DRAFT: "warning",
  ARCHIVED: "neutral",
};
const difficultyTone: Record<SpeakingDifficulty, ChipTone> = {
  EASY: "success",
  MEDIUM: "warning",
  HARD: "danger",
};
const head = "sp-overline px-4 py-3 font-semibold text-(--sp-ink-3)";

const seconds = (values: number[]) =>
  [...new Set(values)].map((value) => `${value} giây`).join(" / ");

export function SpeakingExerciseTable({
  items,
  onEdit,
  onArchive,
}: {
  items: SpeakingExercise[];
  onEdit: (exercise: SpeakingExercise) => void;
  onArchive: (exercise: SpeakingExercise) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="bg-(--sp-subtle)">
          <tr>
            <th className={head}>MÃ ID</th>
            <th className={head}>NỘI DUNG (TRÍCH DẪN)</th>
            <th className={head}>CHỦ ĐỀ</th>
            <th className={head}>THỜI GIAN CHUẨN BỊ</th>
            <th className={head}>THỜI GIAN NÓI</th>
            <th className={head}>ĐỘ KHÓ</th>
            <th className={head}>TRẠNG THÁI</th>
            <th className={head}>THAO TÁC</th>
          </tr>
        </thead>
        <tbody>
          {items.map((exercise) => {
            const spec = speakingPartSpecs[exercise.part];
            return (
              <tr
                className="border-t border-(--sp-line) hover:bg-(--sp-row-hover)"
                key={exercise.id}
              >
                <td className="px-4 py-3 font-semibold text-(--sp-crimson)">
                  {exercise.code}
                </td>
                <td className="max-w-sm px-4 py-3">
                  <p className="line-clamp-2" lang="en">
                    {exerciseHeadline(exercise)}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <Chip tone="neutral">{exercise.topic}</Chip>
                </td>
                <td className="px-4 py-3">
                  <Chip tone="orange">{seconds(spec.preparationSeconds)}</Chip>
                </td>
                <td className="px-4 py-3">
                  <Chip tone="orange">{seconds(spec.responseSeconds)}</Chip>
                </td>
                <td className="px-4 py-3">
                  <Chip tone={difficultyTone[exercise.difficulty]}>
                    {difficultyLabel[exercise.difficulty]}
                  </Chip>
                </td>
                <td className="px-4 py-3">
                  <Chip dot tone={statusTone[exercise.status]}>
                    {exerciseStatusLabel[exercise.status]}
                  </Chip>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <button
                    aria-label={`Mở ${exercise.code}`}
                    className="sp-focus cursor-pointer p-1 text-(--sp-ink-2) hover:text-(--sp-brand)"
                    onClick={() => onEdit(exercise)}
                    type="button"
                  >
                    <PencilIcon size={18} />
                  </button>
                  {exercise.status !== "ARCHIVED" && (
                    <button
                      aria-label={`Lưu trữ ${exercise.code}`}
                      className="sp-focus ml-1 cursor-pointer p-1 text-(--sp-ink-2) hover:text-(--sp-danger)"
                      onClick={() => onArchive(exercise)}
                      type="button"
                    >
                      <ArchiveIcon size={18} />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
