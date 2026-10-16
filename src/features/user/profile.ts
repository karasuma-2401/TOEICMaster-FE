export interface UserProfile {
  displayName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  targetScore?: number;
}

// TODO: thay bằng dữ liệu từ API khi có contract
export const mockUserProfile: UserProfile = {
  displayName: "Nguyễn Văn A",
  email: "learner@example.com",
  phone: "0912345678",
  dateOfBirth: "2000-01-15",
  targetScore: 750,
};

export interface ProfileInput {
  displayName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  targetScore?: number | string;
}

export type ProfileField = keyof ProfileInput;
export type ProfileFieldErrors = Partial<Record<ProfileField, string>>;

export interface PasswordChangeInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export type PasswordChangeField = keyof PasswordChangeInput;
export type PasswordChangeFieldErrors = Partial<
  Record<PasswordChangeField, string>
>;

export const phonePattern = /^(0|\+84)\d{9}$/;

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  const first = parts[0][0];
  const last = parts[parts.length - 1][0];
  return `${first}${last}`.toUpperCase();
}

export function validateProfile(input: ProfileInput): ProfileFieldErrors {
  const errors: ProfileFieldErrors = {};
  const displayName = input.displayName.trim();

  if (!displayName) {
    errors.displayName = "Vui lòng nhập tên hiển thị.";
  } else if (displayName.length > 100) {
    errors.displayName = "Tên hiển thị không được vượt quá 100 ký tự.";
  }

  if (input.phone) {
    const trimmedPhone = input.phone.trim();
    if (trimmedPhone && !phonePattern.test(trimmedPhone)) {
      errors.phone = "Số điện thoại không hợp lệ.";
    }
  }

  if (input.dateOfBirth) {
    const dateStr = input.dateOfBirth.trim();
    if (dateStr) {
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      if (dateStr > todayStr) {
        errors.dateOfBirth = "Ngày sinh không được ở tương lai.";
      }
    }
  }

  if (
    input.targetScore !== undefined &&
    input.targetScore !== null &&
    String(input.targetScore).trim() !== ""
  ) {
    const scoreNum = Number(input.targetScore);
    if (!Number.isInteger(scoreNum) || scoreNum < 10 || scoreNum > 990) {
      errors.targetScore = "Điểm TOEIC mục tiêu phải từ 10 đến 990.";
    } else if (scoreNum % 5 !== 0) {
      errors.targetScore = "Điểm TOEIC mục tiêu phải là bội số của 5.";
    }
  }

  return errors;
}

export function validatePasswordChange(
  input: PasswordChangeInput,
): PasswordChangeFieldErrors {
  const errors: PasswordChangeFieldErrors = {};

  if (!input.currentPassword) {
    errors.currentPassword = "Vui lòng nhập mật khẩu hiện tại.";
  }

  if (!input.newPassword) {
    errors.newPassword = "Vui lòng nhập mật khẩu mới.";
  } else if (input.newPassword.length < 8 || input.newPassword.length > 128) {
    errors.newPassword = "Mật khẩu cần từ 8 đến 128 ký tự.";
  } else if (
    input.currentPassword &&
    input.newPassword === input.currentPassword
  ) {
    errors.newPassword = "Mật khẩu mới không được trùng với mật khẩu hiện tại.";
  }

  if (!input.confirmPassword) {
    errors.confirmPassword = "Vui lòng xác nhận mật khẩu mới.";
  } else if (input.confirmPassword !== input.newPassword) {
    errors.confirmPassword = "Mật khẩu xác nhận chưa khớp.";
  }

  return errors;
}
