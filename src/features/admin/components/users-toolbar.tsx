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
      aria-label="User filters"
      className="mt-5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-3"
    >
      {selectedCount > 0 ? (
        <div className="flex min-h-11 items-center justify-between gap-3 rounded-lg bg-[var(--admin-ink)] px-3 text-sm text-white">
          <span aria-live="polite">{selectedCount} users selected</span>
          <button
            className="rounded-md px-2 py-1 font-semibold hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white"
            onClick={onClearSelection}
            type="button"
          >
            Clear selection
          </button>
        </div>
      ) : (
        <AdminFilterBar>
          <AdminSearchField
            label="Search by name or email"
            onChange={setSearchValue}
            placeholder="Search by name or email"
            value={searchValue}
          />
          <AdminFilterSelect
            allValue="ALL"
            ariaLabel="Filter by role"
            label="Role"
            onChange={onRoleChange}
            options={ADMIN_USER_ROLES.map((role) => ({
              value: role,
              label: role === "ADMIN" ? "Admin" : "Learner",
            }))}
            value={query.role}
          />
          <AdminFilterSelect
            allValue="ALL"
            ariaLabel="Filter by status"
            label="Status"
            onChange={onStatusChange}
            options={ADMIN_USER_STATUSES.map((status) => ({
              value: status,
              label:
                status === "ACTIVE"
                  ? "Active"
                  : status === "PENDING"
                    ? "Pending verification"
                    : "Locked",
            }))}
            value={query.status}
          />
          <button
            className="ml-auto h-9 cursor-pointer rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 text-[13px] font-medium text-[var(--admin-ink-soft)] hover:bg-[var(--admin-surface-muted)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--admin-brand-red)]"
            onClick={onExport}
            type="button"
          >
            Export this page
          </button>
        </AdminFilterBar>
      )}
    </section>
  );
}
