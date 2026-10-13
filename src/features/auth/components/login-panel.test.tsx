// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LoginPanel } from "./login-panel";

const navigation = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navigation }));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("LoginPanel", () => {
  it("validates credentials and signs in with the backend", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        user: { id: "user-id", displayName: "Linh", email: "linh@example.com" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<LoginPanel />);

    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));

    expect(await screen.findByText("Vui lòng nhập email.")).toBeInTheDocument();
    expect(screen.getByText("Vui lòng nhập mật khẩu.")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Email"), "linh@example.com");
    await user.type(screen.getByLabelText("Mật khẩu"), "password");
    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));

    expect(navigation.replace).toHaveBeenCalledWith("/");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/login",
      expect.objectContaining({
        body: JSON.stringify({
          email: "linh@example.com",
          password: "password",
          rememberMe: false,
        }),
      }),
    );
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

  it("explains when Google is not configured", () => {
    render(<LoginPanel />);
    expect(
      screen.getByText("Đăng nhập bằng Google chưa được cấu hình."),
    ).toBeInTheDocument();
  });
});
