// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ContentTabs } from "./content-tabs";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("ContentTabs", () => {
  it("keeps the global exam tab and all three skills connected to their existing test flows", () => {
    render(<ContentTabs section="tests" skill="speaking" />);

    expect(screen.getByRole("link", { name: "Bài tập" })).toHaveAttribute(
      "href",
      "/admin/content/speaking",
    );
    expect(screen.getByRole("link", { name: "Đề thi" })).toHaveAttribute(
      "href",
      "/admin/tests/speaking",
    );
    expect(
      screen.getByRole("link", { name: /Listening & Reading.*7 Part/i }),
    ).toHaveAttribute("href", "/admin/exams?tab=tests");
    expect(
      screen.getByRole("link", { name: /Writing.*3 Part/i }),
    ).toHaveAttribute("href", "/admin/tests/writing");
  });
});
