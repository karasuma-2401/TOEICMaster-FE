export interface AuthenticatedUser {
  id: string;
  displayName: string;
  email: string;
}

export type SessionState =
  | { status: "guest" }
  | { status: "refresh_required" }
  | { status: "authenticated"; user: AuthenticatedUser };

export class AuthError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly fieldErrors: Partial<
      Record<"email" | "password" | "code", string>
    > = {},
  ) {
    super(message);
    this.name = "AuthError";
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function userFrom(value: unknown): AuthenticatedUser | null {
  if (!isObject(value)) return null;
  if (
    typeof value.id !== "string" ||
    typeof value.displayName !== "string" ||
    typeof value.email !== "string"
  )
    return null;
  return { id: value.id, displayName: value.displayName, email: value.email };
}

async function errorFrom(response: Response): Promise<AuthError> {
  const body: unknown = await response.json().catch(() => null);
  const errors = isObject(body) && isObject(body.errors) ? body.errors : {};
  const first = (key: string) => {
    const messages = errors[key];
    return Array.isArray(messages) && typeof messages[0] === "string"
      ? messages[0]
      : undefined;
  };
  const title =
    isObject(body) && typeof body.title === "string"
      ? body.title
      : "Không thể kết nối dịch vụ. Vui lòng thử lại.";
  return new AuthError(response.status, title, {
    email: first("Email"),
    password: first("Password"),
    code: first("Code"),
  });
}

async function post(path: string, body: object): Promise<Response> {
  return fetch(path, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
}

async function authenticate(
  path: string,
  body: object,
): Promise<AuthenticatedUser> {
  const response = await post(path, body);
  if (!response.ok) throw await errorFrom(response);
  const result: unknown = await response.json().catch(() => null);
  const user = isObject(result) ? userFrom(result.user) : null;
  if (!user) throw new AuthError(502, "Phản hồi đăng nhập không hợp lệ.");
  return user;
}

export function login(email: string, password: string, rememberMe: boolean) {
  return authenticate("/api/auth/login", {
    email: email.trim(),
    password,
    rememberMe,
  });
}

export function loginWithGoogle(credential: string, rememberMe: boolean) {
  return authenticate("/api/auth/google", { credential, rememberMe });
}

export function refreshSession() {
  return authenticate("/api/auth/refresh", {});
}

export async function verifyEmail(email: string, code: string) {
  const response = await post("/api/auth/verify-email", {
    email: email.trim(),
    code,
  });
  if (response.status !== 204) throw await errorFrom(response);
}

export async function resendVerification(email: string) {
  const response = await post("/api/auth/resend-verification", {
    email: email.trim(),
  });
  if (response.status !== 202) throw await errorFrom(response);
}

export async function logout() {
  const response = await post("/api/auth/logout", {});
  if (response.status !== 204) throw await errorFrom(response);
}

export async function getSession(): Promise<SessionState> {
  const response = await fetch("/api/auth/session", {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw await errorFrom(response);
  const body: unknown = await response.json().catch(() => null);
  if (isObject(body) && body.status === "guest") return { status: "guest" };
  if (isObject(body) && body.status === "refresh_required")
    return { status: "refresh_required" };
  const user = isObject(body) ? userFrom(body.user) : null;
  if (isObject(body) && body.status === "authenticated" && user)
    return { status: "authenticated", user };
  throw new AuthError(502, "Phản hồi phiên đăng nhập không hợp lệ.");
}
