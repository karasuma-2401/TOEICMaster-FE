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
  it("accepts valid data", () => {
    const errors = validateProfile({
      displayName: "Noah Adams",
      email: "learner@example.com",
    });
    expect(errors).toEqual({});
  });

  it("returns an error when displayName is empty or whitespace only", () => {
    expect(
      validateProfile({
        displayName: "   ",
        email: "linh@example.com",
      }),
    ).toEqual({
      displayName: "Please enter a display name.",
    });
  });

  it("returns an error when displayName exceeds 100 characters", () => {
    expect(
      validateProfile({
        displayName: "a".repeat(101),
        email: "linh@example.com",
      }),
    ).toEqual({
      displayName: "Display name must not exceed 100 characters.",
    });
  });
});

describe("validateProfile phone and targetScore", () => {
  it("accepts phone numbers starting with 0 or +84, or blank", () => {
    for (const phone of ["0912345678", "+84912345678", "", null]) {
      expect(
        validateProfile({ displayName: "Linh", email: "x@y.z", phone }),
      ).toEqual({});
    }
  });

  it("returns an error for invalid phone formats", () => {
    for (const phone of ["0123456", "09123456789", "abcdefghij"]) {
      expect(
        validateProfile({ displayName: "Linh", email: "x@y.z", phone }).phone,
      ).toBe("Invalid phone number.");
    }
  });

  it("validates targetScore range 10-990 and multiple of 5", () => {
    for (const targetScore of [10, 990, "750", ""]) {
      expect(
        validateProfile({ displayName: "Linh", email: "x@y.z", targetScore }),
      ).toEqual({});
    }
    for (const targetScore of [5, 995, "1e2", "12.5"]) {
      expect(
        validateProfile({ displayName: "Linh", email: "x@y.z", targetScore })
          .targetScore,
      ).toBe("Target TOEIC score must be between 10 and 990.");
    }
    expect(
      validateProfile({ displayName: "Linh", email: "x@y.z", targetScore: 752 })
        .targetScore,
    ).toBe("Target TOEIC score must be a multiple of 5.");
  });
});

describe("toUpdateRequest", () => {
  it("trims values, converts empty strings to null, and omits email", () => {
    expect(
      toUpdateRequest({
        displayName: "  Linh  ",
        email: "private@example.com",
        phone: "  ",
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
        targetScore: "750",
      }),
    ).toEqual({
      displayName: "Linh",
      phone: "0912345678",
      dateOfBirth: null,
      targetScore: 750,
    });
  });
});

describe("validateAvatarFile", () => {
  it("only accepts JPG or PNG with matching MIME type and valid size", () => {
    for (const file of [
      { name: "photo.gif", type: "image/gif", size: 10 },
      { name: "photo.webp", type: "image/webp", size: 10 },
      { name: "doc.pdf", type: "application/pdf", size: 10 },
      { name: "photo.png", type: "image/jpeg", size: 10 },
    ]) {
      expect(validateAvatarFile(file)).toBe(
        "Only JPG or PNG images are supported.",
      );
    }
    expect(
      validateAvatarFile({ name: "empty.png", type: "image/png", size: 0 }),
    ).toBe("Invalid image file.");
    expect(
      validateAvatarFile({
        name: "large.png",
        type: "image/png",
        size: AVATAR_MAX_BYTES + 1,
      }),
    ).toBe("Image size must not exceed 2MB.");
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
  it("accepts a valid password change input", () => {
    expect(
      validatePasswordChange({
        currentPassword: "current-password-123",
        newPassword: "new-password-456",
        confirmPassword: "new-password-456",
      }),
    ).toEqual({});
  });

  it("returns errors when fields are empty", () => {
    expect(
      validatePasswordChange({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }),
    ).toEqual({
      currentPassword: "Please enter your current password.",
      newPassword: "Please enter a new password.",
      confirmPassword: "Please confirm your new password.",
    });
  });

  it("returns an error when newPassword is too short or too long", () => {
    expect(
      validatePasswordChange({
        currentPassword: "current-password-123",
        newPassword: "1234567",
        confirmPassword: "1234567",
      }),
    ).toEqual({
      newPassword: "Password must be between 8 and 128 characters.",
    });

    expect(
      validatePasswordChange({
        currentPassword: "current-password-123",
        newPassword: "a".repeat(129),
        confirmPassword: "a".repeat(129),
      }),
    ).toEqual({
      newPassword: "Password must be between 8 and 128 characters.",
    });
  });

  it("returns an error when newPassword matches currentPassword", () => {
    expect(
      validatePasswordChange({
        currentPassword: "same-password-123",
        newPassword: "same-password-123",
        confirmPassword: "same-password-123",
      }),
    ).toEqual({
      newPassword:
        "New password must not be the same as your current password.",
    });
  });

  it("returns an error when confirmPassword does not match", () => {
    expect(
      validatePasswordChange({
        currentPassword: "current-password-123",
        newPassword: "new-password-456",
        confirmPassword: "different-password-789",
      }),
    ).toEqual({
      confirmPassword: "Confirmation password does not match.",
    });
  });
});

describe("getInitials", () => {
  it("creates initials from displayName", () => {
    expect(getInitials("Noah Adams")).toBe("NA");
    expect(getInitials("Linh")).toBe("LI");
    expect(getInitials("   ")).toBe("U");
  });
});
