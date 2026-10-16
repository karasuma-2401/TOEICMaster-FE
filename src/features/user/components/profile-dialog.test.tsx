// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProfileDialog } from "./profile-dialog";

afterEach(cleanup);

describe("ProfileDialog", () => {
  const sampleUser = {
    displayName: "Nguyễn Văn A",
    email: "learner@example.com",
    phone: "0912345678",
    dateOfBirth: "2000-01-15",
    targetScore: 750,
  };

  it("không hiển thị khi isOpen = false", () => {
    render(
      <ProfileDialog isOpen={false} onClose={vi.fn()} user={sampleUser} />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("hiển thị thông tin học viên trên đầu popup và các trường form khi isOpen = true", () => {
    render(<ProfileDialog isOpen={true} onClose={vi.fn()} user={sampleUser} />);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");

    expect(screen.getByText("Nguyễn Văn A")).toBeInTheDocument();
    expect(screen.getByText("learner@example.com")).toBeInTheDocument();
    expect(screen.getByText("NA")).toBeInTheDocument();
    expect(screen.getByText("Mục tiêu: 750 TOEIC")).toBeInTheDocument();

    expect(screen.getByLabelText("Tên hiển thị")).toHaveValue("Nguyễn Văn A");
  });

  it("gọi onClose khi nhấn nút đóng (X)", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ProfileDialog isOpen={true} onClose={onClose} user={sampleUser} />);

    await user.click(screen.getByRole("button", { name: "Đóng" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("gọi onClose khi nhấn phím Escape", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ProfileDialog isOpen={true} onClose={onClose} user={sampleUser} />);

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("gọi onClose khi bấm ra ngoài overlay và không đóng khi bấm bên trong popup", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ProfileDialog isOpen={true} onClose={onClose} user={sampleUser} />);

    // Bấm bên trong dialog
    await user.click(screen.getByRole("dialog"));
    expect(onClose).not.toHaveBeenCalled();

    // Bấm vào overlay
    const overlay = screen.getByRole("presentation");
    await user.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("cho phép chuyển đổi giữa tab Thông tin và Bảo mật", async () => {
    const user = userEvent.setup();
    render(<ProfileDialog isOpen={true} onClose={vi.fn()} user={sampleUser} />);

    const infoTab = screen.getByRole("button", { name: "Thông tin" });
    const securityTab = screen.getByRole("button", { name: "Bảo mật" });

    expect(infoTab).toHaveAttribute("aria-current", "page");
    expect(screen.getByLabelText("Tên hiển thị")).toBeInTheDocument();

    await user.click(securityTab);
    expect(securityTab).toHaveAttribute("aria-current", "page");
    expect(screen.getByLabelText("Mật khẩu hiện tại")).toBeInTheDocument();

    await user.click(infoTab);
    expect(infoTab).toHaveAttribute("aria-current", "page");
    expect(screen.getByLabelText("Tên hiển thị")).toBeInTheDocument();
  });

  it("gọi onLogout khi nhấn nút Đăng xuất", async () => {
    const user = userEvent.setup();
    const onLogout = vi.fn();
    render(
      <ProfileDialog
        isOpen={true}
        onClose={vi.fn()}
        onLogout={onLogout}
        user={sampleUser}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Đăng xuất" }));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
