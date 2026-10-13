import { describe, expect, it } from "vitest";
import {
  getInitials,
  validatePasswordChange,
  validateProfile,
} from "./profile";

describe("validateProfile", () => {
  it("chấp nhận dữ liệu hợp lệ đầy đủ", () => {
    const errors = validateProfile({
      displayName: "Nguyễn Văn A",
      email: "learner@example.com",
      phone: "0912345678",
      dateOfBirth: "2000-01-15",
      targetScore: 750,
    });
    expect(errors).toEqual({});
  });

  it("chấp nhận dữ liệu hợp lệ chỉ với các trường bắt buộc", () => {
    const errors = validateProfile({
      displayName: "Linh",
      email: "linh@example.com",
      phone: "",
      dateOfBirth: "",
      targetScore: "",
    });
    expect(errors).toEqual({});
  });

  it("chấp nhận số điện thoại định dạng +84", () => {
    const errors = validateProfile({
      displayName: "Linh",
      email: "linh@example.com",
      phone: "+84912345678",
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

  it("báo lỗi khi số điện thoại sai định dạng", () => {
    expect(
      validateProfile({
        displayName: "Linh",
        email: "linh@example.com",
        phone: "0123456",
      }),
    ).toEqual({
      phone: "Số điện thoại không hợp lệ.",
    });

    expect(
      validateProfile({
        displayName: "Linh",
        email: "linh@example.com",
        phone: "09123456789",
      }),
    ).toEqual({
      phone: "Số điện thoại không hợp lệ.",
    });

    expect(
      validateProfile({
        displayName: "Linh",
        email: "linh@example.com",
        phone: "abcdefghij",
      }),
    ).toEqual({
      phone: "Số điện thoại không hợp lệ.",
    });
  });

  it("báo lỗi khi ngày sinh ở tương lai", () => {
    expect(
      validateProfile({
        displayName: "Linh",
        email: "linh@example.com",
        dateOfBirth: "2099-12-31",
      }),
    ).toEqual({
      dateOfBirth: "Ngày sinh không được ở tương lai.",
    });
  });

  it("kiểm tra các giá trị biên 10 và 990 của điểm TOEIC mục tiêu", () => {
    expect(
      validateProfile({
        displayName: "Linh",
        email: "linh@example.com",
        targetScore: 10,
      }),
    ).toEqual({});

    expect(
      validateProfile({
        displayName: "Linh",
        email: "linh@example.com",
        targetScore: 990,
      }),
    ).toEqual({});

    expect(
      validateProfile({
        displayName: "Linh",
        email: "linh@example.com",
        targetScore: 5,
      }),
    ).toEqual({
      targetScore: "Điểm TOEIC mục tiêu phải từ 10 đến 990.",
    });

    expect(
      validateProfile({
        displayName: "Linh",
        email: "linh@example.com",
        targetScore: 995,
      }),
    ).toEqual({
      targetScore: "Điểm TOEIC mục tiêu phải từ 10 đến 990.",
    });
  });

  it("báo lỗi khi điểm TOEIC không phải bội số của 5 hoặc không phải số nguyên", () => {
    expect(
      validateProfile({
        displayName: "Linh",
        email: "linh@example.com",
        targetScore: 752,
      }),
    ).toEqual({
      targetScore: "Điểm TOEIC mục tiêu phải là bội số của 5.",
    });

    expect(
      validateProfile({
        displayName: "Linh",
        email: "linh@example.com",
        targetScore: 750.5,
      }),
    ).toEqual({
      targetScore: "Điểm TOEIC mục tiêu phải từ 10 đến 990.",
    });
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
        newPassword: "short",
        confirmPassword: "short",
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
