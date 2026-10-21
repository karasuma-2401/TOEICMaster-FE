import { describe, expect, it } from "vitest";
import {
  getInitials,
  AVATAR_MAX_BYTES,
  toUpdateRequest,
  validateAvatarFile,
  validatePasswordChange,
  validateProfile,
} from "./profile";

describe("validateProfile", () => {
  it("chấp nhận dữ liệu hợp lệ", () => {
    const errors = validateProfile({
      displayName: "Nguyễn Văn A",
      email: "learner@example.com",
    });
    expect(errors).toEqual({});
  });

  it("báo lỗi khi tên hiển thị rỗng hoặc chỉ có khoảng trắng", () => {
    expect(
      validateProfile({
        displayName: "   ",
        email: "linh@example.com",
      }),
    ).toEqual({
      displayName: "Vui lòng nhập tên hiển thị.",
    });
  });

  it("báo lỗi khi tên hiển thị vượt quá 100 ký tự", () => {
    expect(
      validateProfile({
        displayName: "a".repeat(101),
        email: "linh@example.com",
      }),
    ).toEqual({
      displayName: "Tên hiển thị không được vượt quá 100 ký tự.",
    });
  });
});

describe("toUpdateRequest", () => {
  it("trim tên hiển thị và không gửi email", () => {
    expect(
      toUpdateRequest({
        displayName: "  Linh  ",
        email: "private@example.com",
      }),
    ).toEqual({ displayName: "Linh" });
  });
});

describe("validateAvatarFile", () => {
  it("chỉ chấp nhận JPG, PNG đúng MIME và kích thước", () => {
    for (const file of [
      { name: "photo.gif", type: "image/gif", size: 10 },
      { name: "photo.webp", type: "image/webp", size: 10 },
      { name: "doc.pdf", type: "application/pdf", size: 10 },
      { name: "photo.png", type: "image/jpeg", size: 10 },
    ]) {
      expect(validateAvatarFile(file)).toBe(
        "Chỉ hỗ trợ ảnh định dạng JPG hoặc PNG.",
      );
    }
    expect(
      validateAvatarFile({ name: "empty.png", type: "image/png", size: 0 }),
    ).toBe("Tệp ảnh không hợp lệ.");
    expect(
      validateAvatarFile({
        name: "large.png",
        type: "image/png",
        size: AVATAR_MAX_BYTES + 1,
      }),
    ).toBe("Ảnh không được vượt quá 2MB.");
    expect(
      validateAvatarFile({
        name: "limit.png",
        type: "image/png",
        size: AVATAR_MAX_BYTES,
      }),
    ).toBeNull();
  });
});

describe("validatePasswordChange", () => {
  it("chấp nhận mật khẩu hợp lệ", () => {
    expect(
      validatePasswordChange({
        currentPassword: "current-password-123",
        newPassword: "new-password-456",
        confirmPassword: "new-password-456",
      }),
    ).toEqual({});
  });

  it("báo lỗi khi để trống các trường", () => {
    expect(
      validatePasswordChange({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }),
    ).toEqual({
      currentPassword: "Vui lòng nhập mật khẩu hiện tại.",
      newPassword: "Vui lòng nhập mật khẩu mới.",
      confirmPassword: "Vui lòng xác nhận mật khẩu mới.",
    });
  });

  it("báo lỗi khi mật khẩu mới quá ngắn hoặc quá dài", () => {
    expect(
      validatePasswordChange({
        currentPassword: "current-password-123",
        newPassword: "1234567",
        confirmPassword: "1234567",
      }),
    ).toEqual({
      newPassword: "Mật khẩu cần từ 8 đến 128 ký tự.",
    });

    expect(
      validatePasswordChange({
        currentPassword: "current-password-123",
        newPassword: "a".repeat(129),
        confirmPassword: "a".repeat(129),
      }),
    ).toEqual({
      newPassword: "Mật khẩu cần từ 8 đến 128 ký tự.",
    });
  });

  it("báo lỗi khi mật khẩu mới trùng với mật khẩu hiện tại", () => {
    expect(
      validatePasswordChange({
        currentPassword: "same-password-123",
        newPassword: "same-password-123",
        confirmPassword: "same-password-123",
      }),
    ).toEqual({
      newPassword: "Mật khẩu mới không được trùng với mật khẩu hiện tại.",
    });
  });

  it("báo lỗi khi xác nhận mật khẩu không khớp", () => {
    expect(
      validatePasswordChange({
        currentPassword: "current-password-123",
        newPassword: "new-password-456",
        confirmPassword: "different-password-789",
      }),
    ).toEqual({
      confirmPassword: "Mật khẩu xác nhận chưa khớp.",
    });
  });
});

describe("getInitials", () => {
  it("tạo chữ cái đầu từ tên hiển thị", () => {
    expect(getInitials("Nguyễn Văn A")).toBe("NA");
    expect(getInitials("Linh")).toBe("LI");
    expect(getInitials("   ")).toBe("U");
  });
});
