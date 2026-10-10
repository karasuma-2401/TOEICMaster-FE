// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RegisterForm } from "./register-form";

const { registerMock } = vi.hoisted(() => ({ registerMock: vi.fn() }));

vi.mock("@/features/auth/register", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/auth/register")>();
  return { ...actual, register: registerMock };
});

beforeEach(() => registerMock.mockReset());
afterEach(cleanup);

describe("RegisterForm", () => {
  it("shows local validation errors without submitting", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.click(screen.getByRole("button", { name: "Tạo tài khoản" }));

    expect(
      await screen.findByText("Vui lòng nhập tên hiển thị."),
    ).toBeInTheDocument();
    expect(screen.getByText("Vui lòng nhập email.")).toBeInTheDocument();
    expect(screen.getByText("Vui lòng nhập mật khẩu.")).toBeInTheDocument();
    expect(
      screen.getByText("Vui lòng đồng ý với điều khoản sử dụng."),
    ).toBeInTheDocument();
    expect(registerMock).not.toHaveBeenCalled();
  });

  it("shows the verification message after registration succeeds", async () => {
    registerMock.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText("Tên hiển thị"), "Linh");
    await user.type(screen.getByLabelText("Email"), "linh@example.com");
    await user.type(screen.getByLabelText("Mật khẩu"), "password");
    await user.type(screen.getByLabelText("Xác nhận mật khẩu"), "password");
    await user.click(
      screen.getByLabelText("Tôi đồng ý với Điều khoản sử dụng"),
    );
    await user.click(screen.getByRole("button", { name: "Tạo tài khoản" }));

    expect(
      await screen.findByRole("heading", { name: "Kiểm tra email của bạn" }),
    ).toBeInTheDocument();
    expect(registerMock).toHaveBeenCalledWith({
      displayName: "Linh",
      email: "linh@example.com",
      password: "password",
      confirmPassword: "password",
      termsAccepted: true,
    });
  });

  it("requires consent before it submits the form", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText("Tên hiển thị"), "Linh");
    await user.type(screen.getByLabelText("Email"), "linh@example.com");
    await user.type(screen.getByLabelText("Mật khẩu"), "password");
    await user.type(screen.getByLabelText("Xác nhận mật khẩu"), "password");
    await user.click(screen.getByRole("button", { name: "Tạo tài khoản" }));

    expect(
      await screen.findByText("Vui lòng đồng ý với điều khoản sử dụng."),
    ).toBeInTheDocument();
    expect(registerMock).not.toHaveBeenCalled();
  });

  it("shows Google registration as unavailable", () => {
    render(<RegisterForm />);

    expect(
      screen.getByRole("button", { name: "Đăng ký bằng Google, sắp có" }),
    ).toBeDisabled();
  });
});
