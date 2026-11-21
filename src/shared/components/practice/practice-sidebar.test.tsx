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
  vi.restoreAllMocks();
});

describe("PracticeSidebar", () => {
  it("renders icons alongside labels when expanded", () => {
    render(<PracticeSidebarNav />);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(10);
    links.forEach((link) => {
      expect(link.querySelector("svg[aria-hidden='true']")).toBeInTheDocument();
    });
    expect(screen.getByText("Đề thi")).toBeVisible();
    expect(screen.getByText("Bài tập")).toBeVisible();
    expect(screen.getByRole("link", { name: "Kiến thức" })).toHaveAttribute(
      "href",
      "/knowledge",
    );
    expect(screen.getByText("Flashcards")).toBeVisible();
    expect(screen.getByText("Phát âm")).toBeVisible();
    expect(screen.getByText("Lịch sử")).toBeVisible();
  });

  it("renders icon-only links with accessible names and tooltips when collapsed", () => {
    render(<PracticeSidebarNav collapsed />);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(10);
    links.forEach((link) => {
      expect(link.querySelector("svg[aria-hidden='true']")).toBeInTheDocument();
      expect(link.textContent?.trim()).toBe("");
    });
    expect(screen.queryByText("Listening & Reading")).not.toBeInTheDocument();
    expect(screen.queryByText("Flashcards")).not.toBeInTheDocument();
    expect(screen.queryByText("Phát âm")).not.toBeInTheDocument();
    expect(screen.queryByText("Lịch sử")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Phát âm" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Phát âm" })).toHaveAttribute(
      "title",
      "Phát âm",
    );
    expect(screen.getByRole("link", { name: "Lịch sử" })).not.toHaveAttribute(
      "aria-current",
    );
    const listeningReadingLinks = screen.getAllByRole("link", {
      name: "Listening & Reading",
    });
    expect(listeningReadingLinks).toHaveLength(2);
    expect(listeningReadingLinks[0]).toHaveAttribute(
      "title",
      "Đề thi · Listening & Reading",
    );
    expect(listeningReadingLinks[1]).toHaveAttribute(
      "title",
      "Bài tập · Listening & Reading",
    );
  });

  it("toggles width state in both directions and persists the preference", async () => {
    const user = userEvent.setup();
    render(<PracticeSidebar />);

    const sidebar = screen.getByTestId("practice-sidebar");
    const toggle = screen.getByTestId("practice-sidebar-toggle");
    expect(sidebar).toHaveAttribute("data-collapsed", "false");
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(toggle).toHaveAttribute("aria-label", "Thu gọn thanh bên");

    await user.click(toggle);
    expect(sidebar).toHaveAttribute("data-collapsed", "true");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveAttribute("aria-label", "Mở rộng thanh bên");
    expect(window.localStorage.getItem("toeicmaster.sidebar.collapsed")).toBe(
      "1",
    );

    await user.click(toggle);
    expect(sidebar).toHaveAttribute("data-collapsed", "false");
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(toggle).toHaveAttribute("aria-label", "Thu gọn thanh bên");
    expect(
      window.localStorage.getItem("toeicmaster.sidebar.collapsed"),
    ).not.toBe("1");
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

    const examSpeakingLink = screen
      .getAllByRole("link", { name: "Speaking" })
      .find((candidate) => candidate.getAttribute("href") === "/speaking");
    expect(examSpeakingLink).toBeDefined();
    expect(examSpeakingLink).not.toHaveAttribute("aria-current");
  });

  it("marks exam L&R active on /exams/lr/* and leaves all items inactive on / and /profile", () => {
    navigation.pathname = "/exams/lr/123";
    const { rerender } = render(<PracticeSidebarNav />);

    const examLr = screen
      .getAllByRole("link", { name: "Listening & Reading" })
      .find(
        (candidate) => candidate.getAttribute("href") === "/listening-reading",
      );
    expect(examLr).toHaveAttribute("aria-current", "page");

    navigation.pathname = "/";
    rerender(<PracticeSidebarNav />);
    for (const link of screen.getAllByRole("link")) {
      expect(link).not.toHaveAttribute("aria-current", "page");
    }

    navigation.pathname = "/profile";
    rerender(<PracticeSidebarNav />);
    for (const link of screen.getAllByRole("link")) {
      expect(link).not.toHaveAttribute("aria-current", "page");
    }
  });
});
