import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/shared/api/client";
import { refreshSession } from "@/features/auth/api";
import { DEFAULT_ADMIN_USERS_QUERY } from "./users";
import { createAdminUser, getAdminUsers, lockAdminUser } from "./api";

vi.mock("@/shared/api/client", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/shared/api/client")>();
  return { ...original, getJson: vi.fn() };
});
vi.mock("@/features/auth/api", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/features/auth/api")>();
  return { ...original, refreshSession: vi.fn() };
});

import { getJson } from "@/shared/api/client";

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("getAdminUsers", () => {
  it("validates data returned from the shared API client", async () => {
    vi.mocked(getJson).mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 10,
      totalItems: 0,
      totalPages: 0,
      stats: { totalUsers: 0, activeUsers: 0, pendingUsers: 0, lockedUsers: 0 },
    });
    await expect(
      getAdminUsers(DEFAULT_ADMIN_USERS_QUERY),
    ).resolves.toMatchObject({ items: [] });
  });

  it("preserves HTTP authorization errors", async () => {
    vi.mocked(getJson).mockRejectedValue(new ApiError(403, "Không có quyền."));
    await expect(
      getAdminUsers(DEFAULT_ADMIN_USERS_QUERY),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("refreshes the session once after a 401 response", async () => {
    vi.mocked(getJson)
      .mockRejectedValueOnce(new ApiError(401, "Expired"))
      .mockResolvedValueOnce({
        items: [],
        page: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 0,
        stats: {
          totalUsers: 0,
          activeUsers: 0,
          pendingUsers: 0,
          lockedUsers: 0,
        },
      });
    vi.mocked(refreshSession).mockResolvedValue({
      id: "1",
      displayName: "Admin",
      email: "admin@example.com",
    });

    await expect(
      getAdminUsers(DEFAULT_ADMIN_USERS_QUERY),
    ).resolves.toMatchObject({ items: [] });
    expect(refreshSession).toHaveBeenCalledOnce();
    expect(getJson).toHaveBeenCalledTimes(2);
  });

  it("rejects malformed response data", async () => {
    vi.mocked(getJson).mockResolvedValue({ items: [{ id: "bad" }] });
    await expect(
      getAdminUsers(DEFAULT_ADMIN_USERS_QUERY),
    ).rejects.toMatchObject({ status: 502 });
  });

  it("sends create requests through the same-origin API", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    await createAdminUser({
      fullName: "Mai Phu",
      email: "mai@example.com",
      role: "USER",
      sendActivationEmail: true,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/users",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          fullName: "Mai Phu",
          email: "mai@example.com",
          role: "USER",
          sendActivationEmail: true,
        }),
      }),
    );
  });

  it("sends lock actions to the user action endpoint", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    await lockAdminUser("user-123");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/users/user-123/lock",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchMock.mock.calls[0][1]).not.toHaveProperty("body");
  });
});
