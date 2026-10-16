// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/features/user/api";
import type { UserProfile } from "@/features/user/profile";
import { ProfileForm } from "./profile-form";

const mocks = vi.hoisted(() => ({
  updateProfile: vi.fn(),
  uploadAvatar: vi.fn(),
  removeAvatar: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("@/features/user/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/user/api")>();
  return {
    ...actual,
    updateProfile: mocks.updateProfile,
    uploadAvatar: mocks.uploadAvatar,
    removeAvatar: mocks.removeAvatar,
  };
});
vi.mock("@/shared/ui/toast", () => ({
  toast: { success: mocks.success, error: mocks.error },
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));

const sampleUser: UserProfile = {
  id: "user-1",
  displayName: "Nguyễn Văn A",
  email: "learner@example.com",
  phone: "0912345678",
  dateOfBirth: "2000-01-15",
  targetScore: 750,
  avatarVersion: null,
  hasPassword: true,
};

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  mocks.updateProfile.mockResolvedValue({
    ...sampleUser,
    displayName: "Nguyễn Văn C",
  });
  mocks.uploadAvatar.mockResolvedValue({ ...sampleUser, avatarVersion: "v2" });
  mocks.removeAvatar.mockResolvedValue(undefined);
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: vi.fn(() => "blob:avatar-preview"),
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: vi.fn(),
  });
});

describe("ProfileForm", () => {
  it("giữ nút Lưu thay đổi và Hủy disabled khi chưa có thay đổi", () => {
    render(<ProfileForm initialValues={sampleUser} />);
    expect(screen.getByRole("button", { name: "Lưu thay đổi" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Hủy" })).toBeDisabled();
  });

  it("gửi dữ liệu đã trim, khóa nút trong khi lưu và báo thành công", async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    let finishSave!: (profile: UserProfile) => void;
    mocks.updateProfile.mockReturnValueOnce(
      new Promise((resolve) => {
        finishSave = resolve;
      }),
    );
    render(<ProfileForm initialValues={sampleUser} onSaved={onSaved} />);
    const nameInput = screen.getByLabelText("Tên hiển thị");
    await user.clear(nameInput);
    await user.type(nameInput, "  Nguyễn Văn C  ");
    await user.click(screen.getByRole("button", { name: "Lưu thay đổi" }));
    expect(mocks.updateProfile).toHaveBeenCalledWith({
      displayName: "Nguyễn Văn C",
      phone: "0912345678",
      dateOfBirth: "2000-01-15",
      targetScore: 750,
    });
    expect(screen.getByRole("button", { name: "Lưu thay đổi" })).toBeDisabled();
    const saved = { ...sampleUser, displayName: "Nguyễn Văn C" };
    finishSave(saved);
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(saved));
    expect(mocks.success).toHaveBeenCalledWith("Đã lưu thông tin.");
  });

  it("không gửi khi validation FE thất bại và gán lỗi 400 vào đúng ô", async () => {
    const user = userEvent.setup();
    render(<ProfileForm initialValues={sampleUser} />);
    const nameInput = screen.getByLabelText("Tên hiển thị");
    await user.clear(nameInput);
    await user.click(screen.getByRole("button", { name: "Lưu thay đổi" }));
    expect(
      await screen.findByText("Vui lòng nhập tên hiển thị."),
    ).toBeInTheDocument();
    expect(mocks.updateProfile).not.toHaveBeenCalled();

    await user.type(nameInput, "Linh B");
    mocks.updateProfile.mockRejectedValueOnce(
      new ApiError(400, "Sai", { displayName: "Tên không hợp lệ." }),
    );
    await user.click(screen.getByRole("button", { name: "Lưu thay đổi" }));
    expect(await screen.findByText("Tên không hợp lệ.")).toBeInTheDocument();
    expect(nameInput).toHaveAttribute("aria-invalid", "true");
  });

  it("hiển thị email chỉ đọc", () => {
    render(<ProfileForm initialValues={sampleUser} />);
    expect(screen.getByLabelText("Email")).toHaveAttribute("readonly");
    expect(screen.getByText("Đã xác minh")).toBeInTheDocument();
  });

  it("từ chối ảnh sai và preview rồi upload ảnh hợp lệ đúng một lần", async () => {
    const { container } = render(<ProfileForm initialValues={sampleUser} />);
    const input =
      container.querySelector<HTMLInputElement>('input[type="file"]')!;
    fireEvent.change(input, {
      target: { files: [new File(["x"], "bad.gif", { type: "image/gif" })] },
    });
    expect(
      await screen.findByText("Chỉ hỗ trợ ảnh định dạng JPG, PNG hoặc WebP."),
    ).toBeInTheDocument();
    expect(mocks.uploadAvatar).not.toHaveBeenCalled();

    let finishUpload!: (profile: UserProfile) => void;
    mocks.uploadAvatar.mockReturnValueOnce(
      new Promise((resolve) => {
        finishUpload = resolve;
      }),
    );
    fireEvent.change(input, {
      target: { files: [new File(["image"], "ok.png", { type: "image/png" })] },
    });
    expect(mocks.uploadAvatar).toHaveBeenCalledTimes(1);
    expect(mocks.uploadAvatar).toHaveBeenCalledWith(
      expect.objectContaining({ name: "ok.png" }),
    );
    expect(
      screen.getByRole("img", { name: "Ảnh đại diện của Nguyễn Văn A" }),
    ).toHaveAttribute("src", "blob:avatar-preview");
    finishUpload({ ...sampleUser, avatarVersion: "v2" });
  });
});
