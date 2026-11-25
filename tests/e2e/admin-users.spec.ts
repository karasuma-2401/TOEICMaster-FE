import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./admin-writing-helpers";

const admin = {
  id: "11111111-1111-4111-8111-111111111111",
  fullName: "Only Admin",
  email: "admin@toeicmaster.local",
  avatarUrl: null,
  role: "ADMIN",
  status: "ACTIVE",
  emailVerified: true,
  authProvider: "PASSWORD",
  createdAt: "2026-10-01T10:00:00Z",
  lastLoginAt: null,
};

test.describe("Admin Users (/admin/users)", () => {
  test.beforeEach(async ({ context, page }) => {
    await loginAsAdmin(context);
    await page.route("**/api/admin/users**", async (route) => {
      const request = route.request();
      const path = new URL(request.url()).pathname;
      if (request.method() === "GET" && path === "/api/admin/users")
        return route.fulfill({
          json: {
            items: [admin],
            page: 1,
            pageSize: 10,
            totalItems: 1,
            totalPages: 1,
            stats: {
              totalUsers: 1,
              activeUsers: 1,
              pendingUsers: 0,
              lockedUsers: 0,
            },
          },
        });
      if (request.method() === "PATCH")
        return route.fulfill({
          status: 409,
          contentType: "application/problem+json",
          body: JSON.stringify({
            status: 409,
            title: "At least one active administrator is required.",
            detail: "At least one active administrator is required.",
            code: "LAST_ACTIVE_ADMIN",
            traceId: "00-e2e-trace-01",
          }),
        });
      return route.fulfill({ status: 404, json: { title: "Not mocked" } });
    });
    await page.goto("/admin/users");
    await expect(page.getByRole("row", { name: /Only Admin/ })).toBeVisible();
  });

  test("+ Add user opens a focus-trapped dialog", async ({ page }) => {
    const add = page.getByRole("button", { name: "+ Add user" });
    await expect(add).toBeEnabled();
    await add.click();
    const dialog = page.getByRole("dialog", { name: "Add user" });
    await expect(dialog).toBeVisible();
    for (let press = 0; press < 8; press += 1) {
      await page.keyboard.press("Tab");
      expect(
        await dialog.evaluate((node) => node.contains(document.activeElement)),
      ).toBe(true);
    }
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(add).toBeFocused();
  });

  test("row menu changes role and shows the LAST_ACTIVE_ADMIN ProblemDetails message", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Actions for Only Admin" }).click();
    await page.getByRole("menuitem", { name: "Change role" }).click();
    const dialog = page.getByRole("dialog", { name: "Change role" });
    await dialog.getByLabel("Role").selectOption("USER");
    await dialog.getByRole("button", { name: "Save role" }).click();

    const alert = dialog.getByRole("alert");
    await expect(alert).toContainText("last active administrator");
    await expect(alert).toContainText("00-e2e-trace-01");
    await expect(alert).not.toContainText("connect");
  });
});
