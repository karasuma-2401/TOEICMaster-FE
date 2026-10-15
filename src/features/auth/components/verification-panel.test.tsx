// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { VerificationPanel } from "./verification-panel";

const navigation = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navigation }));

afterEach(cleanup);

describe("VerificationPanel", () => {
  it("requires a six-digit code before verification", async () => {
    const user = userEvent.setup();
    render(
      <VerificationPanel
        email="linh@example.com"
        onChangeEmail={vi.fn()}
        purpose="recovery"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Xác minh mã" }));

    expect(
      await screen.findByText("Vui lòng nhập mã gồm 6 chữ số."),
    ).toBeInTheDocument();
  });

  it("verifies a registration OTP and returns to login", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    render(
      <VerificationPanel
        email="linh@example.com"
        onChangeEmail={vi.fn()}
        purpose="registration"
      />,
    );

    expect(screen.getByText("linh@example.com")).toBeInTheDocument();
    expect(screen.getByText("XÁC MINH TÀI KHOẢN")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Mã xác minh"), "123456");
    await user.click(screen.getByRole("button", { name: "Xác minh mã" }));

    expect(navigation.replace).toHaveBeenCalledWith("/login");
    expect(navigation.refresh).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/verify-email",
      expect.objectContaining({
        body: JSON.stringify({ email: "linh@example.com", code: "123456" }),
      }),
    );
  });

  it("verifies a recovery OTP and resends a recovery code", async () => {
    const user = userEvent.setup();
    const onChangeEmail = vi.fn();
    const onPasswordResetVerified = vi.fn();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          resetToken: "reset-token",
          expiresAtUtc: new Date(Date.now() + 10 * 60_000).toISOString(),
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 202 }));
    vi.stubGlobal("fetch", fetchMock);
    render(
      <VerificationPanel
        email="linh@example.com"
        onChangeEmail={onChangeEmail}
        onPasswordResetVerified={onPasswordResetVerified}
        purpose="recovery"
      />,
    );

    await user.type(screen.getByLabelText("Mã xác minh"), "123456");
    await user.click(screen.getByRole("button", { name: "Xác minh mã" }));
    expect(onPasswordResetVerified).toHaveBeenCalledWith(
      expect.objectContaining({ resetToken: "reset-token" }),
    );

    await user.click(screen.getByRole("button", { name: "Gửi lại mã" }));
    expect(
      await screen.findByText(
        "Nếu email có thể đặt lại mật khẩu, một mã mới sẽ được gửi khi thời gian chờ kết thúc.",
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Nhập lại email" }));
    expect(onChangeEmail).toHaveBeenCalledOnce();
  });
});
