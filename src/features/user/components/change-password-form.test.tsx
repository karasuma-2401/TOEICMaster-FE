// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/features/user/api";
import { ChangePasswordForm } from "./change-password-form";

const mocks = vi.hoisted(() => ({
  changePassword: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  replace: vi.fn(),
}));
vi.mock("@/features/user/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/user/api")>();
  return { ...actual, changePassword: mocks.changePassword };
});
vi.mock("@/shared/ui/toast", () => ({
  toast: { success: mocks.success, error: mocks.error },
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  mocks.changePassword.mockResolvedValue(undefined);
});

describe("ChangePasswordForm", () => {
  it("hiển thị lỗi client-side khi để trống và xóa lỗi khi sửa", async () => {
    const user = userEvent.setup();
    render(<ChangePasswordForm />);
    await user.click(screen.getByRole("button", { name: "Đổi mật khẩu" }));
    expect(
      await screen.findByText("Vui lòng nhập mật khẩu hiện tại."),
    ).toBeInTheDocument();
    expect(screen.getByText("Vui lòng nhập mật khẩu mới.")).toBeInTheDocument();
    expect(
      screen.getByText("Vui lòng xác nhận mật khẩu mới."),
    ).toBeInTheDocument();
    await user.type(screen.getByLabelText("Mật khẩu hiện tại"), "oldpassword");
    expect(
      screen.queryByText("Vui lòng nhập mật khẩu hiện tại."),
    ).not.toBeInTheDocument();
    expect(mocks.changePassword).not.toHaveBeenCalled();
  });

  it("cho phép toggle ẩn/hiện mật khẩu", async () => {
    const user = userEvent.setup();
    render(<ChangePasswordForm />);
    const current = screen.getByLabelText("Mật khẩu hiện tại");
    expect(current).toHaveAttribute("type", "password");
    await user.click(
      screen.getAllByRole("button", { name: "Hiện mật khẩu" })[0],
    );
    expect(current).toHaveAttribute("type", "text");
    await user.click(screen.getAllByRole("button", { name: "Ẩn mật khẩu" })[0]);
    expect(current).toHaveAttribute("type", "password");
  });

  it("hiển thị lỗi BE sai mật khẩu ở ô mật khẩu hiện tại", async () => {
    const user = userEvent.setup();
    mocks.changePassword.mockRejectedValueOnce(
      new ApiError(400, "Không hợp lệ", {
        currentPassword: "Mật khẩu hiện tại không đúng.",
      }),
    );
    render(<ChangePasswordForm />);
    await user.type(
      screen.getByLabelText("Mật khẩu hiện tại"),
      "wrong-password",
    );
    await user.type(screen.getByLabelText("Mật khẩu mới"), "new-password-123");
    await user.type(
      screen.getByLabelText("Xác nhận mật khẩu mới"),
      "new-password-123",
    );
    await user.click(screen.getByRole("button", { name: "Đổi mật khẩu" }));
    expect(
      await screen.findByText("Mật khẩu hiện tại không đúng."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Mật khẩu hiện tại")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("hiển thị title lỗi 400 không kèm field errors ở ô mật khẩu hiện tại", async () => {
    const user = userEvent.setup();
    mocks.changePassword.mockRejectedValueOnce(
      new ApiError(
        400,
        "Mật khẩu hiện tại không đúng hoặc tài khoản không có mật khẩu.",
      ),
    );
    render(<ChangePasswordForm />);
    await user.type(
      screen.getByLabelText("Mật khẩu hiện tại"),
      "wrong-password",
    );
    await user.type(screen.getByLabelText("Mật khẩu mới"), "new-password-123");
    await user.type(
      screen.getByLabelText("Xác nhận mật khẩu mới"),
      "new-password-123",
    );
    await user.click(screen.getByRole("button", { name: "Đổi mật khẩu" }));
    expect(
      await screen.findByText(
        "Mật khẩu hiện tại không đúng hoặc tài khoản không có mật khẩu.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Mật khẩu hiện tại")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("gọi API thành công, xóa ba ô và báo thành công", async () => {
    const user = userEvent.setup();
    render(<ChangePasswordForm />);
    await user.type(
      screen.getByLabelText("Mật khẩu hiện tại"),
      "old-password-123",
    );
    await user.type(screen.getByLabelText("Mật khẩu mới"), "new-password-123");
    await user.type(
      screen.getByLabelText("Xác nhận mật khẩu mới"),
      "new-password-123",
    );
    await user.click(screen.getByRole("button", { name: "Đổi mật khẩu" }));
    expect(mocks.changePassword).toHaveBeenCalledWith({
      currentPassword: "old-password-123",
      newPassword: "new-password-123",
      confirmPassword: "new-password-123",
    });
    expect(await screen.findByLabelText("Mật khẩu hiện tại")).toHaveValue("");
    expect(screen.getByLabelText("Mật khẩu mới")).toHaveValue("");
    expect(screen.getByLabelText("Xác nhận mật khẩu mới")).toHaveValue("");
    expect(mocks.success).toHaveBeenCalledWith("Đổi mật khẩu thành công.");
  });

  it("không hiện form nếu tài khoản chưa có mật khẩu", () => {
    render(<ChangePasswordForm hasPassword={false} />);
    expect(
      screen.getByText("Tài khoản đăng nhập bằng Google, không có mật khẩu."),
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Mật khẩu hiện tại"),
    ).not.toBeInTheDocument();
  });
});
