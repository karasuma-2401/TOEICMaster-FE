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

  if (!displayName) errors.displayName = "Please enter a display name.";
  else if (displayName.length > 100)
    errors.displayName = "Display name must not exceed 100 characters.";

  if (!email) errors.email = "Please enter your email.";
  else if (email.length > 254 || !emailPattern.test(email))
    errors.email = "Invalid email address.";

  if (!input.password) errors.password = "Please enter your password.";
  else if (input.password.length < 8 || input.password.length > 128)
    errors.password = "Password must be between 8 and 128 characters.";

  if (!input.confirmPassword)
    errors.confirmPassword = "Please confirm your password.";
  else if (input.confirmPassword !== input.password)
    errors.confirmPassword = "Confirmation password does not match.";

  if (!input.termsAccepted)
    errors.termsAccepted = "Please agree to the terms of use.";

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
    title ?? "Unable to create account. Please try again.",
    fieldErrors,
  );
}
