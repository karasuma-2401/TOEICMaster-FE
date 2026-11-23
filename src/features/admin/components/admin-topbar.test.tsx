// @vitest-environment jsdom
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminTopbar } from "./admin-topbar";

vi.mock("next/navigation", () => ({ usePathname: () => "/admin/users" }));

describe("AdminTopbar", () => {
  it("shows the admin context and opens the mobile menu", () => {
    const onOpenMenu = vi.fn();
    render(<AdminTopbar onOpenMenu={onOpenMenu} />);
    const breadcrumb = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(within(breadcrumb).getByText("Admin")).toBeInTheDocument();
    expect(within(breadcrumb).getByText("Users")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Open admin menu" }));
    expect(onOpenMenu).toHaveBeenCalledOnce();
  });

  it("links back to the learner practice area", () => {
    const { container } = render(<AdminTopbar onOpenMenu={vi.fn()} />);
    expect(
      within(container).getByRole("link", { name: "Back to practice" }),
    ).toHaveAttribute("href", "/#home-skills");
  });
});
