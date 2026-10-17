import type { AdminUserStatus } from "@/features/admin/users";

const labels: Record<AdminUserStatus, string> = {
  ACTIVE: "Hoạt động",
  PENDING: "Chờ xác minh",
  LOCKED: "Bị khóa",
};

const styles: Record<AdminUserStatus, string> = {
  ACTIVE: "bg-[var(--admin-success-soft)] text-[var(--admin-success)]",
  PENDING: "bg-[var(--admin-warning-soft)] text-[var(--admin-warning)]",
  LOCKED: "bg-[var(--admin-danger-soft)] text-[var(--admin-danger)]",
};

export function UserStatusChip({ status }: { status: AdminUserStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {labels[status]}
    </span>
  );
}
