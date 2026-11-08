import type { ChecklistItem } from "@/features/speaking/publish-checklist";
import { AlertCircleIcon, CheckCircleIcon } from "../ui/icons";

export function PublishChecklistPanel({
  items,
  errors,
}: {
  items: ChecklistItem[];
  errors: string[];
}) {
  return (
    <section className="sp-card p-4">
      <h3 className="font-semibold">Điều kiện công bố</h3>
      <ul className="mt-3 space-y-2 text-[13px]">
        {items.map((item) => (
          <li
            className={`flex gap-2 ${item.done ? "text-(--sp-success)" : "text-(--sp-danger)"}`}
            key={item.id}
          >
            {item.done ? (
              <CheckCircleIcon className="mt-0.5 shrink-0" size={16} />
            ) : (
              <AlertCircleIcon className="mt-0.5 shrink-0" size={16} />
            )}
            <span>
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
          className="mt-3 rounded-[10px] bg-(--sp-danger-bg) p-3 text-[13px] text-(--sp-danger)"
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
    </section>
  );
}
