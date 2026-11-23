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
  const phone = input.phone?.trim() ?? "";
  const score = input.targetScore;
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

const dateOfBirthPattern = /^\d{4}-\d{2}-\d{2}$/;

function isValidCalendarDate(value: string): boolean {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function validateDateOfBirth(value: string): string | null {
  if (!dateOfBirthPattern.test(value) || !isValidCalendarDate(value)) {
    return "Invalid date of birth.";
  }
  if (value < "1900-01-01") {
    return "Date of birth cannot be before 01/01/1900.";
  }
  const today = new Date().toISOString().slice(0, 10);
  if (value > today) {
    return "Date of birth cannot be in the future.";
  }
  return null;
}

export function validateProfile(input: ProfileInput): ProfileFieldErrors {
  const errors: ProfileFieldErrors = {};
  const displayName = input.displayName.trim();

  if (!displayName) {
    errors.displayName = "Please enter a display name.";
  } else if (displayName.length > 100) {
    errors.displayName = "Display name must not exceed 100 characters.";
  }

  const phone = input.phone?.trim() ?? "";
  if (phone && !phonePattern.test(phone)) {
    errors.phone = "Invalid phone number.";
  }

  const dateOfBirth = input.dateOfBirth?.trim() ?? "";
  if (dateOfBirth) {
    const dateOfBirthError = validateDateOfBirth(dateOfBirth);
    if (dateOfBirthError) errors.dateOfBirth = dateOfBirthError;
  }

  const targetScore = input.targetScore;
  if (
    targetScore !== undefined &&
    targetScore !== null &&
    String(targetScore).trim() !== ""
  ) {
    const scoreString = String(targetScore).trim();
    if (!/^\d+$/.test(scoreString)) {
      errors.targetScore = "Target TOEIC score must be between 10 and 990.";
    } else {
      const score = Number(scoreString);
      if (score < 10 || score > 990) {
        errors.targetScore = "Target TOEIC score must be between 10 and 990.";
      } else if (score % 5 !== 0) {
        errors.targetScore = "Target TOEIC score must be a multiple of 5.";
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
      file.type !== "image/jpeg")
  ) {
    return "Only JPG or PNG images are supported.";
  }
  if (file.size <= 0) return "Invalid image file.";
  if (file.size > AVATAR_MAX_BYTES) return "Image size must not exceed 2MB.";
  return null;
}

export function validateNewPassword(password: string): string | null {
  if (!password) return "Please enter a new password.";
  if (password.length < 8 || password.length > 128)
    return "Password must be between 8 and 128 characters.";
  return null;
}

export function validatePasswordChange(
  input: PasswordChangeInput,
): PasswordChangeFieldErrors {
  const errors: PasswordChangeFieldErrors = {};
  if (!input.currentPassword)
    errors.currentPassword = "Please enter your current password.";

  const newPasswordError = validateNewPassword(input.newPassword);
  if (newPasswordError) {
    errors.newPassword = newPasswordError;
  } else if (
    input.currentPassword &&
    input.newPassword === input.currentPassword
  ) {
    errors.newPassword =
      "New password must not be the same as your current password.";
  }

  if (!input.confirmPassword)
    errors.confirmPassword = "Please confirm your new password.";
  else if (input.confirmPassword !== input.newPassword)
    errors.confirmPassword = "Confirmation password does not match.";
  return errors;
}
