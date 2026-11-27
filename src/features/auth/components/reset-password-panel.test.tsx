// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ResetPasswordPanel } from "./reset-password-panel";

const navigation = vi.hoisted(() => ({ replace: vi.fn() }));
const toast = vi.hoisted(() => ({ success: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navigation }));
vi.mock("@/shared/ui/toast", () => ({ toast }));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("ResetPasswordPanel", () => {
  it("toggles visibility for each new-password field independently", async () => {
    const user = userEvent.setup();
    render(
      <ResetPasswordPanel
        expiresAtUtc={new Date(Date.now() + 10 * 60_000).toISOString()}
        onRestart={vi.fn()}
        resetToken="reset-token"
      />,
    );

    const password = screen.getByLabelText("New password");
    const confirmation = screen.getByLabelText("Confirm new password");
    expect(password).toHaveAttribute("type", "password");
    expect(confirmation).toHaveAttribute("type", "password");

    await user.click(
      screen.getAllByRole("button", { name: "Show password" })[0],
    );
    expect(password).toHaveAttribute("type", "text");
    expect(confirmation).toHaveAttribute("type", "password");
  });

  it("submits the one-time token with a matching new password", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    render(
      <ResetPasswordPanel
        expiresAtUtc={new Date(Date.now() + 10 * 60_000).toISOString()}
        onRestart={vi.fn()}
        resetToken="reset-token"
      />,
    );

    await user.type(screen.getByLabelText("New password"), "new-password");
    await user.type(
      screen.getByLabelText("Confirm new password"),
      "new-password",
    );
    await user.click(screen.getByRole("button", { name: "Reset password" }));

    expect(toast.success).toHaveBeenCalledWith(
      "Your password has been reset. Please sign in with your new password.",
    );
    expect(navigation.replace).toHaveBeenCalledWith("/login");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/reset-password",
      expect.objectContaining({
        body: JSON.stringify({
          resetToken: "reset-token",
          newPassword: "new-password",
        }),
      }),
    );
  });

  it("keeps the form available when the reset token is rejected", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json(
            { title: "Invalid password reset request." },
            { status: 400 },
          ),
        ),
    );
    render(
      <ResetPasswordPanel
        expiresAtUtc={new Date(Date.now() + 10 * 60_000).toISOString()}
        onRestart={vi.fn()}
        resetToken="reset-token"
      />,
    );

    await user.type(screen.getByLabelText("New password"), "new-password");
    await user.type(
      screen.getByLabelText("Confirm new password"),
      "new-password",
    );
    await user.click(screen.getByRole("button", { name: "Reset password" }));

    expect(
      await screen.findByText("Invalid password reset request."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Reset password" }),
    ).toBeInTheDocument();
  });

  it("uses WCAG AA --tm-* tokens instead of failing literal hex colors", () => {
    const { container } = render(
      <ResetPasswordPanel
        expiresAtUtc={new Date(Date.now() + 10 * 60_000).toISOString()}
        onRestart={vi.fn()}
        resetToken="reset-token"
      />,
    );
    expect(container.innerHTML).not.toMatch(
      /#(?:ed361c|b7aeaa|c9c1bd|c8c0bc|a89f9b|a8a09c|938b87|c0b8b4|b6b0ad|beb7b3|ff6c0d)/i,
    );
  });
});
