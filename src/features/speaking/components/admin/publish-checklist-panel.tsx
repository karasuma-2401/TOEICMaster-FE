import type { ChecklistItem } from "@/features/speaking/publish-checklist";
import { AlertCircleIcon, CheckCircleIcon } from "../ui/icons";

export function PublishChecklistPanel({
  items,
  errors,
  errorTitle = "Cannot publish yet",
}: {
  items: ChecklistItem[];
  errors: string[];
  errorTitle?: string;
}) {
  return (
    <section className="sp-card p-4">
      <h3 className="font-semibold">Publish checklist</h3>
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
                {item.done ? "Passed: " : "Incomplete: "}
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
          <b>{errorTitle}</b>
          <ul className="mt-1 list-disc pl-5">
            {errors.map((error, index) => (
              <li key={`${index}-${error}`}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
