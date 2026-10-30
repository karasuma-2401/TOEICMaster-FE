import { describe, expect, it } from "vitest";
import { getAdminNavigationItem } from "./navigation";

describe("getAdminNavigationItem", () => {
  it("keeps the data section active for every skill's content and test pages", () => {
    for (const path of [
      "/admin/content/writing",
      "/admin/content/speaking",
      "/admin/tests/writing",
      "/admin/tests/speaking",
    ])
      expect(getAdminNavigationItem(path)?.label).toBe("Kho dữ liệu");
    expect(getAdminNavigationItem("/admin/users")?.label).toBe("Người dùng");
  });
});
