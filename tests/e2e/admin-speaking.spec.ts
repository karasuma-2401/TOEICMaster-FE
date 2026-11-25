import { expect, test, type Page } from "@playwright/test";
import {
  exerciseDto,
  ids,
  pageDto,
  summaryDto,
  testListItemDto,
} from "../../src/features/speaking/testing/fixtures";
import { loginAsAdmin } from "./admin-writing-helpers";

/** Mocks the same-origin Speaking admin BFF so the pages render without a backend. */
async function mockSpeakingAdmin(page: Page) {
  await page.route("**/api/admin/speaking/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace("/api/admin/speaking/", "");
    if (path === "summary") return route.fulfill({ json: summaryDto });
    if (path === "exercises") {
      const part = Number(url.searchParams.get("part") ?? "1") as
        1 | 2 | 3 | 4 | 5;
      return route.fulfill({
        json: pageDto(
          Array.from({ length: 6 }, (_, index) =>
            exerciseDto(part, {
              id: ids.exercise(40 + index),
              code: `SP${part}-LONG-CODE-${index + 1}`,
              topic:
                "A deliberately long exercise topic used to stress the table layout on narrow screens",
            }),
          ),
        ),
      });
    }
    if (path === "tests")
      return route.fulfill({
        json: pageDto([testListItemDto(), testListItemDto({ code: "SPK-2" })]),
      });
    return route.fulfill({ status: 404, json: { title: "Not mocked" } });
  });
}

async function horizontalOverflow(page: Page) {
  return page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
}

test.describe("Admin Speaking", () => {
  test.beforeEach(async ({ context, page }) => {
    await loginAsAdmin(context);
    await mockSpeakingAdmin(page);
  });

  for (const viewport of [
    { name: "mobile", width: 390, height: 844 },
    { name: "tablet", width: 768, height: 1024 },
  ]) {
    test(`Part 1 content page has no horizontal page overflow on ${viewport.name}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto("/admin/content/speaking/part-1");
      await expect(
        page.getByRole("heading", { name: "Speaking Part 1" }),
      ).toBeVisible();
      await expect(page.getByText("SP1-LONG-CODE-1")).toBeVisible();

      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
    });
  }

  test("test builder traps Tab focus, hides the list and restores focus on Escape", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/admin/tests/speaking");
    const opener = page.getByRole("button", { name: "+ Create Speaking test" });
    await opener.click();

    const dialog = page.getByRole("dialog", {
      name: "Direct Speaking test authoring",
    });
    await expect(dialog).toBeVisible();

    for (let press = 0; press < 8; press += 1) {
      await page.keyboard.press("Tab");
      expect(
        await dialog.evaluate((node) => node.contains(document.activeElement)),
      ).toBe(true);
    }
    // The list behind the builder is covered by an opaque surface.
    await expect(page.getByRole("table")).toHaveCount(0);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
  });
});
