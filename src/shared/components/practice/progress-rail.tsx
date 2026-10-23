export type ProgressState = "current" | "done" | "todo";

export interface ProgressGroup {
  label?: string;
  items: { id: string | number; label: string; state: ProgressState }[];
}

const stateClass: Record<ProgressState, string> = {
  current: "bg-orange-500 text-white shadow-sm ring-2 ring-orange-200",
  done: "bg-emerald-100 text-emerald-800",
  todo: "bg-slate-100 text-slate-500",
};

export function ProgressRail({
  title = "Tiến độ",
  hint,
  groups,
}: {
  title?: string;
  hint?: string;
  groups: ProgressGroup[];
}) {
  return (
    <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-bold text-slate-900">{title}</h2>
      {hint && <p className="mt-1 text-xs leading-5 text-slate-500">{hint}</p>}
      <div className="mt-4 space-y-4">
        {groups.map((group, index) => (
          <div key={group.label ?? index}>
            {group.label && (
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">
                {group.label}
              </p>
            )}
            <div className="grid grid-cols-4 gap-2">
              {group.items.map((item) => (
                <span
                  aria-current={item.state === "current" ? "step" : undefined}
                  className={`grid aspect-square place-items-center rounded-xl text-xs font-bold transition ${stateClass[item.state]}`}
                  key={item.id}
                >
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <ul className="mt-5 flex flex-wrap gap-x-3 gap-y-1 border-t border-slate-100 pt-4 text-[11px] text-slate-500">
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2.5 rounded bg-orange-500" />
          Đang làm
        </li>
        <li className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="size-2.5 rounded bg-emerald-200"
          />
          Đã khóa
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2.5 rounded bg-slate-200" />
          Chưa làm
        </li>
      </ul>
    </aside>
  );
}
