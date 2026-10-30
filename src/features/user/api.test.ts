import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { refreshSession } from "@/features/auth/api";
import {
  ApiError,
  avatarUrl,
  changePassword,
  getProfile,
  normalizeErrors,
  uploadAvatar,
  updateProfile,
} from "./api";

vi.mock("@/features/auth/api", () => ({ refreshSession: vi.fn() }));

const backendProfile = {
  id: "user-1",
  displayName: "Linh",
  email: "linh@example.com",
  avatarUrl: null,
  hasPassword: true,
};

const profile = {
  id: "user-1",
  email: "linh@example.com",
  displayName: "Linh",
  phone: null,
  targetScore: null,
  avatarVersion: null,
  hasPassword: true,
};

afterEach(() => vi.unstubAllGlobals());
beforeEach(() => vi.clearAllMocks());

describe("profile API", () => {
  it("normalizes PascalCase field errors to the first message", () => {
    expect(
      normalizeErrors({
        errors: { DisplayName: ["Tên sai", "Khác"], CurrentPassword: ["Sai"] },
      }),
    ).toEqual({
      displayName: "Tên sai",
      currentPassword: "Sai",
    });
  });

  it("exposes 400 errors by field", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json(
          {
            title: "Dữ liệu không hợp lệ",
            errors: { DisplayName: ["Tên sai"] },
          },
          { status: 400 },
        ),
      ),
    );
    await expect(getProfile()).rejects.toMatchObject({
      status: 400,
      fieldErrors: { displayName: "Tên sai" },
    } satisfies Partial<ApiError>);
  });

  it("preserves Retry-After on 429", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ title: "Thử lại" }), {
          status: 429,
          headers: {
            "Content-Type": "application/problem+json",
            "Retry-After": "17",
          },
        }),
      ),
    );
    await expect(getProfile()).rejects.toMatchObject({
      status: 429,
      retryAfter: 17,
    });
  });

  it("refreshes the session once and retries a request after 401", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({ title: "Hết hạn" }, { status: 401 }),
      )
      .mockResolvedValueOnce(Response.json(backendProfile));
    vi.stubGlobal("fetch", fetchMock);
    vi.mocked(refreshSession).mockResolvedValue({
      id: "user-1",
      displayName: "Linh",
      email: "linh@example.com",
    });
    await expect(getProfile()).resolves.toEqual(profile);
    expect(refreshSession).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("maps the backend profile and rejects unexpected shapes", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          Response.json({
            ...backendProfile,
            avatarUrl: "/api/v1/profile/avatar",
          }),
        )
        .mockResolvedValueOnce(Response.json({ id: "user-1" })),
    );
    const mapped = await getProfile();
    expect(mapped).toMatchObject({ id: "user-1", displayName: "Linh" });
    expect(mapped.avatarVersion).toEqual(expect.any(String));
    expect(avatarUrl(mapped)).toMatch(/^\/api\/profile\/avatar\?v=/);
    await expect(getProfile()).rejects.toMatchObject({ status: 502 });
  });

  it("maps phone, target score and hasPassword, with defaults for older backends", async () => {
    const { hasPassword: _omitted, ...withoutHasPassword } = backendProfile;
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          Response.json({
            ...backendProfile,
            phone: "0912345678",
            targetScore: 750,
            hasPassword: false,
          }),
        )
        .mockResolvedValueOnce(Response.json(withoutHasPassword))
        .mockResolvedValueOnce(
          Response.json({ ...backendProfile, targetScore: "750" }),
        ),
    );
    await expect(getProfile()).resolves.toMatchObject({
      phone: "0912345678",
      targetScore: 750,
      hasPassword: false,
    });
    await expect(getProfile()).resolves.toMatchObject({
      phone: null,
      targetScore: null,
      hasPassword: true,
    });
    await expect(getProfile()).rejects.toMatchObject({ status: 502 });
  });

  it("sends name, phone and target score and validates the response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(backendProfile));
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      updateProfile({ displayName: "Linh", phone: null, targetScore: null }),
    ).resolves.toEqual(profile);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/profile",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({
          displayName: "Linh",
          phone: null,
          targetScore: null,
        }),
      }),
    );
  });

  it("does not send the confirmation password to the backend", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    await changePassword({
      currentPassword: "current-password",
      newPassword: "new-password",
      confirmPassword: "new-password",
    });
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual({
      currentPassword: "current-password",
      newPassword: "new-password",
    });
  });

  it("uploads the avatar as multipart under file, then reloads the profile", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(
        Response.json({
          ...backendProfile,
          avatarUrl: "/api/v1/profile/avatar",
        }),
      );
    vi.stubGlobal("fetch", fetchMock);
    const file = new File(["image"], "avatar.png", { type: "image/png" });
    await expect(uploadAvatar(file)).resolves.toMatchObject({
      avatarVersion: expect.any(String),
    });
    const [path, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(path).toBe("/api/profile/avatar");
    expect(init.method).toBe("PUT");
    expect(init.body).toBeInstanceOf(FormData);
    expect((init.body as FormData).get("file")).toBe(file);
    expect(new Headers(init.headers).has("content-type")).toBe(false);
    expect(fetchMock.mock.calls[1][0]).toBe("/api/profile");
    expect(avatarUrl({ ...profile, avatarVersion: "v 2" })).toBe(
      "/api/profile/avatar?v=v%202",
    );
    expect(avatarUrl(profile)).toBeNull();
  });
});
