"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminUsersApiError, getAdminUsers } from "@/features/admin/api";
import { toast } from "@/shared/ui/toast";
import {
  ADMIN_USER_PAGE_SIZES,
  adminUsersQueryString,
  parseAdminUsersQuery,
  type AdminUser,
  type AdminUserSortField,
  type AdminUserStatus,
  type AdminUsersResponse,
} from "@/features/admin/users";
import { UsersStats } from "./users-stats";
import { UsersToolbar } from "./users-toolbar";
import { UsersTable } from "./users-table";

function downloadCurrentPage(users: AdminUser[]) {
  const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
  const rows = [
    ["Họ tên", "Email", "Vai trò", "Trạng thái", "Đăng nhập gần nhất"],
    ...users.map((user) => [
      user.fullName,
      user.email,
      user.role,
      user.status,
      user.lastLoginAt ?? "",
    ]),
  ];
  const csv = `\uFEFF${rows.map((row) => row.map(escape).join(",")).join("\r\n")}`;
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "toeicmaster-users-page.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

function LoadingState() {
  return (
    <div
      aria-label="Đang tải danh sách người dùng"
      aria-live="polite"
      className="space-y-3 p-4"
    >
      {Array.from({ length: 6 }, (_, index) => (
        <div
          className="h-12 animate-pulse rounded-lg bg-[var(--admin-skeleton)]"
          key={index}
        />
      ))}
    </div>
  );
}

export function UsersPageSkeleton() {
  return (
    <div aria-label="Đang tải trang quản lý người dùng" aria-busy="true">
      <div className="mb-6 space-y-3">
        <div className="h-3 w-40 animate-pulse rounded bg-[var(--admin-skeleton)]" />
        <div className="h-9 w-64 animate-pulse rounded bg-[var(--admin-skeleton)]" />
        <div className="h-4 w-96 max-w-full animate-pulse rounded bg-[var(--admin-skeleton)]" />
      </div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            className="h-[100px] animate-pulse rounded-xl bg-[var(--admin-skeleton)]"
            key={index}
          />
        ))}
      </div>
      <div className="mt-5 h-[68px] animate-pulse rounded-xl bg-[var(--admin-skeleton)]" />
      <section
        aria-label="Danh sách người dùng"
        className="mt-4 overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)]"
      >
        <LoadingState />
      </section>
    </div>
  );
}

