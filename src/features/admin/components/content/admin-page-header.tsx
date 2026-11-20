import type { ReactNode } from "react";

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow ? (
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-(--admin-brand-red)">
            {eyebrow}
          </p>
        ) : null}
        <h1
          className={`${eyebrow ? "mt-2 " : ""}text-3xl font-semibold tracking-tight text-(--admin-ink)`}
        >
          {title}
        </h1>
        <p className="mt-2 text-sm leading-6 text-(--admin-muted)">
          {description}
        </p>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function AdminNotice({ children }: { children: ReactNode }) {
  return (
    <output className="mt-5 block rounded-xl bg-[var(--admin-success-soft)] p-3 text-sm font-semibold text-[var(--admin-success)]">
      {children}
    </output>
  );
}
