export type LoginField = "email" | "password";
export type LoginFieldErrors = Partial<Record<LoginField, string>>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLogin(input: {
  email: string;
  password: string;
}): LoginFieldErrors {
  const errors: LoginFieldErrors = {};
  const email = input.email.trim();

  if (!email) errors.email = "Please enter your email.";
  else if (email.length > 254 || !emailPattern.test(email))
    errors.email = "Invalid email address.";

  if (!input.password) errors.password = "Please enter your password.";
  else if (input.password.length > 128) errors.password = "Invalid password.";

  return errors;
}

export function validateRecoveryEmail(emailInput: string): LoginFieldErrors {
  const email = emailInput.trim();

  if (!email) return { email: "Please enter your email." };
  if (email.length > 254 || !emailPattern.test(email))
    return { email: "Invalid email address." };
  return {};
}
