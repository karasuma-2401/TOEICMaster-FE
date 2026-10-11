// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { LoginPanel } from "./login-panel";

afterEach(cleanup);

describe("LoginPanel", () => {
  it("validates credentials before showing the sign-in availability notice", async () => {
    const user = userEvent.setup();
    render(<LoginPanel />);

    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));

    expect(await screen.findByText("Vui lòng nhập email.")).toBeInTheDocument();
    expect(screen.getByText("Vui lòng nhập mật khẩu.")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Email"), "linh@example.com");
    await user.type(screen.getByLabelText("Mật khẩu"), "password");
    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));

    expect(
      await screen.findByText(
        "Tính năng đăng nhập đang được hoàn thiện. Thông tin của bạn chưa được gửi đi.",
      ),
    ).toBeInTheDocument();
  });

  it("supports password visibility and local remember-me state", async () => {
    const user = userEvent.setup();
    render(<LoginPanel />);

    const password = screen.getByLabelText("Mật khẩu");
    expect(password).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: "Hiện mật khẩu" }));
    expect(password).toHaveAttribute("type", "text");

    const rememberMe = screen.getByLabelText("Ghi nhớ đăng nhập");
    await user.click(rememberMe);
    expect(rememberMe).toBeChecked();
  });

  it("shows the designed recovery view and can return to login", async () => {
    const user = userEvent.setup();
    render(<LoginPanel />);

    await user.click(screen.getByRole("button", { name: "Quên mật khẩu?" }));
    expect(
      await screen.findByRole("heading", { name: "Quên mật khẩu?" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Gửi mã xác minh" }));
    expect(await screen.findByText("Vui lòng nhập email.")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Email"), "linh@example.com");
    await user.click(screen.getByRole("button", { name: "Gửi mã xác minh" }));
    expect(
      await screen.findByRole("heading", { name: "Xác minh email" }),
    ).toBeInTheDocument();
    expect(screen.getByText("linh@example.com")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Nhập lại email" }));
    expect(
      await screen.findByRole("heading", {
        name: "Quên mật khẩu?",
      }),
    ).toBeInTheDocument();
  });

  it("shows an availability notice for Google", async () => {
    const user = userEvent.setup();
    render(<LoginPanel />);

    await user.click(screen.getByRole("button", { name: "Google" }));

    expect(
      await screen.findByText("Đăng nhập bằng Google sẽ sớm khả dụng."),
    ).toBeInTheDocument();
  });
});
