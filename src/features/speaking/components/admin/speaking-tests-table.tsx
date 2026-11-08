import { adminFocus } from "@/features/admin/components/content/admin-styles";
import { formatUpdatedAt } from "@/features/speaking/admin-labels";
import { speakingPartSpecs } from "@/features/speaking/part-specs";
import type { SpeakingTestListItem } from "@/features/speaking/parsers";
import { speakingParts } from "@/features/speaking/types";

export function SpeakingTestsTable({
  tests,
  onOpen,
}: {
  tests: SpeakingTestListItem[];
  onOpen: (test: SpeakingTestListItem) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="bg-[var(--admin-surface-muted)] text-xs text-[var(--admin-muted)]">
          <tr>
            <th className="p-4">MÃ ĐỀ</th>
            <th className="p-4">TÊN ĐỀ</th>
            <th className="p-4">CẤU TRÚC (BÀI / PART)</th>
            <th className="p-4">SỐ CÂU</th>
            <th className="p-4">TRẠNG THÁI</th>
            <th className="p-4 text-right">THAO TÁC</th>
          </tr>
        </thead>
        <tbody>
          {tests.map((test) => {
            return (
              <tr
                className="border-t border-[var(--admin-border)] transition hover:bg-[var(--admin-row-hover)]"
                key={test.id}
              >
                <td className="p-4 font-bold text-[var(--admin-brand-red)]">
                  {test.code}
                </td>
                <td className="p-4">
                  <button
                    className={`text-left font-bold hover:text-[var(--admin-brand-red)] ${adminFocus}`}
                    onClick={() => onOpen(test)}
                    type="button"
                  >
                    {test.title}
                  </button>
                  <p className="mt-1 text-xs text-[var(--admin-muted)]">
                    {formatUpdatedAt(test.updatedAtUtc)}
                  </p>
                </td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-1">
                    {speakingParts.map((part) => {
                      const full =
                        test.partCounts[part] === speakingPartSpecs[part].slots;
                      return (
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-xs font-semibold ${full ? "bg-[var(--admin-success-soft)] text-[var(--admin-success)]" : "bg-[var(--admin-surface-muted)] text-[var(--admin-muted)]"}`}
                          key={part}
                          title={`Part ${part} · ${speakingPartSpecs[part].subtitle}`}
                        >
                          P{part} {test.partCounts[part]}/
                          {speakingPartSpecs[part].slots}
                        </span>
                      );
                    })}
                  </div>
                </td>
                <td className="p-4 font-semibold">{test.questionCount}/11</td>
                <td className="p-4">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-bold ${test.status === "PUBLISHED" ? "bg-[var(--admin-success-soft)] text-[var(--admin-success)]" : "bg-[var(--admin-warning-soft)] text-[var(--admin-warning)]"}`}
                  >
                    {test.status === "PUBLISHED" ? "Công bố" : "Bản nháp"}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button
                    className={`font-bold text-[var(--admin-brand-red)] ${adminFocus}`}
                    onClick={() => onOpen(test)}
                    type="button"
                  >
                    Mở builder
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
