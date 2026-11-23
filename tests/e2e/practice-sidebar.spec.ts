import fs from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { loginAsUser } from "./learner-writing-helpers";

const SCREENSHOT_DIR = process.env.PIPELINE_SCREENSHOTS_DIR
  ? path.resolve(process.env.PIPELINE_SCREENSHOTS_DIR)
  : null;

async function assertCleanDomGeometry(page: Page) {
  const hasOverflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
  expect(hasOverflow, "Page has unintended horizontal scroll overflow").toBe(
    false,
  );

  const brokenImages = await page.evaluate(() =>
    Array.from(document.querySelectorAll("img"))
      .filter((img) => !img.complete || img.naturalWidth === 0)
      .map((img) => img.src),
  );
  expect(brokenImages, "Broken images detected").toEqual([]);
}

async function assertDesktopHeaderAndSidebarGeometry(page: Page) {
  const sidebar = page.getByTestId("practice-sidebar");
  const asideBox = await sidebar.boundingBox();
  expect(asideBox).not.toBeNull();

  const header = page.locator("header").first();
  const headerBox = await header.boundingBox();
  expect(headerBox).not.toBeNull();
  expect(headerBox!.x).toBeGreaterThanOrEqual(
    asideBox!.x + asideBox!.width - 1,
  );

  const userMenu = page.getByTestId("user-menu-trigger");
  await expect(userMenu).toBeVisible();
  const userMenuBox = await userMenu.boundingBox();
  expect(userMenuBox).not.toBeNull();
  expect(
    userMenuBox!.x,
    "Desktop account menu (UserMenu) must stay right-aligned in the top bar",
  ).toBeGreaterThan(headerBox!.x + headerBox!.width * 0.75);

  const h1 = page.locator("h1").first();
  if ((await h1.count()) > 0 && (await h1.isVisible())) {
    const h1Box = await h1.boundingBox();
    expect(h1Box).not.toBeNull();
    expect(
      h1Box!.x,
      "Main heading must not overlap the fixed PracticeSidebar",
    ).toBeGreaterThanOrEqual(asideBox!.x + asideBox!.width - 1);
  }
}

async function captureScreenshot(page: Page, filename: string) {
  if (!SCREENSHOT_DIR) return;
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, filename),
    fullPage: true,
    animations: "disabled",
  });
}

async function mockLearnerApis(page: Page) {
  await page.route("**/api/system/ping", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "ok" }),
    });
  });

  await page.route("**/api/auth/session", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: "authenticated",
        user: {
          id: "user-learner-01",
          displayName: "Learner User",
          email: "learner@example.com",
        },
      }),
    });
  });

  await page.route("**/api/profile", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "user-learner-01",
        displayName: "Learner User",
        email: "learner@example.com",
        phone: "0912345678",
        dateOfBirth: "1998-05-12",
        targetScore: 800,
        avatarUrl: null,
        hasPassword: true,
      }),
    });
  });

  await page.route("**/api/lr/exams/lr", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  await page.route("**/api/lr/exam-attempts/history*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: [],
        totalCount: 0,
        pageIndex: 1,
        pageSize: 50,
      }),
    });
  });

  await page.route("**/api/speaking/tests*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: [],
        pageNumber: 1,
        pageSize: 20,
        totalCount: 0,
        totalPages: 0,
      }),
    });
  });

  await page.route("**/api/speaking/attempts*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: [],
        pageNumber: 1,
        pageSize: 20,
        totalCount: 0,
        totalPages: 0,
      }),
    });
  });

  await page.route("**/api/writing/tests*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: [],
        pageNumber: 1,
        pageSize: 20,
        totalCount: 0,
        totalPages: 0,
      }),
    });
  });

  await page.route("**/api/writing/attempts*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: [],
        pageNumber: 1,
        pageSize: 20,
        totalCount: 0,
        totalPages: 0,
      }),
    });
  });

  await page.route("**/api/pronunciation/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ items: [] }),
    });
  });
}

