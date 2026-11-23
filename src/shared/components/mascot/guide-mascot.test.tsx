// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setMascotHidden } from "@/features/user/preferences";
import { GuideMascot } from "./guide-mascot";

vi.mock("next/navigation", () => ({
  usePathname: () => "/speaking",
}));

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("GuideMascot", () => {
  it("renders when mascot preference is not hidden and hides when setMascotHidden(true) is called", async () => {
    render(<GuideMascot />);
    expect(
      await screen.findByRole("button", { name: /Mic/i }),
    ).toBeInTheDocument();

    setMascotHidden(true);

    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: /Mic/i }),
      ).not.toBeInTheDocument();
    });

    setMascotHidden(false);

    expect(
      await screen.findByRole("button", { name: /Mic/i }),
    ).toBeInTheDocument();
  });
});
