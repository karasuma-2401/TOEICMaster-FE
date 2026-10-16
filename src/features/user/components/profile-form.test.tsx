// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { ProfileForm } from "./profile-form";

afterEach(cleanup);

describe("ProfileForm", () => {
  const sampleUser = {
    displayName: "Nguyễn Văn A",
    email: "learner@example.com",
    phone: "0912345678",
    dateOfBirth: "2000-01-15",
    targetScore: 750,
  };

  it("giữ nút Lưu thay đổi và Hủy ở trạng thái disabled khi chưa có thay đổi", () => {
    render(<ProfileForm initialValues={sampleUser} />);

    expect(screen.getByRole("button", { name: "Lưu thay đổi" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Hủy" })).toBeDisabled();
  });

  it("kích hoạt nút Lưu thay đổi khi người dùng chỉnh sửa thông tin", async () => {
    const user = userEvent.setup();
    render(<ProfileForm initialValues={sampleUser} />);

    const nameInput = screen.getByLabelText("Tên hiển thị");
    await user.clear(nameInput);
    await user.type(nameInput, "Nguyễn Văn B");

    expect(screen.getByRole("button", { name: "Lưu thay đổi" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Hủy" })).toBeEnabled();
  });

  it("khôi phục giá trị ban đầu và xóa lỗi khi bấm Hủy", async () => {
    const user = userEvent.setup();
    render(<ProfileForm initialValues={sampleUser} />);

    const nameInput = screen.getByLabelText("Tên hiển thị");
    await user.clear(nameInput);
    expect(screen.getByRole("button", { name: "Lưu thay đổi" })).toBeEnabled();

    // Submit để trigger lỗi
    await user.click(screen.getByRole("button", { name: "Lưu thay đổi" }));
    expect(
      await screen.findByText("Vui lòng nhập tên hiển thị."),
    ).toBeInTheDocument();

    // Bấm Hủy
    await user.click(screen.getByRole("button", { name: "Hủy" }));

    expect(nameInput).toHaveValue("Nguyễn Văn A");
    expect(
      screen.queryByText("Vui lòng nhập tên hiển thị."),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lưu thay đổi" })).toBeDisabled();
  });

  it("hiển thị lỗi khi submit rỗng và xóa lỗi khi người dùng bắt đầu sửa", async () => {
    const user = userEvent.setup();
    render(<ProfileForm initialValues={sampleUser} />);

    const nameInput = screen.getByLabelText("Tên hiển thị");
    await user.clear(nameInput);
    await user.click(screen.getByRole("button", { name: "Lưu thay đổi" }));

    expect(
      await screen.findByText("Vui lòng nhập tên hiển thị."),
    ).toBeInTheDocument();

    await user.type(nameInput, "Linh");
    expect(
      screen.queryByText("Vui lòng nhập tên hiển thị."),
    ).not.toBeInTheDocument();
  });

  it("báo lỗi khi số điện thoại hoặc điểm TOEIC không hợp lệ", async () => {
    const user = userEvent.setup();
    render(<ProfileForm initialValues={sampleUser} />);

    const phoneInput = screen.getByLabelText("Số điện thoại");
    await user.clear(phoneInput);
    await user.type(phoneInput, "0123");

    const scoreInput = screen.getByLabelText("Điểm TOEIC mục tiêu");
    await user.clear(scoreInput);
    await user.type(scoreInput, "752");

    await user.click(screen.getByRole("button", { name: "Lưu thay đổi" }));

    expect(
      await screen.findByText("Số điện thoại không hợp lệ."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Điểm TOEIC mục tiêu phải là bội số của 5."),
    ).toBeInTheDocument();
  });

  it("hiển thị thông báo hoàn thiện tính năng khi dữ liệu hợp lệ", async () => {
    const user = userEvent.setup();
    render(<ProfileForm initialValues={sampleUser} />);

    const nameInput = screen.getByLabelText("Tên hiển thị");
    await user.clear(nameInput);
    await user.type(nameInput, "Nguyễn Văn C");

    await user.click(screen.getByRole("button", { name: "Lưu thay đổi" }));

    expect(
      await screen.findByText(
        "Tính năng cập nhật hồ sơ đang được hoàn thiện. Thông tin của bạn chưa được gửi đi.",
      ),
    ).toBeInTheDocument();
  });

  it("hiển thị email ở chế độ chỉ đọc kèm huy hiệu đã xác minh", () => {
    render(<ProfileForm initialValues={sampleUser} />);

    const emailInput = screen.getByLabelText("Email");
    expect(emailInput).toHaveAttribute("readonly");
    expect(screen.getByText("Đã xác minh")).toBeInTheDocument();
  });
});
