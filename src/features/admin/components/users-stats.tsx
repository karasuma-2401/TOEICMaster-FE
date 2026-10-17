import type { AdminUserStatus, AdminUsersStats } from "@/features/admin/users";

interface UsersStatsProps {
  stats: AdminUsersStats;
  selectedStatus: AdminUserStatus | "ALL";
  onSelectStatus: (status: AdminUserStatus | "ALL") => void;
}

const cards: {
  key: keyof AdminUsersStats;
  label: string;
  status: AdminUserStatus | "ALL";
  mark: string;
}[] = [
  { key: "totalUsers", label: "Tổng người dùng", status: "ALL", mark: "T" },
  { key: "activeUsers", label: "Đang hoạt động", status: "ACTIVE", mark: "✓" },
  { key: "pendingUsers", label: "Chờ xác minh", status: "PENDING", mark: "…" },
  { key: "lockedUsers", label: "Bị khóa", status: "LOCKED", mark: "!" },
];

export function UsersStats({
  stats,
  selectedStatus,
  onSelectStatus,
}: UsersStatsProps) {
  return (
    <section
      aria-label="Thống kê người dùng"
      className="grid grid-cols-2 gap-3 xl:grid-cols-4"
    >
      {cards.map((card) => (
        <button
          aria-pressed={selectedStatus === card.status}
          className={`rounded-xl border bg-[var(--admin-surface)] p-4 text-left transition hover:border-[var(--admin-brand-red)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--admin-brand-red)] sm:p-5 ${selectedStatus === card.status ? "border-[var(--admin-brand-red)] ring-1 ring-[var(--admin-brand-red)]" : "border-[var(--admin-border)]"}`}
          key={card.key}
          onClick={() => onSelectStatus(card.status)}
          type="button"
        >
          <span className="flex items-center justify-between text-xs font-semibold text-[var(--admin-muted)]">
            {card.label}
            <span
              aria-hidden="true"
              className="grid size-8 place-items-center rounded-lg bg-[var(--admin-surface-muted)] text-sm text-[var(--admin-brand-red)]"
            >
              {card.mark}
            </span>
          </span>
          <span className="mt-3 block text-2xl font-bold tracking-tight text-[var(--admin-ink)]">
            {stats[card.key].toLocaleString("vi-VN")}
          </span>
        </button>
      ))}
    </section>
  );
}
