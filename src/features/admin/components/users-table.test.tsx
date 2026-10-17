// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AdminUser } from "@/features/admin/users";
import { UsersTable } from "./users-table";

const user: AdminUser = {
  id: "usr-1",
  fullName: "Nguyễn Minh Anh",
  email: "minh@example.com",
  role: "USER",
  status: "ACTIVE",
  emailVerified: true,
  authProvider: "PASSWORD",
  createdAt: "2026-10-01T10:00:00Z",
  lastLoginAt: null,
};

describe("UsersTable", () => {
  it("renders semantic rows and emits selection and sort changes", () => {
    const onSelectionChange = vi.fn();
    const onSelectAll = vi.fn();
    const onSort = vi.fn();
    render(
      <UsersTable
        users={[user]}
        selectedIds={new Set()}
        sort="createdAt:desc"
        onSelectionChange={onSelectionChange}
        onSelectAll={onSelectAll}
        onSort={onSort}
      />,
    );
    expect(
      screen.getByRole("row", { name: /Nguyễn Minh Anh/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: /Ngày tạo/ }),
    ).toHaveAttribute("aria-sort", "descending");
    fireEvent.click(
      screen.getByRole("checkbox", { name: "Chọn Nguyễn Minh Anh" }),
    );
    fireEvent.click(screen.getByRole("button", { name: /Người dùng/ }));
    expect(onSelectionChange).toHaveBeenCalledWith("usr-1", true);
    expect(onSort).toHaveBeenCalledWith("fullName");
  });
});
