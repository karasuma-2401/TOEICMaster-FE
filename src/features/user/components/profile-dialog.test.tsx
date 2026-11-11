// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProfileDialog } from "./profile-dialog";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));

afterEach(cleanup);

describe("ProfileDialog", () => {
  const sampleUser = {
    id: "user-1",
    displayName: "Nguyễn Văn A",
    email: "learner@example.com",
    phone: "0912345678",
    targetScore: 750,
    avatarVersion: null,
    hasPassword: true,
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
    expect(screen.getByLabelText("Email")).toHaveValue("learner@example.com");
    expect(screen.getByText("NA")).toBeInTheDocument();

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

  it("dùng chung bố cục mới với trang hồ sơ, không còn tab", () => {
    render(<ProfileDialog isOpen={true} onClose={vi.fn()} user={sampleUser} />);

    expect(
      screen.getByRole("heading", { name: "Hồ sơ & mục tiêu học tập" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Tên hiển thị")).toBeInTheDocument();
    expect(screen.getByLabelText("Mật khẩu hiện tại")).toBeInTheDocument();
    expect(screen.getByLabelText("Điểm kỳ vọng")).toHaveValue("750");
    expect(
      screen.queryByRole("button", { name: "Bảo mật" }),
    ).not.toBeInTheDocument();
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
