export interface RegisterInput {
  displayName: string;
  email: string;
  password: string;
}

export type RegisterField =
  keyof RegisterInput | "confirmPassword" | "termsAccepted";
export type RegisterFieldErrors = Partial<Record<RegisterField, string>>;

export class RegisterError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly fieldErrors: RegisterFieldErrors = {},
  ) {
    super(message);
    this.name = "RegisterError";
  }
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegistration(
  input: RegisterInput & { confirmPassword: string; termsAccepted: boolean },
): RegisterFieldErrors {
  const errors: RegisterFieldErrors = {};
  const displayName = input.displayName.trim();
  const email = input.email.trim();

  if (!displayName) errors.displayName = "Vui lòng nhập tên hiển thị.";
  else if (displayName.length > 100)
    errors.displayName = "Tên hiển thị không được vượt quá 100 ký tự.";

  if (!email) errors.email = "Vui lòng nhập email.";
  else if (email.length > 254 || !emailPattern.test(email))
    errors.email = "Email không hợp lệ.";

  if (!input.password) errors.password = "Vui lòng nhập mật khẩu.";
  else if (input.password.length < 8 || input.password.length > 128)
    errors.password = "Mật khẩu cần từ 8 đến 128 ký tự.";

  if (!input.confirmPassword)
    errors.confirmPassword = "Vui lòng xác nhận mật khẩu.";
  else if (input.confirmPassword !== input.password)
    errors.confirmPassword = "Mật khẩu xác nhận chưa khớp.";

  if (!input.termsAccepted)
    errors.termsAccepted = "Vui lòng đồng ý với điều khoản sử dụng.";

  return errors;
}

function isProblem(value: unknown): value is {
  title?: string;
  errors?: Record<string, unknown>;
} {
  return typeof value === "object" && value !== null;
}

function readFieldErrors(value: unknown): RegisterFieldErrors {
  if (!isProblem(value) || !value.errors) return {};
  const aliases: Record<string, RegisterField> = {
    DisplayName: "displayName",
    displayName: "displayName",
    Email: "email",
    email: "email",
    Password: "password",
    password: "password",
  };
  return Object.entries(value.errors).reduce<RegisterFieldErrors>(
    (errors, [key, messages]) => {
      const field = aliases[key];
      if (field && Array.isArray(messages) && typeof messages[0] === "string") {
        errors[field] = messages[0];
      }
      return errors;
    },
    {},
  );
}

export async function register(
  input: RegisterInput,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      displayName: input.displayName.trim(),
      email: input.email.trim(),
      password: input.password,
    }),
    signal,
    cache: "no-store",
  });
  if (response.status === 202) return;

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = undefined;
  }
  const fieldErrors = readFieldErrors(body);
  const title =
    isProblem(body) && typeof body.title === "string" ? body.title : undefined;
  throw new RegisterError(
    response.status,
    title ?? "Không thể tạo tài khoản. Vui lòng thử lại.",
    fieldErrors,
  );
}
