// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { VerificationPanel } from "./verification-panel";

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

  it("shows the supplied email and does not claim a working verification flow", async () => {
    const user = userEvent.setup();
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

    expect(
      await screen.findByText(
        "Tính năng xác minh mã đang được hoàn thiện. Thông tin của bạn chưa được gửi đi.",
      ),
    ).toBeInTheDocument();
  });

  it("offers email correction and resend feedback", async () => {
    const user = userEvent.setup();
    const onChangeEmail = vi.fn();
    render(
      <VerificationPanel
        email="linh@example.com"
        onChangeEmail={onChangeEmail}
        purpose="recovery"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Gửi lại mã" }));
    expect(
      await screen.findByText(
        "Tính năng gửi lại mã đang được hoàn thiện. Chúng tôi chưa gửi email nào.",
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Nhập lại email" }));
    expect(onChangeEmail).toHaveBeenCalledOnce();
  });
});
