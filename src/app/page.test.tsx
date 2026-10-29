// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cookies: vi.fn(),
  redirect: vi.fn(),
  sessionFromCookieStore: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies: mocks.cookies }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/features/auth/server/session", () => ({
  sessionFromCookieStore: mocks.sessionFromCookieStore,
}));
vi.mock("@/features/system/components/connection-status", () => ({
  ConnectionStatus: () => null,
}));
vi.mock("@/features/user/components/user-menu", () => ({
  UserMenu: () => null,
}));

import Home from "./page";

describe("Home", () => {
  it("sends an authenticated Admin to the exam management center", async () => {
    mocks.cookies.mockResolvedValue({ get: vi.fn() });
    mocks.sessionFromCookieStore.mockReturnValue({
      role: "ADMIN",
      refreshTokenExpiresAtUtc: new Date(Date.now() + 60_000).toISOString(),
    });
    mocks.redirect.mockImplementation(() => {
      throw new Error("redirected");
    });

    await expect(Home({})).rejects.toThrow("redirected");
    expect(mocks.redirect).toHaveBeenCalledWith("/admin/exams");
  });
});
