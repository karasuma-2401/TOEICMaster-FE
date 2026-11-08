import type { ReactNode } from "react";

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-[11px] font-bold tracking-[0.14em] text-[var(--admin-brand-red)]">
          QUẢN TRỊ / KHO DỮ LIỆU
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h1>
        <p className="mt-1.5 text-sm text-[var(--admin-muted)]">
          {description}
        </p>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function AdminNotice({ children }: { children: ReactNode }) {
  return (
    <output className="mt-5 block rounded-xl bg-[var(--admin-success-soft)] p-3 text-sm font-semibold text-[var(--admin-success)]">
      {children}
    </output>
  );
}
