// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { AdminPartRouteTabs } from "./admin-part-route-tabs";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

it("keeps every Speaking Part reachable while marking the current workspace", () => {
  render(<AdminPartRouteTabs activePart={1} skill="speaking" />);

  expect(screen.getByRole("link", { name: /Part 1/i })).toHaveAttribute(
    "href",
    "/admin/content/speaking/part-1",
  );
  expect(screen.getByRole("link", { name: /Part 5/i })).toHaveAttribute(
    "href",
    "/admin/content/speaking/part-5",
  );
  expect(screen.getByRole("link", { name: /Part 1/i })).toHaveAttribute(
    "aria-current",
    "page",
  );
});
