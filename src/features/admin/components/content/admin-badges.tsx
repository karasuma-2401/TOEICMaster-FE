import type { ReactNode } from "react";

export type AdminBadgeTone = "success" | "warning" | "danger" | "neutral";

const toneClass: Record<AdminBadgeTone, string> = {
  success: "bg-[var(--admin-success-soft)] text-[var(--admin-success)]",
  warning: "bg-[var(--admin-warning-soft)] text-[var(--admin-warning)]",
  danger: "bg-[var(--admin-danger-soft)] text-[var(--admin-danger)]",
  neutral: "bg-[var(--admin-surface-muted)] text-[var(--admin-ink-soft)]",
};

/** The one coloured element of a table row. */
export function AdminBadge({
  tone,
  children,
}: {
  tone: AdminBadgeTone;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex h-[22px] items-center whitespace-nowrap rounded-md px-2 text-xs font-medium ${toneClass[tone]}`}
    >
      {children}
    </span>
  );
}

const levels: Record<string, { level: number; label: string }> = {
  EASY: { level: 1, label: "Dễ" },
  DỄ: { level: 1, label: "Dễ" },
  MEDIUM: { level: 2, label: "Trung bình" },
  "TRUNG BÌNH": { level: 2, label: "Trung bình" },
  HARD: { level: 3, label: "Khó" },
  KHÓ: { level: 3, label: "Khó" },
};
const barHeights = ["h-1.5", "h-2.5", "h-3.5"];

/** Difficulty as a quiet signal meter, accepting API codes or Vietnamese labels. */
export function AdminDifficulty({ value }: { value: string }) {
  const known = levels[value.toUpperCase()];
  if (!known)
    return (
      <span className="text-[13px] text-[var(--admin-ink-soft)]">{value}</span>
    );
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap text-[13px] text-[var(--admin-ink-soft)]">
      <span aria-hidden="true" className="flex h-3.5 items-end gap-[2px]">
        {barHeights.map((height, index) => (
          <span
            className={`w-[3px] rounded-[1px] ${height} ${index < known.level ? "bg-[var(--admin-ink-soft)]" : "bg-[var(--admin-border)]"}`}
            key={height}
          />
        ))}
      </span>
      {known.label}
    </span>
  );
}
