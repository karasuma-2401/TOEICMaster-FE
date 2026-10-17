import { useEffect, useState } from "react";
import {
  ADMIN_USER_ROLES,
  ADMIN_USER_STATUSES,
  type AdminUsersQuery,
} from "@/features/admin/users";

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
      className="mt-5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-3 sm:p-4"
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
        <div className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_180px_190px_auto]">
          <label className="relative block">
            <span className="sr-only">Tìm theo tên hoặc email</span>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-muted)]"
            >
              ⌕
            </span>
            <input
              className="h-11 w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] pl-9 pr-3 text-sm text-[var(--admin-ink)] placeholder:text-[var(--admin-muted)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--admin-brand-red)]"
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Tìm theo tên hoặc email"
              type="search"
              value={searchValue}
            />
          </label>
          <label className="flex h-11 items-center gap-2 rounded-lg border border-[var(--admin-border)] px-3 text-xs text-[var(--admin-muted)] focus-within:outline-2 focus-within:outline-[var(--admin-brand-red)]">
            <span>Vai trò</span>
            <select
              aria-label="Lọc theo vai trò"
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[var(--admin-ink)] outline-none"
              onChange={(event) =>
                onRoleChange(event.target.value as AdminUsersQuery["role"])
              }
              value={query.role}
            >
              <option value="ALL">Tất cả</option>
              {ADMIN_USER_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role === "ADMIN" ? "Admin" : "Học viên"}
                </option>
              ))}
            </select>
          </label>
          <label className="flex h-11 items-center gap-2 rounded-lg border border-[var(--admin-border)] px-3 text-xs text-[var(--admin-muted)] focus-within:outline-2 focus-within:outline-[var(--admin-brand-red)]">
            <span>Trạng thái</span>
            <select
              aria-label="Lọc theo trạng thái"
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[var(--admin-ink)] outline-none"
              onChange={(event) =>
                onStatusChange(event.target.value as AdminUsersQuery["status"])
              }
              value={query.status}
            >
              <option value="ALL">Tất cả</option>
              {ADMIN_USER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status === "ACTIVE"
                    ? "Hoạt động"
                    : status === "PENDING"
                      ? "Chờ xác minh"
                      : "Bị khóa"}
                </option>
              ))}
            </select>
          </label>
          <button
            className="h-11 rounded-lg border border-[var(--admin-border)] px-4 text-sm font-semibold text-[var(--admin-ink-soft)] hover:bg-[var(--admin-surface-muted)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--admin-brand-red)]"
            onClick={onExport}
            type="button"
          >
            Xuất trang này
          </button>
        </div>
      )}
    </section>
  );
}
