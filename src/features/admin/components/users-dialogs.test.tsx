// @vitest-environment jsdom
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AdminUsersApiError,
  createAdminUser,
  lockAdminUser,
  updateAdminUser,
} from "@/features/admin/api";
import type { AdminUser } from "@/features/admin/users";
import {
  ChangeRoleDialog,
  ConfirmUserActionDialog,
  CreateUserDialog,
  UserActionsMenu,
} from "./users-dialogs";

vi.mock("@/features/admin/api", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/features/admin/api")>();
  return {
    ...original,
    createAdminUser: vi.fn(),
    updateAdminUser: vi.fn(),
    lockAdminUser: vi.fn(),
    unlockAdminUser: vi.fn(),
    deleteAdminUser: vi.fn(),
    sendAdminPasswordReset: vi.fn(),
  };
});
afterEach(() => vi.clearAllMocks());

const user: AdminUser = {
  id: "usr-1",
  fullName: "Nguyen Minh Anh",
  email: "minh@example.com",
  role: "ADMIN",
  status: "ACTIVE",
  emailVerified: true,
  authProvider: "PASSWORD",
  createdAt: "2026-10-01T10:00:00Z",
  lastLoginAt: null,
};

describe("Admin Users dialogs", () => {
  it("creates a user and reports it to the page", async () => {
    const userEvents = userEvent.setup();
    const onCreated = vi.fn();
    vi.mocked(createAdminUser).mockResolvedValue({
      ...user,
      role: "USER",
      status: "PENDING",
    });
    render(<CreateUserDialog onClose={vi.fn()} onCreated={onCreated} open />);

    const dialog = screen.getByRole("dialog", { name: "Add user" });
    await userEvents.type(within(dialog).getByLabelText(/Full name/), "Minh");
    await userEvents.type(
      within(dialog).getByLabelText(/Email/),
      "minh@example.com",
    );
    await userEvents.click(
      within(dialog).getByRole("button", { name: "Create user" }),
    );

    await waitFor(() => expect(onCreated).toHaveBeenCalled());
    expect(createAdminUser).toHaveBeenCalledWith({
      fullName: "Minh",
      email: "minh@example.com",
      role: "USER",
      sendActivationEmail: true,
    });
  });

  it("shows field messages from a 400 ValidationProblemDetails", async () => {
    const userEvents = userEvent.setup();
    vi.mocked(createAdminUser).mockRejectedValue(
      new AdminUsersApiError(400, "Validation failed", null, null, null, {
        email: ["Email is invalid."],
      }),
    );
    render(<CreateUserDialog onClose={vi.fn()} onCreated={vi.fn()} open />);
    await userEvents.click(screen.getByRole("button", { name: "Create user" }));

    expect(await screen.findByText("Email is invalid.")).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("explains 409 LAST_ACTIVE_ADMIN with its trace id instead of a connection error", async () => {
    const userEvents = userEvent.setup();
    vi.mocked(updateAdminUser).mockRejectedValue(
      new AdminUsersApiError(
        409,
        "At least one active administrator is required.",
        "LAST_ACTIVE_ADMIN",
        "At least one active administrator is required.",
        "00-trace-01",
      ),
    );
    render(<ChangeRoleDialog onClose={vi.fn()} onDone={vi.fn()} user={user} />);

    await userEvents.selectOptions(screen.getByLabelText("Role"), "USER");
    await userEvents.click(screen.getByRole("button", { name: "Save role" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/last active administrator/i);
    expect(alert).toHaveTextContent("00-trace-01");
    expect(alert).not.toHaveTextContent(/connect/i);
  });

  it("confirms a lock and reports success", async () => {
    const userEvents = userEvent.setup();
    const onDone = vi.fn();
    vi.mocked(lockAdminUser).mockResolvedValue();
    render(
      <ConfirmUserActionDialog
        action="lock"
        onClose={vi.fn()}
        onDone={onDone}
        user={user}
      />,
    );

    await userEvents.click(
      screen.getByRole("button", { name: "Lock account" }),
    );

    await waitFor(() =>
      expect(onDone).toHaveBeenCalledWith("Locked Nguyen Minh Anh."),
    );
    expect(lockAdminUser).toHaveBeenCalledWith("usr-1");
  });

  it("opens an enabled, keyboard-accessible row action menu", async () => {
    const userEvents = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <UserActionsMenu
        onSelect={onSelect}
        user={{ ...user, authProvider: "GOOGLE" }}
      />,
    );
    const trigger = screen.getByRole("button", {
      name: "Actions for Nguyen Minh Anh",
    });
    expect(trigger).toBeEnabled();

    trigger.focus();
    await userEvents.keyboard("{Enter}");
    const menu = await screen.findByRole("menu");
    expect(
      within(menu).getByRole("menuitem", { name: "Send password reset" }),
    ).toHaveAttribute("aria-disabled", "true");
    await userEvents.click(
      within(menu).getByRole("menuitem", { name: "Delete user" }),
    );

    expect(onSelect).toHaveBeenCalledWith("delete");
  });
});
