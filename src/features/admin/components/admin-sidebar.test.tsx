// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminSidebar } from "./admin-sidebar";

vi.mock("next/navigation", () => ({ usePathname: () => "/admin/users" }));
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("AdminSidebar", () => {
  const props = {
    isCollapsed: false,
    isMobileOpen: false,
    onCloseMobile: vi.fn(),
    onToggleCollapsed: vi.fn(),
  };

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("marks the current admin section and offers the collapse control", () => {
    render(<AdminSidebar {...props} />);
    expect(screen.getByRole("link", { name: "Người dùng" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Thu gọn thanh điều hướng" }),
    );
    expect(props.onToggleCollapsed).toHaveBeenCalledOnce();
  });

  it("keeps available Writing data pages navigable while future pages stay disabled", () => {
    render(<AdminSidebar {...props} />);

    expect(screen.getByRole("link", { name: "Kho dữ liệu" })).toHaveAttribute(
      "href",
      "/admin/content/writing",
    );
    expect(
      screen.getByRole("button", { name: /Nhật ký hoạt động/ }),
    ).toBeDisabled();
  });

  it("closes the mobile menu when its backdrop is selected", () => {
    render(<AdminSidebar {...props} isMobileOpen />);
    fireEvent.click(screen.getByRole("button", { name: "Đóng menu quản trị" }));
    expect(props.onCloseMobile).toHaveBeenCalledOnce();
  });
});
