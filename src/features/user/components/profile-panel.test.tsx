// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/features/user/api";
import { ProfilePanel } from "./profile-panel";

const mocks = vi.hoisted(() => {
  const replace = vi.fn();
  return {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    replace,
    router: { replace },
  };
});
vi.mock("@/features/user/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/user/api")>();
  return {
    ...actual,
    getProfile: mocks.getProfile,
    updateProfile: mocks.updateProfile,
  };
});
vi.mock("next/navigation", () => ({ useRouter: () => mocks.router }));

afterEach(cleanup);
beforeEach(() => vi.clearAllMocks());

describe("ProfilePanel", () => {
  const sampleProfile = {
    id: "user-1",
    displayName: "Nguyễn Văn A",
    email: "learner@example.com",
    phone: "0912345678",
    targetScore: 750,
    avatarVersion: null,
    hasPassword: true,
  };

  it("hiển thị thông tin, đổi mật khẩu và mục tiêu trên cùng một trang", () => {
    render(<ProfilePanel initialProfile={sampleProfile} />);

    expect(
      screen.getByRole("heading", { name: "Hồ sơ & mục tiêu học tập" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Tên hiển thị")).toHaveValue("Nguyễn Văn A");
    expect(screen.getByLabelText("Mật khẩu hiện tại")).toBeInTheDocument();
    expect(screen.getByLabelText("Điểm kỳ vọng")).toHaveValue("750");
    expect(screen.getByRole("link", { name: "Trang chủ" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("không hiện form đổi mật khẩu cho tài khoản chỉ đăng nhập Google", () => {
    render(
      <ProfilePanel
        initialProfile={{ ...sampleProfile, hasPassword: false }}
      />,
    );

    expect(
      screen.getByText("Tài khoản đăng nhập bằng Google, không có mật khẩu."),
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Mật khẩu hiện tại"),
    ).not.toBeInTheDocument();
  });

  it("lưu mục tiêu mà không gửi tên đang sửa dở và giữ nguyên ô tên", async () => {
    const user = userEvent.setup();
    mocks.updateProfile.mockResolvedValueOnce({
      ...sampleProfile,
      targetScore: 850,
    });
    render(<ProfilePanel initialProfile={sampleProfile} />);

    await user.type(screen.getByLabelText("Tên hiển thị"), " B");
    await user.selectOptions(screen.getByLabelText("Điểm kỳ vọng"), "850");
    await user.click(screen.getByRole("button", { name: "Lưu mục tiêu" }));

    await waitFor(() =>
      expect(mocks.updateProfile).toHaveBeenCalledWith({
        displayName: "Nguyễn Văn A",
        phone: "0912345678",
        targetScore: 850,
      }),
    );
    expect(await screen.findByText("850 / 990")).toBeInTheDocument();
    expect(screen.getByLabelText("Tên hiển thị")).toHaveValue("Nguyễn Văn A B");
  });

  it("lưu thông tin với mục tiêu mới nhất sau khi vừa đổi mục tiêu", async () => {
    const user = userEvent.setup();
    mocks.updateProfile.mockResolvedValueOnce({
      ...sampleProfile,
      targetScore: 850,
    });
    render(<ProfilePanel initialProfile={sampleProfile} />);

    await user.selectOptions(screen.getByLabelText("Điểm kỳ vọng"), "850");
    await user.click(screen.getByRole("button", { name: "Lưu mục tiêu" }));
    await screen.findByText("850 / 990");

    mocks.updateProfile.mockResolvedValueOnce({
      ...sampleProfile,
      displayName: "Linh",
      targetScore: 850,
    });
    const name = screen.getByLabelText("Tên hiển thị");
    await user.clear(name);
    await user.type(name, "Linh");
    await user.click(screen.getByRole("button", { name: "Lưu thay đổi" }));

    await waitFor(() =>
      expect(mocks.updateProfile).toHaveBeenLastCalledWith({
        displayName: "Linh",
        phone: "0912345678",
        targetScore: 850,
      }),
    );
  });

  it("giữ lại điểm mục tiêu không nằm trong danh sách có sẵn", () => {
    render(
      <ProfilePanel initialProfile={{ ...sampleProfile, targetScore: 725 }} />,
    );
    expect(screen.getByLabelText("Điểm kỳ vọng")).toHaveValue("725");
  });

  it("hiển thị loading rồi hiển thị form khi hồ sơ tải xong", async () => {
    let resolve!: (profile: typeof sampleProfile) => void;
    mocks.getProfile.mockReturnValueOnce(
      new Promise((done) => {
        resolve = done;
      }),
    );
    render(<ProfilePanel />);
    expect(screen.getByLabelText("Đang tải hồ sơ")).toBeInTheDocument();
    resolve(sampleProfile);
    expect(await screen.findByLabelText("Tên hiển thị")).toBeInTheDocument();
  });

  it("hiển thị lỗi và thử tải lại được", async () => {
    const user = userEvent.setup();
    mocks.getProfile.mockRejectedValueOnce(new Error("offline"));
    mocks.getProfile.mockResolvedValueOnce(sampleProfile);
    render(<ProfilePanel />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Không thể tải hồ sơ.",
    );
    await user.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(await screen.findByLabelText("Tên hiển thị")).toBeInTheDocument();
  });

  it("chuyển tới đăng nhập khi phiên hết hạn", async () => {
    mocks.getProfile.mockRejectedValueOnce(new ApiError(401, "Phiên hết hạn"));
    render(<ProfilePanel />);
    await screen.findByRole("alert");
    expect(mocks.replace).toHaveBeenCalledWith("/login?next=%2Fprofile");
  });
});
