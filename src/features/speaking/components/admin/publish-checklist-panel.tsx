import { AdminPanel } from "@/features/admin/components/content/admin-workspace";
import type { ChecklistItem } from "@/features/speaking/publish-checklist";

export function PublishChecklistPanel({
  items,
  errors,
}: {
  items: ChecklistItem[];
  errors: string[];
}) {
  const done = items.filter((item) => item.done).length;
  const ratio = items.length ? done / items.length : 0;
  return (
    <AdminPanel
      aside={
        <span className="text-sm font-bold text-[var(--admin-brand-red)]">
          {done}/{items.length}
        </span>
      }
      description="Cập nhật theo từng thay đổi trong editor."
      title="Điều kiện xuất bản"
    >
      <span
        aria-hidden="true"
        className="block h-1.5 overflow-hidden rounded-full bg-[var(--admin-surface-muted)]"
      >
        <span
          className="block h-full rounded-full transition-[width]"
          style={{
            width: `${ratio * 100}%`,
            background: "var(--admin-brand-gradient)",
          }}
        />
      </span>
      <ul className="mt-4 space-y-2 text-sm">
        {items.map((item) => (
          <li className="flex gap-2.5" key={item.id}>
            <span
              aria-hidden="true"
              className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-bold ${item.done ? "bg-[var(--admin-success-soft)] text-[var(--admin-success)]" : "bg-[var(--admin-surface-muted)] text-[var(--admin-muted)]"}`}
            >
              {item.done ? "✓" : "•"}
            </span>
            <span className={item.done ? "" : "text-[var(--admin-muted)]"}>
              <span className="sr-only">
                {item.done ? "Đạt: " : "Chưa đạt: "}
              </span>
              {item.label}
            </span>
          </li>
        ))}
      </ul>
      {errors.length > 0 && (
        <div
          className="mt-4 rounded-xl bg-[var(--admin-danger-soft)] p-3 text-sm text-[var(--admin-danger)]"
          role="alert"
        >
          <b>Chưa thể công bố</b>
          <ul className="mt-1 list-disc pl-5">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </AdminPanel>
  );
}
