// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PracticeSidebar } from "./practice-sidebar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/speaking/parts/2",
}));

afterEach(() => {
  window.localStorage.clear();
});

describe("PracticeSidebar", () => {
  it("collapses to a rail and expands again from the middle button", async () => {
    const { container } = render(<PracticeSidebar />);
    const aside = container.querySelector("aside")!;
    const toggle = screen.getByRole("button", { name: "Thu gọn thanh bên" });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(aside).toHaveAttribute("data-collapsed", "false");
    expect(screen.getAllByText("Listening & Reading")).toHaveLength(2);

    await userEvent.click(toggle);

    expect(aside).toHaveAttribute("data-collapsed", "true");
    expect(window.localStorage.getItem("toeicmaster.sidebar.collapsed")).toBe(
      "1",
    );
    const expand = screen.getByRole("button", { name: "Mở rộng thanh bên" });
    expect(expand).toHaveAttribute("aria-expanded", "false");
    // Short labels on screen, full names for assistive technology.
    expect(screen.getAllByText("L&R")).toHaveLength(2);
    const current = screen.getByRole("link", {
      name: "Speaking",
      current: "page",
    });
    expect(current).toHaveAttribute("href", "/speaking/parts/1");

    await userEvent.click(expand);
    expect(aside).toHaveAttribute("data-collapsed", "false");
  });

  it("starts collapsed when the viewer collapsed it before", () => {
    window.localStorage.setItem("toeicmaster.sidebar.collapsed", "1");
    const { container } = render(<PracticeSidebar />);
    expect(container.querySelector("aside")).toHaveAttribute(
      "data-collapsed",
      "true",
    );
  });
});
