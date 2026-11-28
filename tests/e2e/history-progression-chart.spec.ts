import { expect, test, type Locator, type Page } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { loginAsUser } from "./learner-writing-helpers";

const lrHistory = [
  { day: 18, listening: 445, reading: 410 },
  { day: 14, listening: 420, reading: 390 },
  { day: 10, listening: 400, reading: 390 },
].map(({ day, listening, reading }) => ({
  attemptId: `11111111-1111-4111-8111-1111111111${day}`,
  examId: "11111111-1111-4111-8111-111111111100",
  examTitle: `ETS Practice Test ${day}`,
  examCode: `ETS-${day}`,
  status: 2,
  listeningScaledScore: listening,
  readingScaledScore: reading,
  totalScaledScore: listening + reading,
  isTimeExpired: false,
  startedAtUtc: `2026-11-${day}T08:00:00Z`,
  submittedAtUtc: `2026-11-${day}T10:00:00Z`,
  durationSeconds: 7000,
}));

const speakingHistory = [
  { day: 17, mode: "FULL", score: 150 },
  { day: 13, mode: "PART_2", score: 185 },
  { day: 11, mode: "FULL", score: 160 },
].map(({ day, mode, score }) => ({
  id: `speaking-${day}`,
  testId: "speaking-test",
  testCode: `SPK-${day}`,
  testTitle: `Speaking Test ${day}`,
  mode,
  status: "SUBMITTED",
  questionCount: mode === "FULL" ? 11 : 2,
  estimatedScore: score,
  evaluationStatus: "COMPLETED",
  createdAtUtc: `2026-11-${day}T08:00:00Z`,
  submittedAtUtc: `2026-11-${day}T09:00:00Z`,
}));

const writingHistory = [
  { day: 16, mode: "FULL", score: 160 },
  { day: 12, mode: "PART_1", score: 12 },
].map(({ day, mode, score }) => ({
  id: `writing-${day}`,
  testId: "writing-test",
  testCode: `WR-${day}`,
  testTitle: `Writing Test ${day}`,
  isPractice: mode !== "FULL",
  mode,
  status: "SUBMITTED_AWAITING_EVALUATION",
  questionCount: mode === "FULL" ? 8 : 5,
  currentQuestionPosition: null,
  estimatedScore: mode === "FULL" ? score : null,
  rawScore: mode === "PART_1" ? score : null,
  maxRawScore: mode === "PART_1" ? 15 : null,
  evaluationStatus: "COMPLETED",
  createdAtUtc: `2026-11-${day}T08:00:00Z`,
  submittedAtUtc: `2026-11-${day}T09:00:00Z`,
  updatedAtUtc: `2026-11-${day}T09:00:01Z`,
}));

async function capture(page: Page, filename: string) {
  const directory = process.env.PIPELINE_SCREENSHOTS_DIR;
  if (!directory) return;

  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    animations: "disabled",
    fullPage: true,
    path: join(directory, filename),
  });
}

async function expectCleanGeometry(page: Page, chart: Locator) {
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    ),
  ).toBeLessThanOrEqual(0);
  expect(
    await chart.evaluate((card) => {
      const bounds = card.getBoundingClientRect();
      return [
        ...card.querySelectorAll("[role=tab], svg.recharts-surface text"),
      ].every((element) => {
        const box = element.getBoundingClientRect();
        return box.left >= bounds.left && box.right <= bounds.right;
      });
    }),
  ).toBe(true);
  await expect
    .poll(() =>
      page.evaluate(() =>
        Array.from(document.images)
          .filter((image) => !image.complete || image.naturalWidth === 0)
          .map((image) => image.currentSrc),
      ),
    )
    .toEqual([]);
  await expect(chart).not.toContainText(
    /\b(?:undefined|null|NaN)\b|\[object Object\]/,
  );
}

