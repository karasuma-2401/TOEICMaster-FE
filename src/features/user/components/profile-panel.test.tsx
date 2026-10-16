// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/features/user/api";
import { ProfilePanel } from "./profile-panel";

const mocks = vi.hoisted(() => {
  const replace = vi.fn();
  return { getProfile: vi.fn(), replace, router: { replace } };
});
vi.mock("@/features/user/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/user/api")>();
  return { ...actual, getProfile: mocks.getProfile };
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
    dateOfBirth: "2000-01-15",
    targetScore: 750,
    avatarVersion: null,
    hasPassword: true,
  };

  it("hiển thị ban đầu ở tab Thông tin và cho phép chuyển sang tab Bảo mật", async () => {
    const user = userEvent.setup();
    render(<ProfilePanel initialProfile={sampleProfile} />);

    const infoTab = screen.getByRole("button", { name: "Thông tin" });
    const securityTab = screen.getByRole("button", { name: "Bảo mật" });

    expect(infoTab).toHaveAttribute("aria-current", "page");
    expect(securityTab).not.toHaveAttribute("aria-current");

    expect(screen.getByLabelText("Tên hiển thị")).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Mật khẩu hiện tại"),
    ).not.toBeInTheDocument();

    // Chuyển tab sang Bảo mật
    await user.click(securityTab);

    expect(securityTab).toHaveAttribute("aria-current", "page");
    expect(infoTab).not.toHaveAttribute("aria-current");

    expect(screen.getByLabelText("Mật khẩu hiện tại")).toBeInTheDocument();
    expect(screen.queryByLabelText("Tên hiển thị")).not.toBeInTheDocument();

    // Chuyển lại tab Thông tin
    await user.click(infoTab);

    expect(infoTab).toHaveAttribute("aria-current", "page");
    expect(screen.getByLabelText("Tên hiển thị")).toBeInTheDocument();
  });

  it("hiển thị thẻ thông tin cá nhân rút gọn trên mobile", () => {
    render(<ProfilePanel initialProfile={sampleProfile} />);

    expect(screen.getAllByText("Nguyễn Văn A").length).toBeGreaterThanOrEqual(
      1,
    );
    expect(
      screen.getAllByText("learner@example.com").length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("link", { name: "Trang chủ" })).toHaveAttribute(
      "href",
      "/",
    );
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
