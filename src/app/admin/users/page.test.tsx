// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const suspended = vi.hoisted(() => new Promise<never>(() => {}));

vi.mock("@/features/admin/components/users-page", () => ({
  UsersPage: () => {
    throw suspended;
  },
  UsersPageSkeleton: () => <div>Đang tải trang quản lý người dùng</div>,
}));

import AdminUsersRoute from "./page";

describe("AdminUsersRoute", () => {
  it("places the users page under a Suspense fallback", () => {
    render(<AdminUsersRoute />);
    expect(
      screen.getByText("Đang tải trang quản lý người dùng"),
    ).toBeInTheDocument();
  });
});
