import { test, expect } from "@playwright/test";

test.describe("Authentication - Login Page", () => {
  test("Displays the login UI with all required fields", async ({ page }) => {
    await page.goto("/login");

    // Verify page title
    await expect(page).toHaveTitle(/Sign In/);

    // Verify input fields and submit button
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });

  test("Displays validation errors when submitting an empty form", async ({
    page,
  }) => {
    await page.goto("/login");

    // Click the Sign in button without entering anything
    await page.getByRole("button", { name: "Sign in" }).click();

    // Validation error messages must be visible
    await expect(page.locator("#email-error")).toBeVisible();
    await expect(page.locator("#password-error")).toBeVisible();
  });

  test("Redirects to the registration page when clicking the sign-up link", async ({
    page,
  }) => {
    await page.goto("/login");

    // Click the Sign up for free link and wait for URL to navigate to /register
    await Promise.all([
      page.waitForURL(/\/register/),
      page.getByRole("link", { name: "Sign up for free" }).click(),
    ]);

    await expect(page).toHaveURL(/\/register/);
  });
});
