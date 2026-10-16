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

    const password = screen.getByLabelText("Mật khẩu mới");
    const confirmation = screen.getByLabelText("Xác nhận mật khẩu mới");
    expect(password).toHaveAttribute("type", "password");
    expect(confirmation).toHaveAttribute("type", "password");

    await user.click(
      screen.getAllByRole("button", { name: "Hiện mật khẩu" })[0],
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

    await user.type(screen.getByLabelText("Mật khẩu mới"), "new-password");
    await user.type(
      screen.getByLabelText("Xác nhận mật khẩu mới"),
      "new-password",
    );
    await user.click(screen.getByRole("button", { name: "Đặt lại mật khẩu" }));

    expect(toast.success).toHaveBeenCalledWith(
      "Mật khẩu của bạn đã được đặt lại. Hãy đăng nhập bằng mật khẩu mới.",
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
            { title: "Yêu cầu đặt lại mật khẩu không hợp lệ." },
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

    await user.type(screen.getByLabelText("Mật khẩu mới"), "new-password");
    await user.type(
      screen.getByLabelText("Xác nhận mật khẩu mới"),
      "new-password",
    );
    await user.click(screen.getByRole("button", { name: "Đặt lại mật khẩu" }));

    expect(
      await screen.findByText("Yêu cầu đặt lại mật khẩu không hợp lệ."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Đặt lại mật khẩu" }),
    ).toBeInTheDocument();
  });
});
