export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  phone: string | null;
  dateOfBirth: string | null;
  targetScore: number | null;
  avatarVersion: string | null;
  hasPassword: boolean;
}

export interface ProfileInput {
  displayName: string;
  email: string;
  phone?: string | null;
  dateOfBirth?: string | null;
  targetScore?: number | string | null;
}

export interface UpdateProfileRequest {
  displayName: string;
  phone: string | null;
  dateOfBirth: string | null;
  targetScore: number | null;
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
export const AVATAR_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export const AVATAR_ALLOWED_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
] as const;
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function toUpdateRequest(input: ProfileInput): UpdateProfileRequest {
  const score = input.targetScore;
  const phone = input.phone?.trim() ?? "";
  const dateOfBirth = input.dateOfBirth?.trim() ?? "";
  return {
    displayName: input.displayName.trim(),
    phone: phone || null,
    dateOfBirth: dateOfBirth || null,
    targetScore:
      score === undefined || score === null || String(score).trim() === ""
        ? null
        : Number(score),
  };
}

function isRealDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function validateProfile(input: ProfileInput): ProfileFieldErrors {
  const errors: ProfileFieldErrors = {};
  const displayName = input.displayName.trim();

  if (!displayName) {
    errors.displayName = "Vui lòng nhập tên hiển thị.";
  } else if (displayName.length > 100) {
    errors.displayName = "Tên hiển thị không được vượt quá 100 ký tự.";
  }

  const phone = input.phone?.trim() ?? "";
  if (phone && !phonePattern.test(phone)) {
    errors.phone = "Số điện thoại không hợp lệ.";
  }

  const dateOfBirth = input.dateOfBirth?.trim() ?? "";
  if (dateOfBirth) {
    if (!isRealDate(dateOfBirth) || dateOfBirth < "1900-01-01") {
      errors.dateOfBirth = "Ngày sinh không hợp lệ.";
    } else {
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      if (dateOfBirth > today)
        errors.dateOfBirth = "Ngày sinh không được ở tương lai.";
    }
  }

  const targetScore = input.targetScore;
  if (
    targetScore !== undefined &&
    targetScore !== null &&
    String(targetScore).trim() !== ""
  ) {
    const scoreString = String(targetScore).trim();
    if (!/^\d+$/.test(scoreString)) {
      errors.targetScore = "Điểm TOEIC mục tiêu phải từ 10 đến 990.";
    } else {
      const score = Number(scoreString);
      if (score < 10 || score > 990) {
        errors.targetScore = "Điểm TOEIC mục tiêu phải từ 10 đến 990.";
      } else if (score % 5 !== 0) {
        errors.targetScore = "Điểm TOEIC mục tiêu phải là bội số của 5.";
      }
    }
  }

  return errors;
}

export function validateAvatarFile(
  file: Pick<File, "name" | "type" | "size">,
): string | null {
  const extension = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
  if (
    !AVATAR_ALLOWED_EXTENSIONS.includes(
      extension as (typeof AVATAR_ALLOWED_EXTENSIONS)[number],
    ) ||
    !AVATAR_ALLOWED_TYPES.includes(
      file.type as (typeof AVATAR_ALLOWED_TYPES)[number],
    ) ||
    (extension === ".png" && file.type !== "image/png") ||
    ((extension === ".jpg" || extension === ".jpeg") &&
      file.type !== "image/jpeg") ||
    (extension === ".webp" && file.type !== "image/webp")
  ) {
    return "Chỉ hỗ trợ ảnh định dạng JPG, PNG hoặc WebP.";
  }
  if (file.size <= 0) return "Tệp ảnh không hợp lệ.";
  if (file.size > AVATAR_MAX_BYTES) return "Ảnh không được vượt quá 2MB.";
  return null;
}

export function validateNewPassword(password: string): string | null {
  if (!password) return "Vui lòng nhập mật khẩu mới.";
  if (password.length < 8 || password.length > 128)
    return "Mật khẩu cần từ 8 đến 128 ký tự.";
  return null;
}

export function validatePasswordChange(
  input: PasswordChangeInput,
): PasswordChangeFieldErrors {
  const errors: PasswordChangeFieldErrors = {};
  if (!input.currentPassword)
    errors.currentPassword = "Vui lòng nhập mật khẩu hiện tại.";

  const newPasswordError = validateNewPassword(input.newPassword);
  if (newPasswordError) {
    errors.newPassword = newPasswordError;
  } else if (
    input.currentPassword &&
    input.newPassword === input.currentPassword
  ) {
    errors.newPassword = "Mật khẩu mới không được trùng với mật khẩu hiện tại.";
  }

  if (!input.confirmPassword)
    errors.confirmPassword = "Vui lòng xác nhận mật khẩu mới.";
  else if (input.confirmPassword !== input.newPassword)
    errors.confirmPassword = "Mật khẩu xác nhận chưa khớp.";
  return errors;
}
