import type { AdminUserStatus } from "@/features/admin/users";
import { AdminBadge, type AdminBadgeTone } from "./content/admin-badges";

const labels: Record<AdminUserStatus, string> = {
  ACTIVE: "Active",
  PENDING: "Pending verification",
  LOCKED: "Locked",
};

const tones: Record<AdminUserStatus, AdminBadgeTone> = {
  ACTIVE: "success",
  PENDING: "warning",
  LOCKED: "danger",
};

export function UserStatusChip({ status }: { status: AdminUserStatus }) {
  return <AdminBadge tone={tones[status]}>{labels[status]}</AdminBadge>;
}
