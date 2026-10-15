// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ResetPasswordPanel } from "./reset-password-panel";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("ResetPasswordPanel", () => {
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

    expect(
      await screen.findByText(/Mật khẩu của bạn đã được đặt lại/),
    ).toBeInTheDocument();
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
