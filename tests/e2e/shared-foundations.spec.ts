import { expect, test } from "@playwright/test";
import {
  assertResponsiveGeometry,
  attachConsoleAndNetworkHygiene,
} from "./helpers/geometry-hygiene";

test.describe("Shared Foundations - Skip Link & Multi-Viewport Geometry", () => {
  for (const route of ["/login", "/"]) {
    test(`exposes skip-to-main-content link targeting #main-content and clean responsive geometry on ${route}`, async ({
      page,
    }) => {
      const hygiene = attachConsoleAndNetworkHygiene(page);
      await page.goto(route);

      const skipLink = page.getByTestId("skip-to-main-link");
      await expect(skipLink).toHaveAttribute("href", "#main-content");
      await expect(skipLink).toHaveText("Skip to main content");

      const main = page.locator("#main-content");
      await expect(main).toBeVisible();
      await expect(main).toHaveAttribute("tabindex", "-1");

      await skipLink.focus();
      await expect(skipLink).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(main).toBeFocused();

      await assertResponsiveGeometry(page);
      hygiene.assertClean();
    });
  }
});
