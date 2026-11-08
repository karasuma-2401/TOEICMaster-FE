import { test, expect } from "@playwright/test";

test.describe("Authentication - Login Page", () => {
  test("Hiển thị giao diện đăng nhập đầy đủ các trường", async ({ page }) => {
    await page.goto("/login");

    // Kiểm tra title trang
    await expect(page).toHaveTitle(/Đăng nhập/);

    // Kiểm tra các trường nhập liệu và nút bấm
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Đăng nhập" })).toBeVisible();
  });

  test("Hiển thị lỗi validation khi submit form trống", async ({ page }) => {
    await page.goto("/login");

    // Click nút đăng nhập mà không nhập gì
    await page.getByRole("button", { name: "Đăng nhập" }).click();

    // Phải hiển thị thông báo lỗi
    await expect(page.locator("#email-error")).toBeVisible();
    await expect(page.locator("#password-error")).toBeVisible();
  });

  test("Chuyển hướng sang trang đăng ký khi click link", async ({ page }) => {
    await page.goto("/login");

    // Click link Đăng ký miễn phí và chờ URL chuyển sang /register
    await Promise.all([
      page.waitForURL(/\/register/),
      page.getByRole("link", { name: "Đăng ký miễn phí" }).click(),
    ]);

    await expect(page).toHaveURL(/\/register/);
  });
});