test.describe("Practice Sidebar Navigation", () => {
  test.beforeEach(async ({ page, context }) => {
    await mockLearnerApis(page);
    await loginAsUser(context);
  });

  test("desktop 1440x900 renders expanded sidebar, collapses with persistence, and preserves home slots", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");

    const sidebar = page.getByTestId("practice-sidebar");
    await expect(sidebar).toBeVisible();
    await expect(sidebar).toHaveAttribute("data-collapsed", "false");

    // Verify grouped nav, standalone links, and brand mark inside sidebar
    const nav = sidebar.getByRole("navigation", { name: "Practice" });
    await expect(nav).toBeVisible();
    await expect(
      sidebar.getByRole("link", { name: /TOEICMaster/i }),
    ).toBeVisible();
    await expect(nav.getByText("Exams", { exact: true })).toBeVisible();
    await expect(nav.getByText("Exercises", { exact: true })).toBeVisible();
    await expect(
      nav.getByRole("link", { name: "Listening & Reading" }),
    ).toHaveCount(2);
    await expect(nav.getByRole("link", { name: "Speaking" })).toHaveCount(2);
    await expect(nav.getByRole("link", { name: "Writing" })).toHaveCount(2);
    await expect(
      nav.getByRole("link", { name: "Pronunciation" }),
    ).toBeVisible();
    await expect(nav.getByRole("link", { name: "History" })).toBeVisible();

    // No active route on "/"
    const activeLinks = nav.locator('[aria-current="page"]');
    await expect(activeLinks).toHaveCount(0);

    // Desktop mobile-only header controls and duplicate header brand are hidden; account remains visible
    await expect(
      page.getByRole("button", { name: "Open menu", exact: true }),
    ).toBeHidden();
    await expect(page.getByTestId("user-menu-trigger")).toBeVisible();
    await expect(
      page.locator('a[href="/"]:has-text("TOEICMaster"):visible'),
    ).toHaveCount(1);

    // Home milestoneLinks card links remain intact
    const milestoneRegion = page
      .locator("section, div")
      .filter({ hasText: "YOUR NEXT MILESTONE" })
      .first();
    await expect(
      milestoneRegion
        .getByRole("link", { name: "Listening & Reading" })
        .first(),
    ).toHaveAttribute("href", "/listening-reading");
    await expect(
      milestoneRegion.getByRole("link", { name: "Speaking" }).first(),
    ).toHaveAttribute("href", "/speaking");
    await expect(
      milestoneRegion.getByRole("link", { name: "Writing" }).first(),
    ).toHaveAttribute("href", "/writing");

    // Expanded width (w-60 = 240px) and matching body left padding (15rem = 240px)
    const expandedBox = await sidebar.boundingBox();
    expect(expandedBox?.width).toBeCloseTo(240, 0);
    const expandedPadding = await page.evaluate(
      () => getComputedStyle(document.body).paddingLeft,
    );
    expect(expandedPadding).toBe("240px");

    await assertCleanDomGeometry(page);
    await assertDesktopHeaderAndSidebarGeometry(page);
    await captureScreenshot(page, "01-desktop-default-1440x900.png");

    // Collapse via toggle button
    const toggle = page.getByTestId("practice-sidebar-toggle");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(toggle).toHaveAttribute("aria-label", "Collapse sidebar");
    await toggle.click();

    await expect(sidebar).toHaveAttribute("data-collapsed", "true");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toHaveAttribute("aria-label", "Expand sidebar");

    await expect
      .poll(() =>
        page.evaluate(() =>
          window.localStorage.getItem("toeicmaster.sidebar.collapsed"),
        ),
      )
      .toBe("1");

    await expect
      .poll(async () => (await sidebar.boundingBox())?.width ?? 0)
      .toBeCloseTo(64, 0);
    await expect
      .poll(() =>
        page.evaluate(() => getComputedStyle(document.body).paddingLeft),
      )
      .toBe("64px");

    // Collapsed rail renders icon-only links while accessible names and tooltips remain intact
    const collapsedLinks = nav.getByRole("link");
    await expect(collapsedLinks).toHaveCount(10);
    for (let i = 0; i < 10; i++) {
      const link = collapsedLinks.nth(i);
      await expect(link.locator("svg")).toBeVisible();
      expect((await link.innerText()).trim()).toBe("");
    }
    await expect(
      nav.getByRole("link", { name: "Pronunciation" }),
    ).toBeVisible();
    await expect(
      nav.getByRole("link", { name: "Pronunciation" }),
    ).toHaveAttribute("title", "Pronunciation");
    await expect(nav.getByRole("link", { name: "History" })).toBeVisible();

    await assertCleanDomGeometry(page);
    await captureScreenshot(
      page,
      "03-interactive-collapsed-and-mobile-menu.png",
    );

    // Reload persists collapsed state
    await page.reload();
    await expect(page.getByTestId("practice-sidebar")).toHaveAttribute(
      "data-collapsed",
      "true",
    );

    // Toggle back to expanded
    await page.getByTestId("practice-sidebar-toggle").click();
    await expect(page.getByTestId("practice-sidebar")).toHaveAttribute(
      "data-collapsed",
      "false",
    );
    await expect(page.getByTestId("practice-sidebar-toggle")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  test("desktop 1440x900 highlights exact active route across all SkillHeader entrypoints", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    const routeChecks: Array<{
      url: string;
      expectedHref: string | null;
      screenshot?: string;
    }> = [
      {
        url: "/pronunciation",
        expectedHref: "/pronunciation",
        screenshot: "04-active-subroute-highlight.png",
      },
      { url: "/listening-reading", expectedHref: "/listening-reading" },
      { url: "/speaking", expectedHref: "/speaking" },
      { url: "/writing", expectedHref: "/writing" },
      { url: "/history", expectedHref: "/history" },
      { url: "/profile", expectedHref: null },
    ];

    for (const check of routeChecks) {
      await page.goto(check.url);
      const sidebar = page.getByTestId("practice-sidebar");
      await expect(sidebar).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Open menu", exact: true }),
      ).toBeHidden();
      await expect(page.getByTestId("user-menu-trigger")).toBeVisible();
      await expect(
        page.locator('a[href="/"]:has-text("TOEICMaster"):visible'),
      ).toHaveCount(1);

      const nav = sidebar.getByRole("navigation", { name: "Practice" });
      const activeLinks = nav.locator('[aria-current="page"]');
      if (check.expectedHref) {
        await expect(activeLinks).toHaveCount(1);
        await expect(activeLinks.first()).toHaveAttribute(
          "href",
          check.expectedHref,
        );
      } else {
        await expect(activeLinks).toHaveCount(0);
      }

      await assertCleanDomGeometry(page);
      await assertDesktopHeaderAndSidebarGeometry(page);
      if (check.screenshot) {
        await captureScreenshot(page, check.screenshot);
      }
    }

    // Out-of-scope auth route must not render PracticeSidebar
    await page.goto("/login");
    await expect(page.getByTestId("practice-sidebar")).toHaveCount(0);
  });

  test("mobile 390x844 hides desktop sidebar, has zero overflow, and keeps drawer parity", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    await expect(page.getByTestId("practice-sidebar")).toBeHidden();
    const mobilePadding = await page.evaluate(
      () => getComputedStyle(document.body).paddingLeft,
    );
    expect(mobilePadding).toBe("0px");

    await assertCleanDomGeometry(page);
    await captureScreenshot(page, "02-mobile-default-390x844.png");

    // Check active route inside mobile HeaderMenu drawer on /pronunciation
    await page.goto("/pronunciation");
    await expect(page.getByTestId("practice-sidebar")).toBeHidden();

    const menuButton = page.getByRole("button", {
      name: "Open menu",
      exact: true,
    });
    await expect(menuButton).toBeVisible();
    await menuButton.click();

    const drawer = page.getByRole("dialog");
    await expect(drawer).toBeVisible();
    await expect(drawer.getByText("Exams", { exact: true })).toBeVisible();
    await expect(drawer.getByText("Exercises", { exact: true })).toBeVisible();
    await expect(drawer.getByTestId("user-menu-trigger")).toBeVisible();

    const activeDrawerLink = drawer.locator('[aria-current="page"]');
    await expect(activeDrawerLink).toHaveCount(1);
    await expect(activeDrawerLink).toHaveAttribute("href", "/pronunciation");

    // Navigate using mobile drawer link
    await drawer.getByRole("link", { name: "Speaking" }).first().click();
    await expect(page).toHaveURL(/\/speaking$/);
    await assertCleanDomGeometry(page);
  });
});
