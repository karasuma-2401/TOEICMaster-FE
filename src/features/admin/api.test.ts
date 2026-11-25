import { afterEach, describe, expect, it, vi } from "vitest";
import { refreshSession } from "@/features/auth/api";
import { DEFAULT_ADMIN_USERS_QUERY } from "./users";
import {
  AdminUsersApiError,
  adminUserErrorMessage,
  createAdminUser,
  getAdminUsers,
  lockAdminUser,
  updateAdminUser,
} from "./api";

vi.mock("@/features/auth/api", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/features/auth/api")>();
  return { ...original, refreshSession: vi.fn() };
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

const emptyPage = {
  items: [],
  page: 1,
  pageSize: 10,
  totalItems: 0,
  totalPages: 0,
  stats: { totalUsers: 0, activeUsers: 0, pendingUsers: 0, lockedUsers: 0 },
};

const user = {
  id: "user-123",
  fullName: "Mai Phu",
  email: "mai@example.com",
  avatarUrl: null,
  role: "USER",
  status: "PENDING",
  emailVerified: false,
  authProvider: "PASSWORD",
  createdAt: "2026-11-20T10:00:00Z",
  lastLoginAt: null,
};

function problem(status: number, body: object) {
  return Response.json(body, {
    status,
    headers: { "Content-Type": "application/problem+json" },
  });
}

describe("Admin Users API", () => {
  it("validates list data returned by the BFF", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(emptyPage));
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      getAdminUsers(DEFAULT_ADMIN_USERS_QUERY),
    ).resolves.toMatchObject({ items: [] });
    expect(fetchMock.mock.calls[0][0]).toBe(
      "/api/admin/users?page=1&pageSize=10&sort=createdAt%3Adesc",
    );
  });

  it("preserves HTTP authorization errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(problem(403, { title: "Forbidden." })),
    );
    await expect(
      getAdminUsers(DEFAULT_ADMIN_USERS_QUERY),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("refreshes the session once after a 401 response", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(problem(401, { title: "Expired" }))
      .mockResolvedValueOnce(Response.json(emptyPage));
    vi.stubGlobal("fetch", fetchMock);
    vi.mocked(refreshSession).mockResolvedValue({
      id: "1",
      displayName: "Admin",
      email: "admin@example.com",
    });

    await expect(
      getAdminUsers(DEFAULT_ADMIN_USERS_QUERY),
    ).resolves.toMatchObject({ items: [] });
    expect(refreshSession).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("rejects malformed response data", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ items: [{ id: "bad" }] })),
    );
    await expect(
      getAdminUsers(DEFAULT_ADMIN_USERS_QUERY),
    ).rejects.toMatchObject({ status: 502 });
  });

  it("sends create requests through the same-origin API and returns the user", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(Response.json(user, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    const created = await createAdminUser({
      fullName: "Mai Phu",
      email: "mai@example.com",
      role: "USER",
      sendActivationEmail: true,
    });
    const [path, init] = fetchMock.mock.calls[0];
    expect(path).toBe("/api/admin/users");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({
      fullName: "Mai Phu",
      email: "mai@example.com",
      role: "USER",
      sendActivationEmail: true,
    });
    expect(created.id).toBe("user-123");
  });

  it("sends lock actions to the user action endpoint without a body", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    await lockAdminUser("user-123");
    expect(fetchMock.mock.calls[0][0]).toBe("/api/admin/users/user-123/lock");
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "POST" });
    expect(fetchMock.mock.calls[0][1].body).toBeUndefined();
  });

  it("keeps ProblemDetails code, detail and traceId (409 LAST_ACTIVE_ADMIN)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        problem(409, {
          title: "At least one active administrator is required.",
          detail: "At least one active administrator is required.",
          status: 409,
          code: "LAST_ACTIVE_ADMIN",
          traceId: "00-abc-01",
        }),
      ),
    );

    const error = await updateAdminUser("user-123", { role: "USER" }).catch(
      (cause: unknown) => cause,
    );

    expect(error).toBeInstanceOf(AdminUsersApiError);
    expect(error).toMatchObject({
      status: 409,
      code: "LAST_ACTIVE_ADMIN",
      traceId: "00-abc-01",
    });
    expect(adminUserErrorMessage(error, "fallback")).toMatch(
      /last active administrator/i,
    );
  });

  it("surfaces validation field errors from a 400", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        problem(400, {
          title: "One or more validation errors occurred.",
          errors: { Email: ["Email is invalid."] },
        }),
      ),
    );

    await expect(
      createAdminUser({
        fullName: "X",
        email: "bad",
        role: "USER",
        sendActivationEmail: false,
      }),
    ).rejects.toMatchObject({
      status: 400,
      fieldErrors: { email: ["Email is invalid."] },
    });
  });

  it("passes aborts through untouched", async () => {
    const controller = new AbortController();
    controller.abort();
    const abort = new DOMException("Aborted", "AbortError");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(abort));
    await expect(
      getAdminUsers(DEFAULT_ADMIN_USERS_QUERY, controller.signal),
    ).rejects.toBe(abort);
  });
});
