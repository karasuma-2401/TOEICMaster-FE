export const ADMIN_USER_ROLES = ["USER", "ADMIN"] as const;
export const ADMIN_USER_STATUSES = ["ACTIVE", "PENDING", "LOCKED"] as const;
export const ADMIN_USER_PAGE_SIZES = [10, 20, 50] as const;

export type AdminUserRole = (typeof ADMIN_USER_ROLES)[number];
export type AdminUserStatus = (typeof ADMIN_USER_STATUSES)[number];
export type AdminUserSortField = "fullName" | "createdAt" | "lastLoginAt";
export type SortDirection = "asc" | "desc";

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  role: AdminUserRole;
  status: AdminUserStatus;
  emailVerified: boolean;
  authProvider: "PASSWORD" | "GOOGLE";
  createdAt: string;
  lastLoginAt?: string | null;
}

export interface AdminUsersQuery {
  page: number;
  pageSize: (typeof ADMIN_USER_PAGE_SIZES)[number];
  q: string;
  role: AdminUserRole | "ALL";
  status: AdminUserStatus | "ALL";
  sort: `${AdminUserSortField}:${SortDirection}`;
}

export interface AdminUsersStats {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  lockedUsers: number;
}

export interface AdminUsersResponse {
  items: AdminUser[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  stats: AdminUsersStats;
}

export interface CreateAdminUserInput {
  fullName: string;
  email: string;
  role: AdminUserRole;
  sendActivationEmail: boolean;
}

export interface UpdateAdminUserInput {
  role: AdminUserRole;
}

export const DEFAULT_ADMIN_USERS_QUERY: AdminUsersQuery = {
  page: 1,
  pageSize: 10,
  q: "",
  role: "ALL",
  status: "ALL",
  sort: "createdAt:desc",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isDateOrNull(value: unknown): value is string | null {
  return (
    value === null ||
    (typeof value === "string" && Number.isFinite(Date.parse(value)))
  );
}

export function isAdminUser(value: unknown): value is AdminUser {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    value.id.length > 0 &&
    typeof value.fullName === "string" &&
    typeof value.email === "string" &&
    (value.avatarUrl === undefined ||
      value.avatarUrl === null ||
      typeof value.avatarUrl === "string") &&
    ADMIN_USER_ROLES.includes(value.role as AdminUserRole) &&
    ADMIN_USER_STATUSES.includes(value.status as AdminUserStatus) &&
    typeof value.emailVerified === "boolean" &&
    (value.authProvider === "PASSWORD" || value.authProvider === "GOOGLE") &&
    typeof value.createdAt === "string" &&
    Number.isFinite(Date.parse(value.createdAt)) &&
    (value.lastLoginAt === undefined || isDateOrNull(value.lastLoginAt))
  );
}

export function parseAdminUserResponse(value: unknown): AdminUser {
  if (!isAdminUser(value))
    throw new Error("Thông tin người dùng trả về không hợp lệ.");
  return value;
}

function isCount(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

export function parseAdminUsersResponse(value: unknown): AdminUsersResponse {
  if (!isRecord(value) || !Array.isArray(value.items) || !isRecord(value.stats))
    throw new Error("Phản hồi danh sách người dùng không hợp lệ.");
  const stats = value.stats;
  if (
    !value.items.every(isAdminUser) ||
    !isCount(value.page) ||
    value.page < 1 ||
    !isCount(value.pageSize) ||
    value.pageSize < 1 ||
    !isCount(value.totalItems) ||
    !isCount(value.totalPages) ||
    !isCount(stats.totalUsers) ||
    !isCount(stats.activeUsers) ||
    !isCount(stats.pendingUsers) ||
    !isCount(stats.lockedUsers)
  )
    throw new Error("Phản hồi danh sách người dùng không hợp lệ.");
  return value as unknown as AdminUsersResponse;
}

function validEnum<T extends string>(
  value: string | null,
  values: readonly T[],
): T | "ALL" {
  return values.find((item) => item === value) ?? "ALL";
}

export function parseAdminUsersQuery(params: URLSearchParams): AdminUsersQuery {
  const pageValue = Number(params.get("page"));
  const sizeValue = Number(params.get("pageSize"));
  const sortValue = params.get("sort") ?? DEFAULT_ADMIN_USERS_QUERY.sort;
  const validSort = /^(fullName|createdAt|lastLoginAt):(asc|desc)$/.test(
    sortValue,
  );
  return {
    page:
      Number.isInteger(pageValue) && pageValue > 0
        ? Math.min(pageValue, 10_000)
        : 1,
    pageSize:
      ADMIN_USER_PAGE_SIZES.find((size) => size === sizeValue) ??
      DEFAULT_ADMIN_USERS_QUERY.pageSize,
    q: (params.get("q") ?? "").trim().slice(0, 100),
    role: validEnum(params.get("role"), ADMIN_USER_ROLES),
    status: validEnum(params.get("status"), ADMIN_USER_STATUSES),
    sort: (validSort
      ? sortValue
      : DEFAULT_ADMIN_USERS_QUERY.sort) as AdminUsersQuery["sort"],
  };
}

export function adminUsersQueryString(query: AdminUsersQuery): string {
  const params = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
    sort: query.sort,
  });
  if (query.q) params.set("q", query.q);
  if (query.role !== "ALL") params.set("role", query.role);
  if (query.status !== "ALL") params.set("status", query.status);
  return params.toString();
}

export function getAdminUserInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  return `${parts[0][0]}${parts.length > 1 ? parts[parts.length - 1][0] : (parts[0][1] ?? "")}`.toUpperCase();
}

export function formatAdminUserDate(value: string | null | undefined): string {
  if (!value || !Number.isFinite(Date.parse(value))) return "Chưa đăng nhập";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
