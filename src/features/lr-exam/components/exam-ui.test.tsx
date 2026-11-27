// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LearnerNav } from "./exam-ui";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/features/user/components/user-menu", () => ({
  UserMenu: () => <div data-testid="user-menu" />,
}));

afterEach(cleanup);

describe("LearnerNav", () => {
  it("renders Practice by Part as a focusable link to /listening-reading", () => {
    render(<LearnerNav />);

    const link = screen.getByRole("link", { name: "Practice by Part" });
    expect(link).toHaveAttribute("href", "/listening-reading");
    expect(link.className).toContain("focus-visible:outline-2");
  });
});
