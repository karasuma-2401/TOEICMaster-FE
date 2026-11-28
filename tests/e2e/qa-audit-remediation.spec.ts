import fs from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import {
  assertNoHorizontalOverflow,
  attachConsoleAndNetworkHygiene,
} from "./helpers/geometry-hygiene";

const SCREENSHOT_DIR = process.env.PIPELINE_SCREENSHOTS_DIR
  ? path.resolve(process.env.PIPELINE_SCREENSHOTS_DIR)
  : null;

async function captureScreenshot(page: Page, filename: string) {
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

async function assertBrokenImagesZero(page: Page) {
  const brokenImages = await page.evaluate(() =>
    Array.from(document.querySelectorAll("img"))
      .filter((img) => !img.complete || img.naturalWidth === 0)
      .map((img) => img.src),
  );
  expect(brokenImages, "Broken images detected").toEqual([]);
}

async function stubPing(page: Page) {
  await page.route("**/api/system/ping", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "ok" }),
    });
  });
}

test.describe("QA Audit Critical & High Remediation E2E", () => {
  test("AC 7 & AC 11: guest / and /listening-reading settle networkidle with zero 401/refresh calls and closed opt-in GuideMascot", async ({
    page,
  }) => {
    await stubPing(page);
    // Stub public non-history catalog/practice endpoints so offline BE does not emit 502 console noise,
    // while keeping /api/auth/session REAL and leaving all history/refresh endpoints unstubbed.
    await page.route("**/api/lr/exams/lr", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
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

    const hygiene = attachConsoleAndNetworkHygiene(page);
    const forbiddenCalls: string[] = [];
    const unauthorizedResponses: string[] = [];

    page.on("request", (req) => {
      const url = new URL(req.url()).pathname;
      if (
        url === "/api/lr/exam-attempts/history" ||
        url === "/api/speaking/attempts" ||
        url === "/api/writing/attempts" ||
        url === "/api/auth/refresh"
      ) {
        forbiddenCalls.push(url);
      }
    });
    page.on("response", (res) => {
      if (res.status() === 401) {
        unauthorizedResponses.push(`${res.status()} ${res.url()}`);
      }
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });

    const historySection = page.getByTestId("attempt-history-section");
    await expect(historySection).toBeVisible();
    await expect(
      historySection.getByText("Sign in to view your attempt history"),
    ).toBeVisible();

    // AC 11: GuideMascot remains closed by default after > 1s and toggles on demand
    const mascotTrigger = page.getByRole("button", {
      name: "Ask Mic how to use this page",
    });
    await expect(mascotTrigger).toBeVisible();
    await page.waitForTimeout(1100);
    await expect(mascotTrigger).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByRole("region", { name: "User guide" })).toHaveCount(
      0,
    );

    await assertNoHorizontalOverflow(page, "home-desktop-1440x900");
    await assertBrokenImagesZero(page);
    await captureScreenshot(page, "01-home-desktop-1440x900.png");

    await mascotTrigger.click();
    await expect(mascotTrigger).toHaveAttribute("aria-expanded", "true");
    await expect(
      page.getByRole("region", { name: "User guide" }),
    ).toBeVisible();
    await mascotTrigger.click();
    await expect(mascotTrigger).toHaveAttribute("aria-expanded", "false");

    await page.goto("/listening-reading", { waitUntil: "networkidle" });
    await expect(page.getByTestId("attempt-history-section")).toBeVisible();

    expect(forbiddenCalls).toEqual([]);
    expect(unauthorizedResponses).toEqual([]);
    hygiene.assertClean();
  });

  test("AC 10 & AC 13: /login fits 375x812 mobile without Google Sign-In clipping, requests ?hl=en, and meets WCAG AA contrast", async ({
    page,
  }) => {
    await stubPing(page);
    const hygiene = attachConsoleAndNetworkHygiene(page);
    const gsiUrls: string[] = [];

    await page.route(
      "https://accounts.google.com/gsi/client*",
      async (route) => {
        gsiUrls.push(route.request().url());
        await route.fulfill({
          status: 200,
          contentType: "application/javascript",
          body: `
          window.google = {
            accounts: {
              id: {
                initialize: function() {},
                renderButton: function(el, opts) {
                  var btn = document.createElement('div');
                  btn.setAttribute('data-testid', 'mock-gsi-button');
                  btn.style.width = opts.width + 'px';
                  btn.style.height = '40px';
                  btn.style.border = '1px solid #d9d2ce';
                  btn.style.borderRadius = '8px';
                  btn.style.display = 'flex';
                  btn.style.alignItems = 'center';
                  btn.style.justifyContent = 'center';
                  btn.textContent = 'Continue with Google';
                  el.innerHTML = '';
                  el.appendChild(btn);
                }
              }
            }
          };
        `,
        });
      },
    );

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/login", { waitUntil: "networkidle" });
    await expect(
      page.getByRole("heading", { name: "Continue your journey" }),
    ).toBeVisible();

    const contrastReport = await page.evaluate(() => {
      function parseRgb(color: string): [number, number, number] {
        const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (!match) return [255, 255, 255];
        return [Number(match[1]), Number(match[2]), Number(match[3])];
      }
      function luminance([r, g, b]: [number, number, number]) {
        const srgb = [r, g, b].map((c) => {
          const v = c / 255;
          return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * srgb[0]! + 0.7152 * srgb[1]! + 0.0722 * srgb[2]!;
      }
      function contrast(fg: string, bg: string) {
        const l1 = luminance(parseRgb(fg));
        const l2 = luminance(parseRgb(bg));
        return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      }

      const submitBtn = Array.from(document.querySelectorAll("button")).find(
        (b) => b.textContent?.trim() === "Sign in",
      )!;
      const submitStyle = getComputedStyle(submitBtn);
      const emailLabel = document.querySelector('label[for="email"]')!;
      const labelStyle = getComputedStyle(emailLabel);
      return {
        submitContrast: contrast(
          submitStyle.color,
          submitStyle.backgroundColor,
        ),
        labelContrast: contrast(labelStyle.color, "rgb(255, 255, 255)"),
      };
    });
    expect(contrastReport.submitContrast).toBeGreaterThanOrEqual(4.5);
    expect(contrastReport.labelContrast).toBeGreaterThanOrEqual(4.5);

    await assertNoHorizontalOverflow(page, "login-desktop-1440x900");
    await assertBrokenImagesZero(page);
    await captureScreenshot(page, "02-login-desktop-1440x900.png");

    // Load /login directly at mobile 375x812
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/login", { waitUntil: "networkidle" });
    await assertNoHorizontalOverflow(page, "login-mobile-375x812");

    const googleWrapper = page.getByLabel("Sign in with Google");
    await expect(googleWrapper).toBeVisible();
    const box = await googleWrapper.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeLessThanOrEqual(350);
    expect(box!.x + box!.width).toBeLessThanOrEqual(375);
    expect(
      gsiUrls.some((url) => url.includes("hl=en")),
      "GSI script URL should request ?hl=en",
    ).toBe(true);

    await captureScreenshot(page, "03-login-mobile-375x812.png");
    hygiene.assertClean();
  });

  test("AC 9, AC 12 & AC 14: LearnerNav Practice by Part links to /listening-reading and GuideMascot is suppressed on active practice routes", async ({
    page,
  }) => {
    await stubPing(page);
    const hygiene = attachConsoleAndNetworkHygiene(page);
    const examId = "33333333-3333-4333-8333-333333333333";

    await page.route("**/api/auth/session", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "authenticated",
          user: {
            id: "u1",
            displayName: "Learner",
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
          id: "u1",
          displayName: "Learner",
          email: "learner@example.com",
          targetScore: 800,
          avatarUrl: null,
          hasPassword: true,
        }),
      });
    });
    await page.route(`**/api/lr/exams/${examId}*`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          examId,
          code: "ETS-2026-01",
          title: "ETS 2026 Test 01",
          versionNumber: 1,
          totalQuestions: 200,
          listeningQuestions: 100,
          readingQuestions: 100,
          durationMinutes: 120,
          minScaledScore: 10,
          maxScaledScore: 990,
          publishedAtUtc: "2026-11-18T00:00:00Z",
          activeAttemptId: null,
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
    await page.route("**/api/lr/**/items/item-1", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "item-1",
          part: 5,
          kind: "single",
          code: "P5-001",
          topic: "Grammar & Vocabulary",
          difficulty: "Medium",
          context: null,
          audioUrl: null,
          imageUrl: null,
          questions: [
            {
              id: "q-1",
              ordinal: 1,
              code: "Q1",
              prompt:
                "Ms. Tanaka ------- the quarterly budget report before Friday's meeting.",
              optionA: "reviewed",
              optionB: "reviewing",
              optionC: "reviews",
              optionD: "review",
            },
          ],
        }),
      });
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/exams/lr/${examId}`, { waitUntil: "domcontentloaded" });

    const practiceLink = page
      .locator("header, nav")
      .getByRole("link", { name: "Practice by Part" })
      .first();
    await expect(practiceLink).toBeVisible();
    await expect(practiceLink).toHaveAttribute("href", "/listening-reading");

    await Promise.all([
      page.waitForURL(/\/listening-reading$/),
      practiceLink.click(),
    ]);

    // Navigate to active L&R practice item route: GuideMascot must be suppressed (null)
    await page.goto("/reading/practice/5/item-1", {
      waitUntil: "domcontentloaded",
    });
    await expect(
      page.getByText(/Ms\. Tanaka ------- the quarterly budget report/),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Ask Mic how to use this page" }),
    ).toHaveCount(0);

    const submitContrast = await page.evaluate(() => {
      function parseRgb(color: string): [number, number, number] {
        const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (!match) return [255, 255, 255];
        return [Number(match[1]), Number(match[2]), Number(match[3])];
      }
      function luminance([r, g, b]: [number, number, number]) {
        const srgb = [r, g, b].map((c) => {
          const v = c / 255;
          return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * srgb[0]! + 0.7152 * srgb[1]! + 0.0722 * srgb[2]!;
      }
      const btn = Array.from(document.querySelectorAll("button")).find(
        (b) => b.textContent?.trim() === "Submit",
      )!;
      const s = getComputedStyle(btn);
      const l1 = luminance(parseRgb(s.color));
      const l2 = luminance(parseRgb(s.backgroundColor));
      return {
        bg: s.backgroundColor,
        ratio: (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05),
      };
    });
    expect(submitContrast.ratio).toBeGreaterThanOrEqual(4.5);

    await assertNoHorizontalOverflow(page, "lr-practice-desktop-1440x900");
    await assertBrokenImagesZero(page);
    await captureScreenshot(page, "04-lr-practice-desktop-1440x900.png");
    hygiene.assertClean();
  });

  test("AC 1: DataBankCenter modal uses Radix Dialog with focus trap, Escape close, and opener focus restoration", async ({
    page,
  }) => {
    test.skip(
      process.env.ADMIN_PREVIEW !== "true",
      "Requires ADMIN_PREVIEW=true to access /admin/exams without backend admin login",
    );
    await stubPing(page);
    const hygiene = attachConsoleAndNetworkHygiene(page);

    await page.route("**/api/admin/lr-exercise-bank/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          totalQuestionCount: 0,
          updatedAtUtc: "2026-11-18T00:00:00Z",
          parts: [],
        }),
      });
    });
    await page.route("**/api/admin/exams*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [],
          pageNumber: 1,
          pageSize: 20,
          totalCount: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        }),
      });
    });
    await page.route("**/api/admin/score-profiles", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/admin/exams?tab=tests", { waitUntil: "networkidle" });

    const opener = page.getByRole("button", { name: "Create new test" });
    await expect(opener).toBeVisible();
    await opener.click();

    const dialog = page.getByTestId("data-bank-modal");
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveRole("dialog");
    expect(await page.locator("dialog").count()).toBe(0);

    await assertNoHorizontalOverflow(page, "admin-databank-modal-1440x900");
    await captureScreenshot(page, "05-admin-databank-modal-1440x900.png");

    // Tab stays trapped inside Radix DialogContent
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press("Tab");
      const inside = await page.evaluate(() => {
        const modal = document.querySelector('[data-testid="data-bank-modal"]');
        return Boolean(modal && modal.contains(document.activeElement));
      });
      expect(inside).toBe(true);
    }

    // Escape closes and restores focus to opener
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(opener).toBeFocused();
    hygiene.assertClean();
  });
});
