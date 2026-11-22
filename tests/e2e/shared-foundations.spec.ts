import fs from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import {
  assertResponsiveGeometry,
  attachConsoleAndNetworkHygiene,
} from "./helpers/geometry-hygiene";

const SCREENSHOT_DIR = process.env.PIPELINE_SCREENSHOTS_DIR
  ? path.resolve(process.env.PIPELINE_SCREENSHOTS_DIR)
  : null;

async function capture(page: Page, filename: string) {
  if (!SCREENSHOT_DIR) return;
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  await page.waitForLoadState("load");
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        document.fonts.ready.then(() =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        );
      }),
  );
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, filename),
    fullPage: true,
    animations: "disabled",
  });
}

async function stubExternalAndHealthRoutes(page: Page) {
  await page.route("https://accounts.google.com/gsi/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: "",
    });
  });
  await page.route("**/api/system/ping", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "ok" }),
    });
  });
}

test.describe("Shared Foundations - Skip Link & Multi-Viewport Geometry", () => {
  for (const route of ["/login", "/"]) {
    test(`exposes skip-to-main-content link targeting #main-content and clean responsive geometry on ${route}`, async ({
      page,
    }) => {
      await stubExternalAndHealthRoutes(page);
      const hygiene = attachConsoleAndNetworkHygiene(page);
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(route);

      const skipLink = page.getByTestId("skip-to-main-link");
      await expect(skipLink).toHaveAttribute("href", "#main-content");
      await expect(skipLink).toHaveText("Skip to main content");

      const main = page.locator("#main-content");
      await expect(main).toBeVisible();
      await expect(main).toHaveAttribute("tabindex", "-1");

      if (route === "/login") {
        await capture(page, "01-login-desktop.png");
      } else {
        await capture(page, "04-home-desktop.png");
      }

      await skipLink.focus();
      await expect(skipLink).toBeFocused();
      if (route === "/login") {
        await capture(page, "03-skip-link-focused-desktop.png");
      }

      await page.keyboard.press("Enter");
      await expect(main).toBeFocused();

      await assertResponsiveGeometry(page);
      if (route === "/login") {
        await page.setViewportSize({ width: 390, height: 844 });
        await capture(page, "02-login-mobile.png");
      }
      hygiene.assertClean();
    });
  }
});
