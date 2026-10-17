// @vitest-environment jsdom
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminTopbar } from "./admin-topbar";

vi.mock("next/navigation", () => ({ usePathname: () => "/admin/users" }));

describe("AdminTopbar", () => {
  it("shows the admin context and opens the mobile menu", () => {
    const onOpenMenu = vi.fn();
    render(<AdminTopbar onOpenMenu={onOpenMenu} />);
    const breadcrumb = screen.getByRole("navigation", { name: "Đường dẫn" });
    expect(within(breadcrumb).getByText("Quản trị")).toBeInTheDocument();
    expect(within(breadcrumb).getByText("Người dùng")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Mở menu quản trị" }));
    expect(onOpenMenu).toHaveBeenCalledOnce();
  });
});
