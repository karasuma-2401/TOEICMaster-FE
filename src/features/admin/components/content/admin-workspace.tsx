"use client";

import { useEffect, type ReactNode } from "react";
import { adminFocus } from "./admin-styles";

/**
 * Full-viewport editor for admin detail forms. The header keeps navigation on
 * the left and actions on the right; the body spans the whole width so
 * multi-column layouts can use it.
 */
export function AdminWorkspace({
  label,
  eyebrow,
  title,
  badge,
  onClose,
  actions,
  children,
}: {
  label: string;
  eyebrow: string;
  title: string;
  badge?: ReactNode;
  onClose: () => void;
  actions: ReactNode;
  children: ReactNode;
}) {
  useEffect(() => {
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose]);
  return (
    <dialog
      aria-label={label}
      aria-modal="true"
      className="fixed inset-0 z-[70] m-0 flex h-dvh max-h-none w-full max-w-none flex-col bg-[var(--admin-page)] p-0 text-[var(--admin-ink)]"
      open
    >
      <header className="sticky top-0 z-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-[var(--admin-border)] bg-[var(--admin-surface)] px-5 py-4 sm:px-8">
        <button
          aria-label={`Đóng ${label.toLocaleLowerCase("vi-VN")}`}
          className={`inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--admin-border)] px-3 text-sm font-bold hover:bg-[var(--admin-surface-muted)] ${adminFocus}`}
          onClick={onClose}
          type="button"
        >
          <span aria-hidden="true">←</span>
          <span className="hidden sm:inline">Danh sách</span>
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold tracking-[0.14em] text-[var(--admin-brand-red)]">
            {eyebrow}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            <h2 className="truncate text-xl font-bold">{title}</h2>
            {badge}
          </div>
        </div>
        <div className="flex w-full flex-wrap justify-end gap-2 sm:w-auto">
          {actions}
        </div>
      </header>
      <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-8">{children}</div>
    </dialog>
  );
}

/** Card section inside a workspace column. */
export function AdminPanel({
  title,
  description,
  aside,
  className = "",
  children,
}: {
  title: string;
  description?: ReactNode;
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={`rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 ${className}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-bold">{title}</h3>
          {description && (
            <p className="mt-1 text-xs leading-5 text-[var(--admin-muted)]">
              {description}
            </p>
          )}
        </div>
        {aside}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Compact metric tile for admin list pages. */
export function AdminStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4">
      <p className="text-xs font-semibold text-[var(--admin-muted)]">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-[var(--admin-muted)]">{hint}</p>}
    </div>
  );
}
