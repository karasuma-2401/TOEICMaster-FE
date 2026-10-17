import {
  formatAdminUserDate,
  getAdminUserInitials,
  type AdminUser,
  type AdminUserSortField,
  type SortDirection,
} from "@/features/admin/users";
import { UserRoleChip } from "./user-role-chip";
import { UserStatusChip } from "./user-status-chip";

interface UsersTableProps {
  users: AdminUser[];
  selectedIds: ReadonlySet<string>;
  sort: `${AdminUserSortField}:${SortDirection}`;
  onSelectionChange: (id: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onSort: (field: AdminUserSortField) => void;
}

const columns: { label: string; field?: AdminUserSortField }[] = [
  { label: "Người dùng", field: "fullName" },
  { label: "Vai trò" },
  { label: "Trạng thái" },
  { label: "Đăng nhập gần nhất", field: "lastLoginAt" },
  { label: "Ngày tạo", field: "createdAt" },
];

export function UsersTable({
  users,
  selectedIds,
  sort,
  onSelectionChange,
  onSelectAll,
  onSort,
}: UsersTableProps) {
  const allSelected =
    users.length > 0 && users.every((user) => selectedIds.has(user.id));
  const [sortField, sortDirection] = sort.split(":") as [
    AdminUserSortField,
    SortDirection,
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[850px] border-collapse text-left text-sm">
        <thead className="bg-[var(--admin-surface-muted)] text-[10px] font-bold tracking-[0.06em] text-[var(--admin-muted)]">
          <tr>
            <th
              aria-label="Chọn người dùng"
              className="w-12 px-4 py-3"
              scope="col"
            >
              <label className="inline-flex cursor-pointer items-center">
                <span className="sr-only">
                  Chọn tất cả người dùng trên trang
                </span>
                <input
                  aria-label="Chọn tất cả người dùng trên trang"
                  checked={allSelected}
                  className="size-4 accent-[var(--admin-brand-red)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--admin-brand-red)]"
                  onChange={(event) => onSelectAll(event.target.checked)}
                  type="checkbox"
                />
              </label>
            </th>
            {columns.map((column) => {
              const active = column.field === sortField;
              return (
                <th
                  aria-sort={
                    column.field
                      ? active
                        ? sortDirection === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                      : undefined
                  }
                  className="whitespace-nowrap px-4 py-3"
                  key={column.label}
                  scope="col"
                >
                  {column.field ? (
                    <button
                      className="rounded-sm text-left hover:text-[var(--admin-ink)] focus-visible:outline-2 focus-visible:outline-[var(--admin-brand-red)]"
                      onClick={() => onSort(column.field!)}
                      type="button"
                    >
                      {column.label}
                      {active ? (sortDirection === "asc" ? " ↑" : " ↓") : ""}
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              );
            })}
            <th className="px-4 py-3 text-right" scope="col">
              Thao tác
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--admin-border)]">
          {users.map((user) => (
            <tr
              className="transition hover:bg-[var(--admin-row-hover)]"
              key={user.id}
            >
              <td aria-label={`Chọn ${user.fullName}`} className="px-4 py-4">
                <label className="inline-flex cursor-pointer items-center">
                  <span className="sr-only">Chọn {user.fullName}</span>
                  <input
                    aria-label={`Chọn ${user.fullName}`}
                    checked={selectedIds.has(user.id)}
                    className="size-4 accent-[var(--admin-brand-red)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--admin-brand-red)]"
                    onChange={(event) =>
                      onSelectionChange(user.id, event.target.checked)
                    }
                    type="checkbox"
                  />
                </label>
              </td>
              <td
                aria-label={`Thông tin ${user.fullName}, ${user.email}`}
                className="px-4 py-3"
              >
                <div className="flex min-w-[220px] items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full border border-[var(--admin-avatar-border)] bg-gradient-to-br from-[var(--admin-highlight)] to-[var(--admin-avatar-orange)] text-xs font-bold text-[var(--admin-danger)]">
                    {getAdminUserInitials(user.fullName)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-[var(--admin-ink)]">
                      {user.fullName}
                    </span>
                    <span className="block truncate text-xs text-[var(--admin-muted)]">
                      {user.email}
                    </span>
                  </span>
                </div>
              </td>
              <td className="px-4 py-3">
                <UserRoleChip userRole={user.role} />
              </td>
              <td className="px-4 py-3">
                <UserStatusChip status={user.status} />
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-xs text-[var(--admin-ink-soft)]">
                {formatAdminUserDate(user.lastLoginAt)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-xs text-[var(--admin-ink-soft)]">
                {formatAdminUserDate(user.createdAt)}
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  aria-label={`Thao tác với ${user.fullName}`}
                  className="size-9 rounded-lg text-lg text-[var(--admin-muted)] hover:bg-[var(--admin-surface-muted)] hover:text-[var(--admin-ink)] focus-visible:outline-2 focus-visible:outline-[var(--admin-brand-red)]"
                  disabled
                  title="Thao tác chi tiết sẽ có ở bước tiếp theo"
                  type="button"
                >
                  •••
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
