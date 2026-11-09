import { AdminBadge } from "@/features/admin/components/content/admin-badges";
import { formatDate } from "../ui/format";
import { EyeIcon, PencilIcon, TrashIcon } from "../ui/icons";
import type { SpeakingTestListItem } from "@/features/speaking/parsers";

const head = "px-4 py-2.5";
const action =
  "sp-focus cursor-pointer p-1 text-(--sp-ink-2) enabled:hover:text-(--sp-brand) disabled:cursor-not-allowed disabled:opacity-35";

export function SpeakingTestsTable({
  tests,
  onOpen,
  onView,
  onDelete,
}: {
  tests: SpeakingTestListItem[];
  onOpen: (test: SpeakingTestListItem) => void;
  onView: (test: SpeakingTestListItem) => void;
  onDelete: (test: SpeakingTestListItem) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="bg-(--sp-subtle)">
          <tr>
            <th className={head}>Mã đề</th>
            <th className={head}>Tên đề thi</th>
            <th className={head}>Thời gian</th>
            <th className={head}>Số câu</th>
            <th className={head}>Barem</th>
            <th className={head}>Trạng thái</th>
            <th className={head}>
              <span className="sr-only">Thao tác</span>
            </th>
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
                <td className="whitespace-nowrap px-4 py-3 text-[13px] font-medium tabular-nums text-(--sp-ink-2)">
                  {test.code}
                </td>
                <td className="px-4 py-3">
                  <button
                    className="sp-focus cursor-pointer text-left font-medium hover:text-(--sp-brand)"
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
                  <AdminBadge tone={published ? "success" : "warning"}>
                    {published ? "Chính thức" : "Bản nháp"}
                  </AdminBadge>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <button
                    aria-label={`Xem ${test.code}`}
                    className={action}
                    onClick={() => onView(test)}
                    title="Xem đề"
                    type="button"
                  >
                    <EyeIcon size={18} />
                  </button>
                  <button
                    aria-label={`Sửa ${test.code}`}
                    className={`${action} ml-1`}
                    disabled={published}
                    onClick={() => onOpen(test)}
                    title={published ? "Đề đã công bố không thể sửa" : "Sửa đề"}
                    type="button"
                  >
                    <PencilIcon size={18} />
                  </button>
                  <button
                    aria-label={`Xóa ${test.code}`}
                    className={`${action} ml-1 enabled:hover:text-(--sp-danger)`}
                    disabled={published}
                    onClick={() => onDelete(test)}
                    title={published ? "Đề đã công bố không thể xóa" : "Xóa đề"}
                    type="button"
                  >
                    <TrashIcon size={18} />
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
