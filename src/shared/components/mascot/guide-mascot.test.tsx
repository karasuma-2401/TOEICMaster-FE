// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { usePathname } from "next/navigation";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setMascotHidden } from "@/features/user/preferences";
import { GuideMascot } from "./guide-mascot";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

beforeEach(() => {
  localStorage.clear();
  vi.mocked(usePathname).mockReturnValue("/speaking");
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  localStorage.clear();
});

describe("GuideMascot", () => {
  it("keeps first-visit history help closed but lets Mic open it without consuming the greeting", () => {
    vi.useFakeTimers();
    vi.mocked(usePathname).mockReturnValue("/history");
    const { rerender } = render(<GuideMascot />);

    act(() => vi.advanceTimersByTime(600));
    expect(
      screen.queryByRole("region", { name: "User guide" }),
    ).not.toBeInTheDocument();
    expect(localStorage.getItem("toeicmaster-mascot-seen")).toBeNull();

    const mic = screen.getByRole("button", { name: /Mic/i });
    expect(mic).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(mic);
    expect(
      screen.getByRole("heading", { name: "Learning History" }),
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Close guide" }));
    expect(mic).toHaveAttribute("aria-expanded", "false");

    vi.mocked(usePathname).mockReturnValue("/speaking");
    rerender(<GuideMascot />);
    act(() => vi.advanceTimersByTime(600));
    expect(
      screen.getByRole("heading", { name: "Speaking Page" }),
    ).toBeVisible();
    expect(localStorage.getItem("toeicmaster-mascot-seen")).toBe("1");
  });

  it("cancels a pending greeting when navigating to history", () => {
    vi.useFakeTimers();
    const { rerender } = render(<GuideMascot />);
    vi.mocked(usePathname).mockReturnValue("/history");
    rerender(<GuideMascot />);

    act(() => vi.advanceTimersByTime(600));
    expect(
      screen.queryByRole("region", { name: "User guide" }),
    ).not.toBeInTheDocument();
    expect(localStorage.getItem("toeicmaster-mascot-seen")).toBeNull();
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
});
