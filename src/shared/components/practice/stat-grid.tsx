import type { ReactNode } from "react";

export interface StatItem {
  label: string;
  value: ReactNode;
  accent?: boolean;
}

export function StatGrid({
  items,
  className = "sm:grid-cols-2",
}: {
  items: StatItem[];
  className?: string;
}) {
  return (
    <dl className={`grid gap-3 ${className}`}>
      {items.map((item) => (
        <div
          className="rounded-2xl border border-slate-200/70 bg-stone-50 p-4"
          key={item.label}
        >
          <dt className="text-xs font-semibold text-slate-500">{item.label}</dt>
          <dd
            className={`mt-1 text-lg font-bold ${item.accent ? "text-orange-700" : "text-slate-900"}`}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
