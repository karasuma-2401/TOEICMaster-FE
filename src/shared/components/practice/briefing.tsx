import type { ReactNode } from "react";

export function RuleList({
  id,
  title = "Quy tắc làm bài",
  rules,
}: {
  id: string;
  title?: string;
  rules: ReactNode[];
}) {
  return (
    <section
      aria-labelledby={id}
      className="rounded-2xl border border-amber-200/70 bg-amber-50/60 p-5"
    >
      <h2 className="font-bold text-slate-900" id={id}>
        {title}
      </h2>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
        {rules.map((rule, index) => (
          <li className="flex gap-2.5" key={index}>
            <span
              aria-hidden="true"
              className="mt-2 size-1.5 shrink-0 rounded-full bg-amber-500"
            />
            <span>{rule}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export interface StructureItem {
  key: string | number;
  badge: ReactNode;
  title: string;
  detail: ReactNode;
}

export function StructureList({
  id,
  title = "Cấu trúc đề",
  items,
}: {
  id: string;
  title?: string;
  items: StructureItem[];
}) {
  return (
    <section aria-labelledby={id}>
      <h2 className="font-bold text-slate-900" id={id}>
        {title}
      </h2>
      <ol className="mt-4 space-y-3">
        {items.map((item) => (
          <li
            className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-orange-200"
            key={item.key}
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-orange-50 text-sm font-bold text-orange-700">
              {item.badge}
            </span>
            <div>
              <h3 className="font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{item.detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
