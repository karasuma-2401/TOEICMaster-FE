import { HttpError, requestJson, requestVoid } from "@/shared/api/http";
import {
  adminUsersQueryString,
  parseAdminUserResponse,
  parseAdminUsersResponse,
  type AdminUser,
  type AdminUsersQuery,
  type AdminUsersResponse,
  type CreateAdminUserInput,
  type UpdateAdminUserInput,
} from "./users";

/**
 * Admin Users request failure carrying the normalized RFC 9457 ProblemDetails
 * (`code`, `detail`, `traceId`, field errors) so the UI can show actionable
 * messages, e.g. 409 `LAST_ACTIVE_ADMIN`, instead of a generic connection error.
 */
export class AdminUsersApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code: string | null = null,
    public readonly detail: string | null = null,
    public readonly traceId: string | null = null,
    public readonly fieldErrors: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = "AdminUsersApiError";
  }
}

const FALLBACK = "Unable to connect to the service.";
const INVALID_USER = "Invalid user data returned.";

function isAbort(error: unknown, signal?: AbortSignal) {
  return (
    signal?.aborted === true ||
    (error instanceof DOMException && error.name === "AbortError")
  );
}

function toAdminError(error: unknown, signal?: AbortSignal): unknown {
  if (isAbort(error, signal)) return error;
  if (error instanceof AdminUsersApiError) return error;
  if (error instanceof HttpError)
    return new AdminUsersApiError(
      error.status,
      error.message,
      error.code,
      error.detail ?? null,
      error.traceId,
      error.fieldErrors,
    );
  return new AdminUsersApiError(502, FALLBACK);
}

async function call<T>(run: () => Promise<T>, signal?: AbortSignal) {
  try {
    return await run();
  } catch (error) {
    throw toAdminError(error, signal);
  }
}

function userPath(id: string, action?: "lock" | "reset-password") {
  const path = `/api/admin/users/${encodeURIComponent(id)}`;
  return action ? `${path}/${action}` : path;
}

const collectionPath = "/api/admin/users";

export async function getAdminUsers(
  query: AdminUsersQuery,
  signal?: AbortSignal,
): Promise<AdminUsersResponse> {
  return call(
    () =>
      requestJson(`${collectionPath}?${adminUsersQueryString(query)}`, {
        parse: parseAdminUsersResponse,
        invalidPayloadMessage: INVALID_USER,
        fallbackMessage: "Unable to load user list.",
        ...(signal ? { signal } : {}),
      }),
    signal,
  );
}

export async function getAdminUser(
  id: string,
  signal?: AbortSignal,
): Promise<AdminUser> {
  return call(
    () =>
      requestJson(userPath(id), {
        parse: parseAdminUserResponse,
        invalidPayloadMessage: INVALID_USER,
        ...(signal ? { signal } : {}),
      }),
    signal,
  );
}

export async function createAdminUser(
  input: CreateAdminUserInput,
): Promise<AdminUser> {
  return call(() =>
    requestJson(collectionPath, {
      method: "POST",
      json: input,
      parse: parseAdminUserResponse,
      invalidPayloadMessage: INVALID_USER,
      fallbackMessage: "Unable to create user.",
    }),
  );
}

export async function updateAdminUser(
  id: string,
  input: UpdateAdminUserInput,
): Promise<AdminUser> {
  return call(() =>
    requestJson(userPath(id), {
      method: "PATCH",
      json: input,
      parse: parseAdminUserResponse,
      invalidPayloadMessage: INVALID_USER,
      fallbackMessage: "Unable to update user role.",
    }),
  );
}

export async function deleteAdminUser(id: string) {
  await call(() =>
    requestVoid(userPath(id), {
      method: "DELETE",
      fallbackMessage: "Unable to delete user.",
    }),
  );
}

export async function lockAdminUser(id: string) {
  await call(() =>
    requestVoid(userPath(id, "lock"), {
      method: "POST",
      fallbackMessage: "Unable to lock user.",
    }),
  );
}

export async function unlockAdminUser(id: string) {
  await call(() =>
    requestVoid(userPath(id, "lock"), {
      method: "DELETE",
      fallbackMessage: "Unable to unlock user.",
    }),
  );
}

export async function sendAdminPasswordReset(id: string) {
  await call(() =>
    requestVoid(userPath(id, "reset-password"), {
      method: "POST",
      fallbackMessage: "Unable to send password reset.",
    }),
  );
}

const codeMessages: Record<string, string> = {
  LAST_ACTIVE_ADMIN:
    "This is the last active administrator. Promote or unlock another admin first.",
  CANNOT_DEMOTE_SELF: "You cannot remove your own administrator role.",
  CANNOT_LOCK_SELF: "You cannot lock your own account.",
  CANNOT_DELETE_SELF: "You cannot delete your own account.",
  PASSWORD_RESET_UNSUPPORTED_PROVIDER:
    "This account signs in with Google, so it has no password to reset.",
  USER_INACTIVE_OR_UNVERIFIED:
    "Password reset is only available for active, verified accounts.",
  PASSWORD_RESET_COOLDOWN:
    "A reset email was sent recently. Please wait before sending another.",
};

/** User-facing message for a failed Admin Users request, keyed by ProblemDetails `code`. */
export function adminUserErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof AdminUsersApiError)) return fallback;
  if (error.code && codeMessages[error.code]) return codeMessages[error.code];
  if (error.status === 401) return "Your session has expired. Sign in again.";
  if (error.status === 403)
    return "Your account is not permitted to manage users.";
  if (error.status === 404) return "This user no longer exists.";
  return error.detail ?? error.message;
}