export function UsersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const paramsString = searchParams.toString();
  const query = useMemo(
    () => parseAdminUsersQuery(new URLSearchParams(paramsString)),
    [paramsString],
  );
  const queryString = adminUsersQueryString(query);
  const [response, setResponse] = useState<AdminUsersResponse | null>(null);
  const [retry, setRetry] = useState(0);
  const [loadedRequest, setLoadedRequest] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<{
    key: string;
    error: AdminUsersApiError;
  } | null>(null);
  const [selection, setSelection] = useState<{
    queryKey: string;
    ids: Set<string>;
  }>({ queryKey: "", ids: new Set() });

  const updateQuery = useCallback(
    (values: Record<string, string | null>) => {
      const params = new URLSearchParams(paramsString);
      for (const [key, value] of Object.entries(values)) {
        if (value === null || value === "") params.delete(key);
        else params.set(key, value);
      }
      const next = params.toString();
      router.replace(next ? `${pathname}?${next}` : pathname, {
        scroll: false,
      });
    },
    [paramsString, pathname, router],
  );

  const onSearch = useCallback(
    (value: string) => updateQuery({ q: value, page: null }),
    [updateQuery],
  );

  const requestKey = `${queryString}|${retry}`;
  const loading = loadedRequest !== requestKey;
  const error = requestError?.key === requestKey ? requestError.error : null;
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const requestQuery = parseAdminUsersQuery(new URLSearchParams(queryString));
    getAdminUsers(requestQuery, controller.signal)
      .then((result) => {
        if (active) setResponse(result);
      })
      .catch((reason: unknown) => {
        if (!active || controller.signal.aborted) return;
        const reasonError =
          reason instanceof AdminUsersApiError
            ? reason
            : new AdminUsersApiError(
                502,
                "Không thể tải danh sách người dùng.",
              );
        setRequestError({ key: requestKey, error: reasonError });
      })
      .finally(() => {
        if (active) setLoadedRequest(requestKey);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [queryString, requestKey]);

  useEffect(() => {
    if (error?.status !== 403) return;
    toast.error("Tài khoản của bạn không có quyền truy cập khu vực quản trị.");
    router.replace("/");
  }, [error, router]);

  function selectStatus(status: AdminUserStatus | "ALL") {
    updateQuery({ status: status === "ALL" ? null : status, page: null });
  }

  function sortBy(field: AdminUserSortField) {
    const [currentField, direction] = query.sort.split(":");
    updateQuery({
      sort: `${field}:${currentField === field && direction === "asc" ? "desc" : "asc"}`,
      page: null,
    });
  }

  const users = response?.items ?? [];
  const currentResponse = response;
  const selectedIds =
    selection.queryKey === queryString ? selection.ids : new Set<string>();
  function changeSelection(update: (ids: Set<string>) => void) {
    setSelection((current) => {
      const ids =
        current.queryKey === queryString
          ? new Set(current.ids)
          : new Set<string>();
      update(ids);
      return { queryKey: queryString, ids };
    });
  }
  const firstItem =
    response && response.totalItems > 0
      ? (query.page - 1) * query.pageSize + 1
      : 0;
  const lastItem = response
    ? Math.min(query.page * query.pageSize, response.totalItems)
    : 0;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-[0.14em] text-[var(--admin-brand-red)]">
            QUẢN TRỊ / NGƯỜI DÙNG
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--admin-ink)] sm:text-3xl">
            Quản lý người dùng
          </h1>
          <p className="mt-1.5 text-sm text-[var(--admin-muted)]">
            Xem, tìm kiếm và quản lý tài khoản học viên cùng quản trị viên.
          </p>
        </div>
        <button
          className="h-11 rounded-lg px-4 text-sm font-bold text-white shadow-[var(--admin-action-shadow)] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[var(--admin-brand-red)]"
          disabled
          style={{ background: "var(--admin-brand-gradient)" }}
          title="Tạo người dùng sẽ có ở bước tiếp theo"
          type="button"
        >
          + Thêm người dùng
        </button>
      </div>

      {response && (
        <UsersStats
          stats={response.stats}
          selectedStatus={query.status}
          onSelectStatus={selectStatus}
        />
      )}
      {!response && loading && (
        <div
          aria-hidden="true"
          className="grid grid-cols-2 gap-3 xl:grid-cols-4"
        >
          {Array.from({ length: 4 }, (_, index) => (
            <div
              className="h-[100px] animate-pulse rounded-xl bg-[var(--admin-skeleton)]"
              key={index}
            />
          ))}
        </div>
      )}

      <UsersToolbar
        key={query.q}
        query={query}
        selectedCount={selectedIds.size}
        onSearch={onSearch}
        onRoleChange={(role) =>
          updateQuery({ role: role === "ALL" ? null : role, page: null })
        }
        onStatusChange={(status) =>
          updateQuery({ status: status === "ALL" ? null : status, page: null })
        }
        onExport={() => downloadCurrentPage(users)}
        onClearSelection={() =>
          setSelection({ queryKey: queryString, ids: new Set() })
        }
      />

      <section
        aria-label="Danh sách người dùng"
        className="mt-4 overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)]"
      >
        {loading ? (
          <LoadingState />
        ) : error ? (
          <div
            className={`m-4 rounded-xl p-5 ${error.status === 403 ? "bg-[var(--admin-warning-soft)] text-[var(--admin-warning)]" : "bg-[var(--admin-danger-soft)] text-[var(--admin-danger)]"}`}
            role="alert"
          >
            <h2 className="font-bold">
              {error.status === 403
                ? "Không có quyền truy cập"
                : error.status === 401
                  ? "Phiên đăng nhập đã hết hạn"
                  : "Không tải được danh sách"}
            </h2>
            <p className="mt-1 text-sm">
              {error.status === 403
                ? "Tài khoản của bạn không được phép quản lý người dùng."
                : error.status === 401
                  ? "Vui lòng đăng nhập lại để tiếp tục."
                  : error.message}
            </p>
            {error.status === 401 ? (
              <Link
                className="mt-3 inline-flex rounded-lg bg-white px-3 py-2 text-sm font-semibold underline focus-visible:outline-2 focus-visible:outline-[var(--admin-brand-red)]"
                href={`/login?next=${encodeURIComponent("/admin/users")}`}
              >
                Đăng nhập lại
              </Link>
            ) : (
              <button
                className="mt-3 rounded-lg border border-current px-3 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2"
                onClick={() => setRetry((current) => current + 1)}
                type="button"
              >
                Thử lại
              </button>
            )}
          </div>
        ) : currentResponse && users.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <span
              aria-hidden="true"
              className="mx-auto grid size-12 place-items-center rounded-full bg-[var(--admin-surface-muted)] text-xl text-[var(--admin-brand-red)]"
            >
              ⌕
            </span>
            <h2 className="mt-4 text-base font-bold text-[var(--admin-ink)]">
              {currentResponse.stats.totalUsers === 0
                ? "Chưa có người dùng nào"
                : "Không tìm thấy kết quả phù hợp"}
            </h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-[var(--admin-muted)]">
              {currentResponse.stats.totalUsers === 0
                ? "Danh sách sẽ hiển thị tại đây khi có tài khoản mới."
                : "Thử thay đổi từ khóa hoặc xóa bộ lọc hiện tại."}
            </p>
            {currentResponse.stats.totalUsers !== 0 && (
              <button
                className="mt-4 rounded-lg px-3 py-2 text-sm font-bold text-[var(--admin-brand-red)] underline focus-visible:outline-2 focus-visible:outline-[var(--admin-brand-red)]"
                onClick={() =>
                  updateQuery({ q: null, role: null, status: null, page: null })
                }
                type="button"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        ) : currentResponse ? (
          <>
            <UsersTable
              users={users}
              selectedIds={selectedIds}
              sort={query.sort}
              onSelectionChange={(id, checked) =>
                changeSelection((ids) => {
                  if (checked) ids.add(id);
                  else ids.delete(id);
                })
              }
              onSelectAll={(checked) =>
                changeSelection((ids) => {
                  for (const user of users) {
                    if (checked) ids.add(user.id);
                    else ids.delete(user.id);
                  }
                })
              }
              onSort={sortBy}
            />
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--admin-border)] px-4 py-3 text-xs text-[var(--admin-muted)] sm:px-5">
              <div className="flex items-center gap-2">
                <span>
                  Hiển thị {firstItem}–{lastItem} /{" "}
                  {currentResponse.totalItems.toLocaleString("vi-VN")}
                </span>
                <label className="flex items-center gap-1.5">
                  mỗi trang
                  <select
                    aria-label="Số người dùng mỗi trang"
                    className="rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface)] px-2 py-1 text-[var(--admin-ink)] focus-visible:outline-2 focus-visible:outline-[var(--admin-brand-red)]"
                    onChange={(event) =>
                      updateQuery({
                        pageSize:
                          event.target.value === "10"
                            ? null
                            : event.target.value,
                        page: null,
                      })
                    }
                    value={query.pageSize}
                  >
                    {ADMIN_USER_PAGE_SIZES.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <nav aria-label="Phân trang" className="flex items-center gap-1">
                <button
                  aria-label="Trang trước"
                  className="size-9 rounded-lg border border-[var(--admin-border)] disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={query.page <= 1}
                  onClick={() => updateQuery({ page: String(query.page - 1) })}
                  type="button"
                >
                  ‹
                </button>
                <span
                  aria-current="page"
                  className="grid size-9 place-items-center rounded-lg bg-[var(--admin-nav-active)] font-bold text-[var(--admin-brand-red)]"
                >
                  {query.page}
                </span>
                <span className="px-1">
                  / {Math.max(1, currentResponse.totalPages)}
                </span>
                <button
                  aria-label="Trang sau"
                  className="size-9 rounded-lg border border-[var(--admin-border)] disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={query.page >= currentResponse.totalPages}
                  onClick={() => updateQuery({ page: String(query.page + 1) })}
                  type="button"
                >
                  ›
                </button>
              </nav>
            </div>
          </>
        ) : null}
      </section>
    </div>
  );
}
