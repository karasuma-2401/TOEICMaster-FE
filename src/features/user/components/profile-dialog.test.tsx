// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProfileDialog } from "./profile-dialog";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock("@/features/history/api", () => ({
  fetchUnifiedHistory: vi.fn().mockResolvedValue({
    items: [],
    unauthenticatedSkills: [],
  }),
}));

afterEach(cleanup);

describe("ProfileDialog", () => {
  const sampleUser = {
    id: "user-1",
    displayName: "Noah Adams",
    email: "learner@example.com",
    phone: "0912345678",
    dateOfBirth: null,
    targetScore: 750,
    avatarVersion: null,
    hasPassword: true,
  };

  it("does not render when isOpen = false", () => {
    render(
      <ProfileDialog isOpen={false} onClose={vi.fn()} user={sampleUser} />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("displays learner info at the top of the dialog and form fields when isOpen = true", () => {
    render(<ProfileDialog isOpen={true} onClose={vi.fn()} user={sampleUser} />);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");

    expect(screen.getByText("Noah Adams")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveValue("learner@example.com");
    expect(screen.getByText("NA")).toBeInTheDocument();

    expect(screen.getByLabelText("Display name")).toHaveValue("Noah Adams");
  });

  it("calls onClose when clicking the close button (X)", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ProfileDialog isOpen={true} onClose={onClose} user={sampleUser} />);

    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when pressing Escape", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ProfileDialog isOpen={true} onClose={onClose} user={sampleUser} />);

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when clicking the outside overlay and stays open when clicking inside the dialog", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ProfileDialog isOpen={true} onClose={onClose} user={sampleUser} />);

    // Click inside dialog
    await user.click(screen.getByRole("dialog"));
    expect(onClose).not.toHaveBeenCalled();

    // Click on overlay
    const overlay = screen.getByRole("presentation");
    await user.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shares the new single-page layout with the profile page and has no tabs", () => {
    render(<ProfileDialog isOpen={true} onClose={vi.fn()} user={sampleUser} />);

    expect(
      screen.getByRole("heading", { name: "Profile & Learning Goal" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Display name")).toBeInTheDocument();
    expect(screen.getByLabelText("Current password")).toBeInTheDocument();
    expect(screen.getByLabelText("Target score")).toHaveValue("750");
    expect(
      screen.queryByRole("button", { name: "Security" }),
    ).not.toBeInTheDocument();
  });

  it("calls onLogout when clicking the Sign out button", async () => {
    const user = userEvent.setup();
    const onLogout = vi.fn();
    render(
      <ProfileDialog
        isOpen={true}
        onClose={vi.fn()}
        onLogout={onLogout}
        user={sampleUser}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Sign out" }));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
