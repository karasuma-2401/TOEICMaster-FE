import {
  difficultyLabel,
  exerciseHeadline,
  exerciseStatusLabel,
  formatUpdatedAt,
} from "@/features/speaking/admin-labels";
import type { SpeakingExercise } from "@/features/speaking/types";

const statusTone: Record<SpeakingExercise["status"], string> = {
  PUBLISHED: "bg-[var(--admin-success-soft)] text-[var(--admin-success)]",
  DRAFT: "bg-[var(--admin-warning-soft)] text-[var(--admin-warning)]",
  ARCHIVED: "bg-[var(--admin-surface-muted)] text-[var(--admin-muted)]",
};

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
      <table className="w-full min-w-[850px] text-left text-sm">
        <thead className="bg-[var(--admin-surface-muted)] text-xs text-[var(--admin-muted)]">
          <tr>
            <th className="p-4">MÃ BÀI</th>
            <th className="p-4">NỘI DUNG</th>
            <th className="p-4">CHỦ ĐỀ</th>
            <th className="p-4">ĐỘ KHÓ</th>
            <th className="p-4">TRẠNG THÁI</th>
            <th className="p-4 text-right">THAO TÁC</th>
          </tr>
        </thead>
        <tbody>
          {items.map((exercise) => (
            <tr
              className="border-t border-[var(--admin-border)] transition hover:bg-[var(--admin-row-hover)]"
              key={exercise.id}
            >
              <td className="p-4 font-bold text-[var(--admin-brand-red)]">
                {exercise.code}
              </td>
              <td className="max-w-sm p-4">
                <p className="line-clamp-2 font-semibold" lang="en">
                  {exerciseHeadline(exercise)}
                </p>
                <p className="mt-1 text-xs text-[var(--admin-muted)]">
                  {formatUpdatedAt(exercise.updatedAtUtc)}
                </p>
              </td>
              <td className="p-4">{exercise.topic}</td>
              <td className="p-4">{difficultyLabel[exercise.difficulty]}</td>
              <td className="p-4">
                <span
                  className={`rounded-full px-2 py-1 text-xs font-bold ${statusTone[exercise.status]}`}
                >
                  {exerciseStatusLabel[exercise.status]}
                </span>
              </td>
              <td className="whitespace-nowrap p-4 text-right">
                <button
                  className="px-2 font-semibold text-[var(--admin-brand-red)]"
                  onClick={() => onEdit(exercise)}
                  type="button"
                >
                  Mở
                </button>
                {exercise.status !== "ARCHIVED" && (
                  <button
                    className="px-2 font-semibold text-[var(--admin-danger)]"
                    onClick={() => onArchive(exercise)}
                    type="button"
                  >
                    Lưu trữ
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
