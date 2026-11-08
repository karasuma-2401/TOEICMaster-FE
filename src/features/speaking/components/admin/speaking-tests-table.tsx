import { formatDate } from "../ui/format";
import { PencilIcon } from "../ui/icons";
import { Chip } from "../ui/primitives";
import type { SpeakingTestListItem } from "@/features/speaking/parsers";

const head = "sp-overline px-4 py-3 font-semibold text-(--sp-ink-3)";

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
        <thead className="bg-(--sp-subtle)">
          <tr>
            <th className={head}>MÃ ĐỀ</th>
            <th className={head}>TÊN ĐỀ THI</th>
            <th className={head}>THỜI GIAN</th>
            <th className={head}>SỐ CÂU</th>
            <th className={head}>BAREM</th>
            <th className={head}>TRẠNG THÁI</th>
            <th className={head}>THAO TÁC</th>
          </tr>
        </thead>
        <tbody>
          {tests.map((test) => {
            const full = test.questionCount === 11;
            const published = test.status === "PUBLISHED";
            return (
              <tr
                className="border-t border-(--sp-line) hover:bg-(--sp-row-hover)"
                key={test.id}
              >
                <td className="px-4 py-3 text-(--sp-ink-2)">{test.code}</td>
                <td className="px-4 py-3">
                  <button
                    className="sp-focus cursor-pointer text-left text-lg font-semibold hover:text-(--sp-brand)"
                    onClick={() => onOpen(test)}
                    type="button"
                  >
                    {test.title}
                  </button>
                  <p className="text-xs text-(--sp-ink-3)">
                    Cập nhật {formatDate(test.updatedAtUtc)}
                  </p>
                </td>
                <td className="px-4 py-3">~20 phút</td>
                <td className="px-4 py-3">
                  {test.questionCount}/11 · {full ? "Đủ" : "Chưa đủ"}
                </td>
                <td className="px-4 py-3">0–200</td>
                <td className="px-4 py-3">
                  <Chip dot tone={published ? "success" : "warning"}>
                    {published ? "Chính thức" : "Bản nháp"}
                  </Chip>
                </td>
                <td className="px-4 py-3">
                  <button
                    aria-label={`Mở builder ${test.code}`}
                    className="sp-focus cursor-pointer p-1 text-(--sp-ink-2) hover:text-(--sp-brand)"
                    onClick={() => onOpen(test)}
                    type="button"
                  >
                    <PencilIcon size={18} />
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
