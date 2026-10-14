export type LoginField = "email" | "password";
export type LoginFieldErrors = Partial<Record<LoginField, string>>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLogin(input: {
  email: string;
  password: string;
}): LoginFieldErrors {
  const errors: LoginFieldErrors = {};
  const email = input.email.trim();

  if (!email) errors.email = "Vui lòng nhập email.";
  else if (email.length > 254 || !emailPattern.test(email))
    errors.email = "Email không hợp lệ.";

  if (!input.password) errors.password = "Vui lòng nhập mật khẩu.";
  else if (input.password.length > 128)
    errors.password = "Mật khẩu không hợp lệ.";

  return errors;
}

export function validateRecoveryEmail(emailInput: string): LoginFieldErrors {
  const email = emailInput.trim();

  if (!email) return { email: "Vui lòng nhập email." };
  if (email.length > 254 || !emailPattern.test(email))
    return { email: "Email không hợp lệ." };
  return {};
}