for (const { name, viewport, mobile } of [
  { name: "Desktop", viewport: { width: 1440, height: 900 }, mobile: false },
  { name: "Mobile", viewport: { width: 390, height: 844 }, mobile: true },
]) {
  test.describe(`${name} history score progression`, () => {
    test.use({ viewport, isMobile: mobile, hasTouch: mobile });

    test("separates full-test trends and synchronizes skill filters", async ({
      context,
      page,
    }) => {
      await loginAsUser(context);
      const user = {
        id: "user-learner-01",
        displayName: "Learner User",
        email: "learner@example.com",
      };
      await page.route("**/api/auth/session", (route) =>
        route.fulfill({
          json: { status: "authenticated", user },
        }),
      );
      await page.route("**/api/profile", (route) =>
        route.fulfill({ json: { ...user, avatarUrl: null } }),
      );
      await page.route("**/api/lr/exam-attempts/history*", (route) =>
        route.fulfill({
          json: {
            items: lrHistory,
            totalCount: lrHistory.length,
            pageIndex: 1,
            pageSize: 50,
          },
        }),
      );
      await page.route("**/api/speaking/attempts", (route) =>
        route.fulfill({
          json: {
            items: speakingHistory,
            totalCount: speakingHistory.length,
            pageNumber: 1,
            pageSize: 20,
            totalPages: 1,
          },
        }),
      );
      await page.route("**/api/writing/attempts", (route) =>
        route.fulfill({ json: { items: writingHistory } }),
      );

      await page.goto("/history");
      const chart = page.getByRole("region", { name: "Score progression" });
      const canvas = chart.getByTestId("score-progression-canvas");
      const tabs = chart.getByRole("tablist", {
        name: "Score progression skill",
      });
      const lr = tabs.getByRole("tab", { name: "L&R (0-990)" });
      const speaking = tabs.getByRole("tab", { name: "Speaking (0-200)" });
      const writing = tabs.getByRole("tab", { name: "Writing (0-200)" });
      const summary = chart.getByTestId("score-progression-summary");
      const filters = page.getByRole("group", {
        name: "Filter history by skill",
      });
      const cards = page.getByRole("article");
      const line = canvas.locator(
        "svg.recharts-surface path.recharts-line-curve",
      );
      const dots = canvas.locator("circle.recharts-line-dot");

      await expect(lr).toHaveAttribute("aria-selected", "true");
      await expect(canvas).toHaveAccessibleName(
        "Score progression line chart for Listening & Reading",
      );
      await expect(summary).toContainText("855 / 990");
      await expect(summary).toContainText("+45 vs prev");
      await expect(summary).toContainText("3 full tests");
      await expect(line).toHaveAttribute("stroke", "#1D4ED8");
      await expect(dots).toHaveCount(3);
      await expect(canvas.getByText("990", { exact: true })).toBeVisible();
      await expect(cards).toHaveCount(8);
      expect(
        await chart.evaluate((card) => {
          const firstAttempt = card.parentElement?.querySelector("article");
          return (
            firstAttempt !== null &&
            firstAttempt !== undefined &&
            Boolean(
              card.compareDocumentPosition(firstAttempt) &
              Node.DOCUMENT_POSITION_FOLLOWING,
            )
          );
        }),
      ).toBe(true);
      await expectCleanGeometry(page, chart);
      if (mobile) {
        for (const tab of [lr, speaking, writing]) {
          const bounds = await tab.boundingBox();
          expect(bounds?.width).toBeGreaterThanOrEqual(44);
          expect(bounds?.height).toBeGreaterThanOrEqual(44);
        }
      }
      await capture(
        page,
        mobile
          ? "02-mobile-default-390x844.png"
          : "01-desktop-default-1440x900.png",
      );
      const evidenceDirectory = process.env.PIPELINE_SCREENSHOTS_DIR;
      if (evidenceDirectory) {
        await writeFile(
          join(evidenceDirectory, `${name.toLowerCase()}-chart-aria.yml`),
          await chart.ariaSnapshot(),
        );
      }

      if (mobile) {
        await page.getByRole("button", { name: "Close guide" }).click();
        await capture(page, "05-mobile-after-closing-guide.png");
      } else {
        await dots.first().hover();
        const tooltip = chart.getByTestId("score-progression-tooltip");
        await expect(tooltip).toContainText("ETS Practice Test 10");
        await expect(tooltip).toContainText("790 / 990");
        await expect(tooltip).toContainText("L 400 · R 390");
        await expect(tooltip.locator("time")).toHaveAttribute(
          "datetime",
          "2026-11-10T10:00:00Z",
        );
      }

      await speaking.click();
      await expect(speaking).toHaveAttribute("aria-selected", "true");
      await expect(
        filters.getByRole("button", { name: "All" }),
      ).toHaveAttribute("aria-pressed", "true");
      await expect(cards).toHaveCount(8);
      await expect(canvas.getByText("200", { exact: true })).toBeVisible();
      await expect(canvas.getByText("990", { exact: true })).toHaveCount(0);
      await expect(line).toHaveAttribute("stroke", "#7E22CE");
      await expect(dots).toHaveCount(2);
      await expect(summary).toContainText("-10 vs prev");
      await expectCleanGeometry(page, chart);
      if (!mobile) await capture(page, "03-interactive-speaking-tab.png");

      await filters.getByRole("button", { name: "L&R" }).click();
      await expect(lr).toHaveAttribute("aria-selected", "true");
      await expect(cards).toHaveCount(3);
      await writing.click();
      await expect(writing).toHaveAttribute("aria-selected", "true");
      await expect(
        filters.getByRole("button", { name: "Writing" }),
      ).toHaveAttribute("aria-pressed", "true");
      await expect(cards).toHaveCount(2);
      await expect(chart.getByTestId("score-progression-empty")).toHaveText(
        "Complete at least 2 scored full tests in this skill to view your score trend.",
      );
      await expect(canvas).toHaveCount(0);
      await expectCleanGeometry(page, chart);
      if (!mobile) await capture(page, "04-empty-writing-state.png");
    });
  });
}
