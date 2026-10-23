// Class tokens for admin content screens (Writing, Speaking).

export const adminFocus =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--admin-brand-red)]";

export const adminInput =
  "mt-1.5 h-11 w-full rounded-xl border border-[var(--admin-border)] bg-white px-3 font-normal outline-none transition focus:border-[var(--admin-brand-orange)] focus:ring-4 focus:ring-orange-100";

export const adminTextarea =
  "mt-1.5 min-h-24 w-full rounded-xl border border-[var(--admin-border)] bg-white p-3 font-normal outline-none transition focus:border-[var(--admin-brand-orange)] focus:ring-4 focus:ring-orange-100";

export const adminPrimary = `inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold text-white shadow-[var(--admin-action-shadow)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 ${adminFocus}`;

export const adminSecondary = `inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[var(--admin-border)] bg-white px-4 text-sm font-bold text-[var(--admin-ink)] transition hover:bg-[var(--admin-surface-muted)] disabled:cursor-not-allowed disabled:opacity-50 ${adminFocus}`;

export const adminGradient = { background: "var(--admin-brand-gradient)" };
