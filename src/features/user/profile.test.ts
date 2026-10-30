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

describe("validateProfile phone và điểm mục tiêu", () => {
  it("chấp nhận số điện thoại 0 hoặc +84 và để trống", () => {
    for (const phone of ["0912345678", "+84912345678", "", null]) {
      expect(
        validateProfile({ displayName: "Linh", email: "x@y.z", phone }),
      ).toEqual({});
    }
  });

  it("báo lỗi số điện thoại sai định dạng", () => {
    for (const phone of ["0123456", "09123456789", "abcdefghij"]) {
      expect(
        validateProfile({ displayName: "Linh", email: "x@y.z", phone }).phone,
      ).toBe("Số điện thoại không hợp lệ.");
    }
  });

  it("kiểm tra khoảng 10-990 và bội số của 5 của điểm mục tiêu", () => {
    for (const targetScore of [10, 990, "750", ""]) {
      expect(
        validateProfile({ displayName: "Linh", email: "x@y.z", targetScore }),
      ).toEqual({});
    }
    for (const targetScore of [5, 995, "1e2", "12.5"]) {
      expect(
        validateProfile({ displayName: "Linh", email: "x@y.z", targetScore })
          .targetScore,
      ).toBe("Điểm TOEIC mục tiêu phải từ 10 đến 990.");
    }
    expect(
      validateProfile({ displayName: "Linh", email: "x@y.z", targetScore: 752 })
        .targetScore,
    ).toBe("Điểm TOEIC mục tiêu phải là bội số của 5.");
  });
});

describe("toUpdateRequest", () => {
  it("trim dữ liệu, chuyển chuỗi rỗng thành null và không gửi email", () => {
    expect(
      toUpdateRequest({
        displayName: "  Linh  ",
        email: "private@example.com",
        phone: "  ",
        targetScore: "",
      }),
    ).toEqual({ displayName: "Linh", phone: null, targetScore: null });
    expect(
      toUpdateRequest({
        displayName: "Linh",
        email: "private@example.com",
        phone: " 0912345678 ",
        targetScore: "750",
      }),
    ).toEqual({ displayName: "Linh", phone: "0912345678", targetScore: 750 });
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
