// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RegisterForm } from "./register-form";

afterEach(cleanup);

describe("RegisterForm", () => {
  it("shows local validation errors without submitting", async () => {
    const user = userEvent.setup();
    const onRegistrationAccepted = vi.fn();
    render(<RegisterForm onRegistrationAccepted={onRegistrationAccepted} />);

    await user.click(screen.getByRole("button", { name: "Tạo tài khoản" }));

    expect(
      await screen.findByText("Vui lòng nhập tên hiển thị."),
    ).toBeInTheDocument();
    expect(screen.getByText("Vui lòng nhập email.")).toBeInTheDocument();
    expect(screen.getByText("Vui lòng nhập mật khẩu.")).toBeInTheDocument();
    expect(
      screen.getByText("Vui lòng đồng ý với điều khoản sử dụng."),
    ).toBeInTheDocument();
    expect(onRegistrationAccepted).not.toHaveBeenCalled();
  });

  it("invokes onRegistrationAccepted with trimmed email when valid", async () => {
    const user = userEvent.setup();
    const onRegistrationAccepted = vi.fn();
    render(<RegisterForm onRegistrationAccepted={onRegistrationAccepted} />);

    await user.type(screen.getByLabelText("Tên hiển thị"), "Linh");
    await user.type(screen.getByLabelText("Email"), "  linh@example.com  ");
    await user.type(screen.getByLabelText("Mật khẩu"), "password");
    await user.type(screen.getByLabelText("Xác nhận mật khẩu"), "password");
    await user.click(
      screen.getByLabelText("Tôi đồng ý với Điều khoản sử dụng"),
    );
    await user.click(screen.getByRole("button", { name: "Tạo tài khoản" }));

    expect(onRegistrationAccepted).toHaveBeenCalledWith("linh@example.com");
  });

  it("requires consent before it submits the form", async () => {
    const user = userEvent.setup();
    const onRegistrationAccepted = vi.fn();
    render(<RegisterForm onRegistrationAccepted={onRegistrationAccepted} />);

    await user.type(screen.getByLabelText("Tên hiển thị"), "Linh");
    await user.type(screen.getByLabelText("Email"), "linh@example.com");
    await user.type(screen.getByLabelText("Mật khẩu"), "password");
    await user.type(screen.getByLabelText("Xác nhận mật khẩu"), "password");
    await user.click(screen.getByRole("button", { name: "Tạo tài khoản" }));

    expect(
      await screen.findByText("Vui lòng đồng ý với điều khoản sử dụng."),
    ).toBeInTheDocument();
    expect(onRegistrationAccepted).not.toHaveBeenCalled();
  });

  it("explains that Google registration is not available yet", async () => {
    const user = userEvent.setup();
    render(<RegisterForm onRegistrationAccepted={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Google" }));

    expect(
      screen.getByText("Đăng ký bằng Google sẽ sớm khả dụng."),
    ).toBeInTheDocument();
  });
});
