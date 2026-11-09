import {
  exerciseHeadline,
  exerciseStatusLabel,
} from "@/features/speaking/admin-labels";
import { speakingPartSpecs } from "@/features/speaking/part-specs";
import type { SpeakingExercise } from "@/features/speaking/types";
import {
  AdminBadge,
  AdminDifficulty,
  type AdminBadgeTone,
} from "@/features/admin/components/content/admin-badges";
import { ArchiveIcon, PencilIcon } from "../ui/icons";

const statusTone: Record<SpeakingExercise["status"], AdminBadgeTone> = {
  PUBLISHED: "success",
  DRAFT: "warning",
  ARCHIVED: "neutral",
};
const head = "px-4 py-2.5";

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
            <th className={head}>Mã</th>
            <th className={head}>Nội dung</th>
            <th className={head}>Thời gian</th>
            <th className={head}>Độ khó</th>
            <th className={head}>Trạng thái</th>
            <th className={head}>
              <span className="sr-only">Thao tác</span>
            </th>
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
                <td className="whitespace-nowrap px-4 py-3 text-[13px] font-medium tabular-nums text-(--sp-ink-2)">
                  {exercise.code}
                </td>
                <td className="max-w-md px-4 py-3">
                  <p className="line-clamp-2" lang="en">
                    {exerciseHeadline(exercise)}
                  </p>
                  <p className="mt-0.5 text-xs text-(--sp-ink-3)">
                    {exercise.topic}
                  </p>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-[13px] text-(--sp-ink-2)">
                  Chuẩn bị {seconds(spec.preparationSeconds)}
                  <span className="block text-xs text-(--sp-ink-3)">
                    Nói {seconds(spec.responseSeconds)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <AdminDifficulty value={exercise.difficulty} />
                </td>
                <td className="px-4 py-3">
                  <AdminBadge tone={statusTone[exercise.status]}>
                    {exerciseStatusLabel[exercise.status]}
                  </AdminBadge>
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
