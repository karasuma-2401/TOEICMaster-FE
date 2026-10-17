import { ApiError as SharedApiError, getJson } from "@/shared/api/client";
import { AuthError, refreshSession } from "@/features/auth/api";
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

export class AdminUsersApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "AdminUsersApiError";
  }
}

async function refreshAdminSession() {
  const refresh = () => refreshSession();
  if (typeof navigator !== "undefined" && navigator.locks) {
    await navigator.locks.request("toeicmaster-refresh", refresh);
    return;
  }
  await refresh();
}

async function request<T>(
  path: string,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  body?: object,
  signal?: AbortSignal,
): Promise<T | undefined> {
  const send = async () => {
    if (method === "GET") return getJson<unknown>(path, signal);
    const response = await fetch(path, {
      method,
      headers: {
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal,
      cache: "no-store",
    });
    if (!response.ok)
      throw new SharedApiError(response.status, "Không thể kết nối dịch vụ.");
    if (response.status === 204) return undefined;
    if (!response.headers.get("content-type")?.includes("application/json"))
      return undefined;
    return (await response.json()) as unknown;
  };

  try {
    try {
      return (await send()) as T | undefined;
    } catch (error) {
      if (!(error instanceof SharedApiError) || error.status !== 401)
        throw error;
      if (signal?.aborted) throw error;
      try {
        await refreshAdminSession();
      } catch {
        throw new AdminUsersApiError(401, "Phiên đăng nhập đã hết hạn.");
      }
      return (await send()) as T | undefined;
    }
  } catch (error) {
    if (error instanceof AdminUsersApiError) throw error;
    if (error instanceof AuthError)
      throw new AdminUsersApiError(error.status, error.message);
    if (error instanceof SharedApiError)
      throw new AdminUsersApiError(error.status, error.message);
    throw new AdminUsersApiError(502, "Không thể kết nối dịch vụ.");
  }
}

function userPath(id: string, action?: "lock" | "reset-password") {
  const path = `/api/admin/users/${encodeURIComponent(id)}`;
  return action ? `${path}/${action}` : path;
}

export async function getAdminUsers(
  query: AdminUsersQuery,
  signal?: AbortSignal,
): Promise<AdminUsersResponse> {
  const value = await request<unknown>(
    `/api/admin/users?${adminUsersQueryString(query)}`,
    "GET",
    undefined,
    signal,
  );
  try {
    return parseAdminUsersResponse(value);
  } catch {
    throw new AdminUsersApiError(
      502,
      "Dữ liệu người dùng trả về không hợp lệ.",
    );
  }
}

export async function getAdminUser(
  id: string,
  signal?: AbortSignal,
): Promise<AdminUser> {
  const value = await request<unknown>(userPath(id), "GET", undefined, signal);
  try {
    return parseAdminUserResponse(value);
  } catch {
    throw new AdminUsersApiError(
      502,
      "Dữ liệu người dùng trả về không hợp lệ.",
    );
  }
}

export async function createAdminUser(input: CreateAdminUserInput) {
  await request(userPathForCollection, "POST", input);
}

const userPathForCollection = "/api/admin/users";

export async function updateAdminUser(id: string, input: UpdateAdminUserInput) {
  await request(userPath(id), "PATCH", input);
}

export async function deleteAdminUser(id: string) {
  await request(userPath(id), "DELETE");
}

export async function lockAdminUser(id: string) {
  await request(userPath(id, "lock"), "POST");
}

export async function unlockAdminUser(id: string) {
  await request(userPath(id, "lock"), "DELETE");
}

export async function sendAdminPasswordReset(id: string) {
  await request(userPath(id, "reset-password"), "POST");
}
