import { afterEach, describe, expect, it, vi } from "vitest";
import { isAdminPreviewEnabled } from "./admin-preview";

afterEach(() => vi.unstubAllEnvs());

describe("isAdminPreviewEnabled", () => {
  it("enables only the local development shell preview", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("ADMIN_PREVIEW", "true");
    expect(isAdminPreviewEnabled()).toBe(true);
  });

  it("cannot bypass authentication outside development", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ADMIN_PREVIEW", "true");
    expect(isAdminPreviewEnabled()).toBe(false);
  });
});
