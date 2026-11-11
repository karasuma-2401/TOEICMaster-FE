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
        <h1>{title}</h1>
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
