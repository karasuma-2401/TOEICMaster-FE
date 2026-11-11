import { useEffect, useState } from "react";
import {
  ADMIN_USER_ROLES,
  ADMIN_USER_STATUSES,
  type AdminUsersQuery,
} from "@/features/admin/users";
import {
  AdminFilterBar,
  AdminFilterSelect,
  AdminSearchField,
} from "./content/admin-filters";

interface UsersToolbarProps {
  query: AdminUsersQuery;
  selectedCount: number;
  onSearch: (value: string) => void;
  onRoleChange: (value: AdminUsersQuery["role"]) => void;
  onStatusChange: (value: AdminUsersQuery["status"]) => void;
  onExport: () => void;
  onClearSelection: () => void;
}

export function UsersToolbar({
  query,
  selectedCount,
  onSearch,
  onRoleChange,
  onStatusChange,
  onExport,
  onClearSelection,
}: UsersToolbarProps) {
  const [searchValue, setSearchValue] = useState(query.q);

  useEffect(() => {
    if (searchValue === query.q) return;
    const timer = window.setTimeout(() => onSearch(searchValue), 300);
    return () => window.clearTimeout(timer);
  }, [onSearch, query.q, searchValue]);

  return (
    <section
      aria-label="Công cụ lọc người dùng"
      className="mt-5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-3"
    >
      {selectedCount > 0 ? (
        <div className="flex min-h-11 items-center justify-between gap-3 rounded-lg bg-[var(--admin-ink)] px-3 text-sm text-white">
          <span aria-live="polite">Đã chọn {selectedCount} người dùng</span>
          <button
            className="rounded-md px-2 py-1 font-semibold hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white"
            onClick={onClearSelection}
            type="button"
          >
            Bỏ chọn
          </button>
        </div>
      ) : (
        <AdminFilterBar>
          <AdminSearchField
            label="Tìm theo tên hoặc email"
            onChange={setSearchValue}
            placeholder="Tìm theo tên hoặc email"
            value={searchValue}
          />
          <AdminFilterSelect
            allValue="ALL"
            ariaLabel="Lọc theo vai trò"
            label="Vai trò"
            onChange={onRoleChange}
            options={ADMIN_USER_ROLES.map((role) => ({
              value: role,
              label: role === "ADMIN" ? "Admin" : "Học viên",
            }))}
            value={query.role}
          />
          <AdminFilterSelect
            allValue="ALL"
            ariaLabel="Lọc theo trạng thái"
            label="Trạng thái"
            onChange={onStatusChange}
            options={ADMIN_USER_STATUSES.map((status) => ({
              value: status,
              label:
                status === "ACTIVE"
                  ? "Hoạt động"
                  : status === "PENDING"
                    ? "Chờ xác minh"
                    : "Bị khóa",
            }))}
            value={query.status}
          />
          <button
            className="ml-auto h-9 cursor-pointer rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 text-[13px] font-medium text-[var(--admin-ink-soft)] hover:bg-[var(--admin-surface-muted)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--admin-brand-red)]"
            onClick={onExport}
            type="button"
          >
            Xuất trang này
          </button>
        </AdminFilterBar>
      )}
    </section>
  );
}
