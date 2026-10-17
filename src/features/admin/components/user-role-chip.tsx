import type { AdminUserRole } from "@/features/admin/users";

export function UserRoleChip({ userRole }: { userRole: AdminUserRole }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${userRole === "ADMIN" ? "bg-[var(--admin-role-admin-soft)] text-[var(--admin-role-admin)]" : "bg-[var(--admin-surface-muted)] text-[var(--admin-ink-soft)]"}`}
    >
      {userRole === "ADMIN" ? "Admin" : "Học viên"}
    </span>
  );
}
