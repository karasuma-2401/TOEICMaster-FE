// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { ChangePasswordForm } from "./change-password-form";

afterEach(cleanup);

describe("ChangePasswordForm", () => {
  it("hiển thị lỗi khi submit để trống và xóa lỗi khi người dùng gõ vào ô", async () => {
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

    const currentPwdInput = screen.getByLabelText("Mật khẩu hiện tại");
    await user.type(currentPwdInput, "oldpassword");

    expect(
      screen.queryByText("Vui lòng nhập mật khẩu hiện tại."),
    ).not.toBeInTheDocument();
  });

  it("cho phép toggle ẩn/hiện mật khẩu", async () => {
    const user = userEvent.setup();
    render(<ChangePasswordForm />);

    const currentPwdInput = screen.getByLabelText("Mật khẩu hiện tại");
    expect(currentPwdInput).toHaveAttribute("type", "password");

    const toggleButtons = screen.getAllByRole("button", {
      name: "Hiện mật khẩu",
    });
    // Click toggle button của ô mật khẩu hiện tại
    await user.click(toggleButtons[0]);
    expect(currentPwdInput).toHaveAttribute("type", "text");

    const hideButtons = screen.getAllByRole("button", {
      name: "Ẩn mật khẩu",
    });
    await user.click(hideButtons[0]);
    expect(currentPwdInput).toHaveAttribute("type", "password");
  });

  it("báo lỗi khi mật khẩu mới trùng với mật khẩu hiện tại", async () => {
    const user = userEvent.setup();
    render(<ChangePasswordForm />);

    await user.type(screen.getByLabelText("Mật khẩu hiện tại"), "password123");
    await user.type(screen.getByLabelText("Mật khẩu mới"), "password123");
    await user.type(
      screen.getByLabelText("Xác nhận mật khẩu mới"),
      "password123",
    );

    await user.click(screen.getByRole("button", { name: "Đổi mật khẩu" }));

    expect(
      await screen.findByText(
        "Mật khẩu mới không được trùng với mật khẩu hiện tại.",
      ),
    ).toBeInTheDocument();
  });

  it("báo lỗi khi xác nhận mật khẩu không khớp", async () => {
    const user = userEvent.setup();
    render(<ChangePasswordForm />);

    await user.type(
      screen.getByLabelText("Mật khẩu hiện tại"),
      "oldpassword123",
    );
    await user.type(screen.getByLabelText("Mật khẩu mới"), "newpassword123");
    await user.type(
      screen.getByLabelText("Xác nhận mật khẩu mới"),
      "differentpwd",
    );

    await user.click(screen.getByRole("button", { name: "Đổi mật khẩu" }));

    expect(
      await screen.findByText("Mật khẩu xác nhận chưa khớp."),
    ).toBeInTheDocument();
  });

  it("hiển thị thông báo khi đổi mật khẩu hợp lệ", async () => {
    const user = userEvent.setup();
    render(<ChangePasswordForm />);

    await user.type(
      screen.getByLabelText("Mật khẩu hiện tại"),
      "oldpassword123",
    );
    await user.type(screen.getByLabelText("Mật khẩu mới"), "newpassword123");
    await user.type(
      screen.getByLabelText("Xác nhận mật khẩu mới"),
      "newpassword123",
    );

    await user.click(screen.getByRole("button", { name: "Đổi mật khẩu" }));

    expect(
      await screen.findByText(
        "Tính năng đổi mật khẩu đang được hoàn thiện. Yêu cầu của bạn chưa được gửi đi.",
      ),
    ).toBeInTheDocument();
  });
});
