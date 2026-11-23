// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SkillHeader } from "./skill-header";

const navigation = vi.hoisted(() => ({ pathname: "/writing" }));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
}));

beforeEach(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

describe("SkillHeader", () => {
  it("renders PracticeSidebar, keeps active optional, and shows account in header and mobile menu", async () => {
    const user = userEvent.setup();
    render(<SkillHeader account={<button type="button">Account</button>} />);

    expect(screen.getByTestId("practice-sidebar")).toBeInTheDocument();
    const header = screen.getByRole("banner");
    expect(
      within(header).getByRole("button", { name: "Account" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("navigation", { name: "Practice" }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: "Account" }),
    ).toBeInTheDocument();
  });

  it("supports backward-compatible active, wide, and center slots", () => {
    navigation.pathname = "/writing/practice/1";
    render(
      <SkillHeader
        account={<span>UserAccount</span>}
        active="writing"
        center={<span data-testid="header-center">Part 1 · Writing</span>}
        wide
      />,
    );

    const header = screen.getByRole("banner");
    expect(within(header).getByTestId("header-center")).toHaveTextContent(
      "Part 1 · Writing",
    );
    expect(within(header).getByText("UserAccount")).toBeInTheDocument();
    const sidebar = screen.getByTestId("practice-sidebar");
    const activeLinks = sidebar.querySelectorAll('[aria-current="page"]');
    expect(activeLinks).toHaveLength(1);
    expect(activeLinks[0]).toHaveAttribute("href", "/writing/practice/1");
  });
});
