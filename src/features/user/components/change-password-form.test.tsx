// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/features/user/api";
import { ChangePasswordForm } from "./change-password-form";

const mocks = vi.hoisted(() => ({
  changePassword: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  replace: vi.fn(),
}));
vi.mock("@/features/user/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/user/api")>();
  return { ...actual, changePassword: mocks.changePassword };
});
vi.mock("@/shared/ui/toast", () => ({
  toast: { success: mocks.success, error: mocks.error },
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  mocks.changePassword.mockResolvedValue(undefined);
});

describe("ChangePasswordForm", () => {
  it("shows client-side errors when submitted empty and clears them when edited", async () => {
    const user = userEvent.setup();
    render(<ChangePasswordForm />);
    await user.click(screen.getByRole("button", { name: "Update password" }));
    expect(
      await screen.findByText("Please enter your current password."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Please enter a new password."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Please confirm your new password."),
    ).toBeInTheDocument();
    await user.type(screen.getByLabelText("Current password"), "oldpassword");
    expect(
      screen.queryByText("Please enter your current password."),
    ).not.toBeInTheDocument();
    expect(mocks.changePassword).not.toHaveBeenCalled();
  });

  it("allows toggling password visibility", async () => {
    const user = userEvent.setup();
    render(<ChangePasswordForm />);
    const current = screen.getByLabelText("Current password");
    expect(current).toHaveAttribute("type", "password");
    await user.click(
      screen.getAllByRole("button", { name: "Show password" })[0],
    );
    expect(current).toHaveAttribute("type", "text");
    await user.click(
      screen.getAllByRole("button", { name: "Hide password" })[0],
    );
    expect(current).toHaveAttribute("type", "password");
  });

  it("shows backend wrong-password field error on the current password input", async () => {
    const user = userEvent.setup();
    mocks.changePassword.mockRejectedValueOnce(
      new ApiError(400, "Invalid", {
        currentPassword: "Current password is incorrect.",
      }),
    );
    render(<ChangePasswordForm />);
    await user.type(
      screen.getByLabelText("Current password"),
      "wrong-password",
    );
    await user.type(screen.getByLabelText("New password"), "new-password-123");
    await user.type(
      screen.getByLabelText("Confirm new password"),
      "new-password-123",
    );
    await user.click(screen.getByRole("button", { name: "Update password" }));
    expect(
      await screen.findByText("Current password is incorrect."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Current password")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("shows 400 title without field errors on the current password input", async () => {
    const user = userEvent.setup();
    mocks.changePassword.mockRejectedValueOnce(
      new ApiError(
        400,
        "Current password is incorrect or this account does not have a password.",
      ),
    );
    render(<ChangePasswordForm />);
    await user.type(
      screen.getByLabelText("Current password"),
      "wrong-password",
    );
    await user.type(screen.getByLabelText("New password"), "new-password-123");
    await user.type(
      screen.getByLabelText("Confirm new password"),
      "new-password-123",
    );
    await user.click(screen.getByRole("button", { name: "Update password" }));
    expect(
      await screen.findByText(
        "Current password is incorrect or this account does not have a password.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Current password")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("calls the API on success, clears all three inputs, and shows a success toast", async () => {
    const user = userEvent.setup();
    render(<ChangePasswordForm />);
    await user.type(
      screen.getByLabelText("Current password"),
      "old-password-123",
    );
    await user.type(screen.getByLabelText("New password"), "new-password-123");
    await user.type(
      screen.getByLabelText("Confirm new password"),
      "new-password-123",
    );
    await user.click(screen.getByRole("button", { name: "Update password" }));
    expect(mocks.changePassword).toHaveBeenCalledWith({
      currentPassword: "old-password-123",
      newPassword: "new-password-123",
      confirmPassword: "new-password-123",
    });
    expect(await screen.findByLabelText("Current password")).toHaveValue("");
    expect(screen.getByLabelText("New password")).toHaveValue("");
    expect(screen.getByLabelText("Confirm new password")).toHaveValue("");
    expect(mocks.success).toHaveBeenCalledWith(
      "Password changed successfully.",
    );
  });

  it("hides the form when the account has no password", () => {
    render(<ChangePasswordForm hasPassword={false} />);
    expect(
      screen.getByText(
        "This account signs in with Google and does not have a password.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Current password")).not.toBeInTheDocument();
  });
});
