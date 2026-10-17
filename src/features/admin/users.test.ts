import { describe, expect, it } from "vitest";
import {
  adminUsersQueryString,
  DEFAULT_ADMIN_USERS_QUERY,
  formatAdminUserDate,
  getAdminUserInitials,
  parseAdminUsersQuery,
  parseAdminUsersResponse,
} from "./users";

const user = {
  id: "user-1",
  fullName: "Nguyễn Minh Anh",
  email: "minh@example.com",
  role: "USER",
  status: "ACTIVE",
  emailVerified: true,
  authProvider: "PASSWORD",
  createdAt: "2026-10-01T10:00:00Z",
  lastLoginAt: null,
};

describe("admin users data", () => {
  it("validates paginated API data", () => {
    expect(
      parseAdminUsersResponse({
        items: [user],
        page: 1,
        pageSize: 10,
        totalItems: 1,
        totalPages: 1,
        stats: {
          totalUsers: 1,
          activeUsers: 1,
          pendingUsers: 0,
          lockedUsers: 0,
        },
      }).items,
    ).toEqual([user]);
    expect(() =>
      parseAdminUsersResponse({ items: [{ ...user, role: "OWNER" }] }),
    ).toThrow();
  });

  it("normalizes query parameters and builds a shareable URL", () => {
    const query = parseAdminUsersQuery(
      new URLSearchParams(
        "page=0&pageSize=20&q=%20Mai%20&role=ADMIN&status=LOCKED&sort=fullName%3Aasc",
      ),
    );
    expect(query).toEqual({
      ...DEFAULT_ADMIN_USERS_QUERY,
      pageSize: 20,
      q: "Mai",
      role: "ADMIN",
      status: "LOCKED",
      sort: "fullName:asc",
    });
    expect(adminUsersQueryString(query)).toContain("status=LOCKED");
  });

  it("formats names and missing timestamps safely", () => {
    expect(getAdminUserInitials("Nguyễn Minh Anh")).toBe("NA");
    expect(formatAdminUserDate(null)).toBe("Chưa đăng nhập");
  });
});
