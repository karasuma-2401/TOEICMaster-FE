import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { refreshSession } from "@/features/auth/api";
import {
  ApiError,
  avatarUrl,
  getProfile,
  normalizeErrors,
  uploadAvatar,
  updateProfile,
} from "./api";

vi.mock("@/features/auth/api", () => ({ refreshSession: vi.fn() }));

const profile = {
  id: "user-1",
  email: "linh@example.com",
  displayName: "Linh",
  phone: null,
  dateOfBirth: null,
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
      .mockResolvedValueOnce(Response.json(profile));
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

  it("sends only editable profile fields and validates the response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(profile));
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      updateProfile({
        displayName: "Linh",
        phone: null,
        dateOfBirth: null,
        targetScore: null,
      }),
    ).resolves.toEqual(profile);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/profile",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({
          displayName: "Linh",
          phone: null,
          dateOfBirth: null,
          targetScore: null,
        }),
      }),
    );
  });

  it("uploads the avatar as multipart under file without a manual content-type", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(Response.json({ ...profile, avatarVersion: "v 2" }));
    vi.stubGlobal("fetch", fetchMock);
    const file = new File(["image"], "avatar.png", { type: "image/png" });
    await expect(uploadAvatar(file)).resolves.toMatchObject({
      avatarVersion: "v 2",
    });
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.body).toBeInstanceOf(FormData);
    expect((init.body as FormData).get("file")).toBe(file);
    expect(new Headers(init.headers).has("content-type")).toBe(false);
    expect(avatarUrl({ ...profile, avatarVersion: "v 2" })).toBe(
      "/api/profile/avatar?v=v%202",
    );
    expect(avatarUrl(profile)).toBeNull();
  });
});
