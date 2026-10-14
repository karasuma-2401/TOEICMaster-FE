// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RegisterPanel } from "./register-panel";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("RegisterPanel", () => {
  it("renders the registration form initially", () => {
    render(<RegisterPanel />);

    expect(
      screen.getByRole("heading", { name: "Bắt đầu hành trình mới" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Tên hiển thị")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("moves to the verification OTP page upon successful registration and allows changing email", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 202 })),
    );
    const user = userEvent.setup();
    render(<RegisterPanel />);

    await user.type(screen.getByLabelText("Tên hiển thị"), "Linh");
    await user.type(screen.getByLabelText("Email"), "linh@example.com");
    await user.type(screen.getByLabelText("Mật khẩu"), "password123");
    await user.type(screen.getByLabelText("Xác nhận mật khẩu"), "password123");
    await user.click(
      screen.getByLabelText("Tôi đồng ý với Điều khoản sử dụng"),
    );
    await user.click(screen.getByRole("button", { name: "Tạo tài khoản" }));

    expect(
      await screen.findByRole("heading", { name: "Xác minh email" }),
    ).toBeInTheDocument();
    expect(screen.getByText("XÁC MINH TÀI KHOẢN")).toBeInTheDocument();
    expect(screen.getByText("linh@example.com")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Nhập lại email" }));

    expect(
      await screen.findByRole("heading", { name: "Bắt đầu hành trình mới" }),
    ).toBeInTheDocument();
  });
});
