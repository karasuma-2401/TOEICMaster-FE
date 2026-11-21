// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PracticeSidebar, PracticeSidebarNav } from "./practice-sidebar";

const navigation = vi.hoisted(() => ({ pathname: "/pronunciation" }));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
}));

beforeEach(() => {
  navigation.pathname = "/pronunciation";
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
});

describe("PracticeSidebar", () => {
  it("renders active links and full accessible names when collapsed", () => {
    render(<PracticeSidebarNav collapsed />);

    expect(screen.getByText("Thi")).toBeInTheDocument();
    expect(screen.getByText("Tập")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Phát âm" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    const listeningReadingLinks = screen.getAllByRole("link", {
      name: "Listening & Reading",
    });
    expect(listeningReadingLinks).toHaveLength(2);
    listeningReadingLinks.forEach((link) =>
      expect(link).toHaveTextContent("L&R"),
    );
  });

  it("toggles width state and persists the preference", async () => {
    const user = userEvent.setup();
    render(<PracticeSidebar />);

    const sidebar = screen.getByTestId("practice-sidebar");
    expect(sidebar).toHaveAttribute("data-collapsed", "false");
    await user.click(screen.getByRole("button", { name: "Thu gọn thanh bên" }));
    expect(sidebar).toHaveAttribute("data-collapsed", "true");
    expect(
      screen.getByRole("button", { name: "Mở rộng thanh bên" }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(window.localStorage.getItem("toeicmaster.sidebar.collapsed")).toBe(
      "1",
    );
  });

  it("loads the saved collapsed preference", () => {
    window.localStorage.setItem("toeicmaster.sidebar.collapsed", "1");
    render(<PracticeSidebar />);

    expect(screen.getByTestId("practice-sidebar")).toHaveAttribute(
      "data-collapsed",
      "true",
    );
  });

  it("falls back to expanded when localStorage is unavailable", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("Storage disabled");
    });
    render(<PracticeSidebar />);

    expect(screen.getByTestId("practice-sidebar")).toHaveAttribute(
      "data-collapsed",
      "false",
    );
  });

  it("keeps the control usable when localStorage writes fail", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Storage disabled");
    });
    const user = userEvent.setup();
    render(<PracticeSidebar />);

    await user.click(screen.getByRole("button", { name: "Thu gọn thanh bên" }));

    expect(screen.getByTestId("practice-sidebar")).toHaveAttribute(
      "data-collapsed",
      "false",
    );
  });

  it("highlights the active route in the navigation", () => {
    navigation.pathname = "/speaking/parts/2";
    render(<PracticeSidebarNav />);

    const link = screen
      .getAllByRole("link", { name: "Speaking" })
      .find(
        (candidate) => candidate.getAttribute("href") === "/speaking/parts/1",
      );
    expect(link).toBeDefined();
    expect(link).toHaveAttribute("aria-current", "page");
  });
});
