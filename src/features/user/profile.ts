export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarVersion: string | null;
}

export interface ProfileInput {
  displayName: string;
  email: string;
}

export interface UpdateProfileRequest {
  displayName: string;
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

export const AVATAR_ALLOWED_TYPES = ["image/jpeg", "image/png"] as const;
export const AVATAR_ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png"] as const;
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function toUpdateRequest(input: ProfileInput): UpdateProfileRequest {
  return { displayName: input.displayName.trim() };
}

export function validateProfile(input: ProfileInput): ProfileFieldErrors {
  const errors: ProfileFieldErrors = {};
  const displayName = input.displayName.trim();

  if (!displayName) {
    errors.displayName = "Vui lòng nhập tên hiển thị.";
  } else if (displayName.length > 100) {
    errors.displayName = "Tên hiển thị không được vượt quá 100 ký tự.";
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
      file.type !== "image/jpeg")
  ) {
    return "Chỉ hỗ trợ ảnh định dạng JPG hoặc PNG.";
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
