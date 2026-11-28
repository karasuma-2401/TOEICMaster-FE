// @vitest-environment jsdom

import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setMascotHidden } from "@/features/user/preferences";
import { GuideMascot } from "./guide-mascot";

let mockPathname = "/speaking";

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

beforeEach(() => {
  localStorage.clear();
  mockPathname = "/speaking";
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
  localStorage.clear();
});

describe("GuideMascot", () => {
  it("keeps first-visit history help closed and opens Learning History on Mic click", async () => {
    mockPathname = "/history";
    const user = userEvent.setup();
    render(<GuideMascot />);

    expect(
      screen.queryByRole("region", { name: "User guide" }),
    ).not.toBeInTheDocument();

    const mic = screen.getByRole("button", { name: /Mic/i });
    expect(mic).toHaveAttribute("aria-expanded", "false");
    await user.click(mic);
    expect(
      screen.getByRole("heading", { name: "Learning History" }),
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Close guide" }));
    expect(mic).toHaveAttribute("aria-expanded", "false");
  });

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

  it("stays closed by default even after 1s and toggles open/closed on click", async () => {
    vi.useFakeTimers();
    render(<GuideMascot />);

    const trigger = screen.getByRole("button", {
      name: "Ask Mic how to use this page",
    });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByRole("region", { name: "User guide" }),
    ).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByRole("region", { name: "User guide" }),
    ).not.toBeInTheDocument();

    vi.useRealTimers();
    const user = userEvent.setup();
    await user.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("region", { name: "User guide" }),
    ).toBeInTheDocument();

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByRole("region", { name: "User guide" }),
    ).not.toBeInTheDocument();
  });

  it.each([
    "/exams/lr/attempts/a/attempt",
    "/speaking/attempts/a",
    "/writing/attempts/a",
    "/listening/practice/1",
    "/reading/practice/5/item-1",
    "/speaking/parts/2",
    "/writing/parts/1",
  ])("renders null on active exam/practice route %s", (route) => {
    mockPathname = route;
    const { container } = render(<GuideMascot />);
    expect(container).toBeEmptyDOMElement();
  });
});
