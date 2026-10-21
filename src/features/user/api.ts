import { refreshSession } from "@/features/auth/api";
import type {
  PasswordChangeInput,
  UpdateProfileRequest,
  UserProfile,
} from "@/features/user/profile";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly fieldErrors: Record<string, string> = {},
    public readonly retryAfter?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function normalizeErrors(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const errors = (value as Record<string, unknown>).errors;
  if (!errors || typeof errors !== "object" || Array.isArray(errors)) return {};
  return Object.fromEntries(
    Object.entries(errors).flatMap(([key, messages]) => {
      if (!Array.isArray(messages) || typeof messages[0] !== "string")
        return [];
      return [[key.charAt(0).toLowerCase() + key.slice(1), messages[0]]];
    }),
  );
}

function retryAfterSeconds(value: string | null): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, Math.ceil(seconds));
  const date = Date.parse(value);
  return Number.isFinite(date)
    ? Math.max(0, Math.ceil((date - Date.now()) / 1000))
    : undefined;
}

async function errorFrom(response: Response): Promise<ApiError> {
  const body: unknown = await response.json().catch(() => null);
  const title =
    body &&
    typeof body === "object" &&
    "title" in body &&
    typeof body.title === "string"
      ? body.title
      : "Không thể kết nối dịch vụ. Vui lòng thử lại.";
  return new ApiError(
    response.status,
    title,
    normalizeErrors(body),
    retryAfterSeconds(response.headers.get("retry-after")),
  );
}

async function refreshWithLock(): Promise<void> {
  const rotate = () => refreshSession();
  if (typeof navigator !== "undefined" && navigator.locks) {
    await navigator.locks.request("toeicmaster-refresh", rotate);
  } else {
    await refreshSession();
  }
}

async function send(path: string, init: RequestInit = {}): Promise<Response> {
  const request = () =>
    fetch(path, {
      ...init,
      cache: "no-store",
      headers: new Headers({
        Accept: "application/json",
        ...Object.fromEntries(new Headers(init.headers)),
      }),
    });
  let response = await request();
  if (response.status === 401) {
    try {
      await refreshWithLock();
      response = await request();
    } catch {
      throw new ApiError(401, "Phiên đăng nhập đã hết hạn.");
    }
  }
  if (!response.ok) throw await errorFrom(response);
  return response;
}

interface BackendProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
}

function isBackendProfile(value: unknown): value is BackendProfile {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const profile = value as Record<string, unknown>;
  return (
    typeof profile.id === "string" &&
    profile.id.length > 0 &&
    typeof profile.email === "string" &&
    profile.email.length > 0 &&
    typeof profile.displayName === "string" &&
    (typeof profile.avatarUrl === "string" || profile.avatarUrl === null)
  );
}

async function profileResponse(response: Response): Promise<UserProfile> {
  const body: unknown = await response.json().catch(() => null);
  if (!isBackendProfile(body))
    throw new ApiError(502, "Phản hồi hồ sơ không hợp lệ.");
  // Backend always returns the same avatar path, so a per-fetch version busts the browser image cache.
  return {
    id: body.id,
    email: body.email,
    displayName: body.displayName,
    avatarVersion: body.avatarUrl ? Date.now().toString(36) : null,
  };
}

export async function getProfile(): Promise<UserProfile> {
  return profileResponse(await send("/api/profile"));
}

export async function updateProfile(
  input: UpdateProfileRequest,
): Promise<UserProfile> {
  return profileResponse(
    await send("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}

export async function changePassword(
  input: PasswordChangeInput,
): Promise<void> {
  await send("/api/profile/password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      currentPassword: input.currentPassword,
      newPassword: input.newPassword,
    }),
  });
}

export async function uploadAvatar(file: File): Promise<UserProfile> {
  const body = new FormData();
  body.append("file", file);
  await send("/api/profile/avatar", { method: "PUT", body });
  return getProfile();
}

export function avatarUrl(profile: UserProfile): string | null {
  return profile.avatarVersion
    ? `/api/profile/avatar?v=${encodeURIComponent(profile.avatarVersion)}`
    : null;
}
