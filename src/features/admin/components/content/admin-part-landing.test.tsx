// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminPartLanding } from "./admin-part-landing";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("AdminPartLanding", () => {
  it("links every Speaking Part to its dedicated exercise workspace", () => {
    render(<AdminPartLanding skill="speaking" />);

    expect(
      screen.getByRole("link", { name: /Speaking Part 1.*Read a text aloud/i }),
    ).toHaveAttribute("href", "/admin/content/speaking/part-1");
    expect(
      screen.getByRole("link", {
        name: /Speaking Part 5.*Express an opinion/i,
      }),
    ).toHaveAttribute("href", "/admin/content/speaking/part-5");
  });

  it("links every Writing Part to its dedicated exercise workspace", () => {
    render(<AdminPartLanding skill="writing" />);

    expect(
      screen.getByRole("link", { name: /Writing Part 1.*Write a sentence/i }),
    ).toHaveAttribute("href", "/admin/content/writing/part-1");
    expect(
      screen.getByRole("link", { name: /Writing Part 3.*Write an opinion/i }),
    ).toHaveAttribute("href", "/admin/content/writing/part-3");
  });
});
