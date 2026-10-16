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

  it("chỉ chấp nhận ngày có thật từ năm 1900 trở đi và không ở tương lai", () => {
    for (const dateOfBirth of ["2000-13-45", "abc", "1899-12-31"]) {
      expect(
        validateProfile({ displayName: "Linh", email: "x@y.z", dateOfBirth })
          .dateOfBirth,
      ).toBe("Ngày sinh không hợp lệ.");
    }
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrow = `${tomorrowDate.getFullYear()}-${String(tomorrowDate.getMonth() + 1).padStart(2, "0")}-${String(tomorrowDate.getDate()).padStart(2, "0")}`;
    expect(
      validateProfile({
        displayName: "Linh",
        email: "x@y.z",
        dateOfBirth: tomorrow,
      }).dateOfBirth,
    ).toBe("Ngày sinh không được ở tương lai.");
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    expect(
      validateProfile({
        displayName: "Linh",
        email: "x@y.z",
        dateOfBirth: today,
      }),
    ).toEqual({});
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

  it("chỉ nhận điểm mục tiêu dạng số nguyên thập phân", () => {
    for (const targetScore of ["1e2", "0x10", "12.5", "5", "995"]) {
      expect(
        validateProfile({ displayName: "Linh", email: "x@y.z", targetScore })
          .targetScore,
      ).toBe("Điểm TOEIC mục tiêu phải từ 10 đến 990.");
    }
    expect(
      validateProfile({
        displayName: "Linh",
        email: "x@y.z",
        targetScore: "750",
      }),
    ).toEqual({});
  });
});

describe("toUpdateRequest", () => {
  it("trim dữ liệu, chuyển chuỗi rỗng thành null và không gửi email", () => {
    expect(
      toUpdateRequest({
        displayName: "  Linh  ",
        email: "private@example.com",
        phone: "  ",
        dateOfBirth: "",
        targetScore: "",
      }),
    ).toEqual({
      displayName: "Linh",
      phone: null,
      dateOfBirth: null,
      targetScore: null,
    });
    expect(
      toUpdateRequest({
        displayName: "Linh",
        email: "private@example.com",
        phone: " 0912345678 ",
        dateOfBirth: " 2000-01-01 ",
        targetScore: "750",
      }),
    ).toEqual({
      displayName: "Linh",
      phone: "0912345678",
      dateOfBirth: "2000-01-01",
      targetScore: 750,
    });
  });
});

describe("validateAvatarFile", () => {
  it("chỉ chấp nhận JPG, PNG và WebP đúng MIME và kích thước", () => {
    for (const file of [
      { name: "photo.gif", type: "image/gif", size: 10 },
      { name: "doc.pdf", type: "application/pdf", size: 10 },
      { name: "photo.png", type: "image/jpeg", size: 10 },
    ]) {
      expect(validateAvatarFile(file)).toBe(
        "Chỉ hỗ trợ ảnh định dạng JPG, PNG hoặc WebP.",
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
