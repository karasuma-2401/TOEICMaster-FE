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

async function mockHistory(
  page: Page,
  {
    listening = lrHistory,
    speaking = speakingHistory,
    writing = writingHistory,
  } = {},
) {
  await loginAsUser(page.context());
  const user = {
    id: "user-learner-01",
    displayName: "Learner User",
    email: "learner@example.com",
  };
  await page.route("**/api/auth/session", (route) =>
    route.fulfill({ json: { status: "authenticated", user } }),
  );
  await page.route("**/api/profile", (route) =>
    route.fulfill({ json: { ...user, avatarUrl: null } }),
  );
  await page.route("**/api/lr/exam-attempts/history*", (route) =>
    route.fulfill({
      json: {
        items: listening,
        totalCount: listening.length,
        pageIndex: 1,
        pageSize: 50,
      },
    }),
  );
  await page.route("**/api/speaking/attempts", (route) =>
    route.fulfill({
      json: {
        items: speaking,
        totalCount: speaking.length,
        pageNumber: 1,
        pageSize: 20,
        totalPages: 1,
      },
    }),
  );
  await page.route("**/api/writing/attempts", (route) =>
    route.fulfill({ json: { items: writing } }),
  );
}

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
        ...card.querySelectorAll("button, svg.recharts-surface text"),
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
      page,
    }) => {
      await mockHistory(page);

      await page.clock.install();
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
      const mic = page.getByRole("button", { name: /Mic/i });
      const guide = page.getByRole("region", { name: "User guide" });

      await expect(lr).toHaveAttribute("aria-selected", "true");
      await expect(mic).toBeVisible();
      await page.clock.runFor(1_000);
      await expect(guide).toBeHidden();
      await expect(mic).toHaveAttribute("aria-expanded", "false");
      await expect(canvas).toHaveAccessibleName(
        "Score progression line chart for Listening & Reading",
      );
      await expect(summary).toContainText("855 / 990");
      await expect(summary).toContainText("+45 vs prev");
      await expect(summary).toContainText("3 full tests");
      await expect(line).toHaveAttribute("stroke", "#1D4ED8");
      await expect(dots).toHaveCount(3);
      await expect(chart.getByTestId("score-progression-range")).toHaveCount(0);
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

      if (!mobile) {
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

      await mic.click();
      await expect(
        guide.getByRole("heading", { name: "Learning History" }),
      ).toBeVisible();
      await guide.getByRole("button", { name: "Close guide" }).click();
      await expect(guide).toBeHidden();
    });

    test("windows a dense score progression and keeps tooltips interactive", async ({
      page,
    }) => {
      const listening = Array.from({ length: 50 }, (_, index) => {
        const timestamp = new Date(
          Date.UTC(2026, 9, index + 1, 10),
        ).toISOString();
        return {
          ...lrHistory[0],
          attemptId: `11111111-1111-4111-8111-1111111111${index + 20}`,
          examTitle: `Dense Test ${index + 1}`,
          startedAtUtc: timestamp,
          submittedAtUtc: timestamp,
          listeningScaledScore: 320 + index * 3,
          readingScaledScore: 360 + (index % 4) * 10,
          totalScaledScore: 680 + index * 3 + (index % 4) * 10,
        };
      }).reverse();
      const speaking = Array.from({ length: 14 }, (_, index) => ({
        ...speakingHistory[0],
        id: `speaking-dense-${index + 1}`,
        estimatedScore: 120 + index,
        submittedAtUtc: new Date(
          Date.UTC(2026, 9, index + 1, 10),
        ).toISOString(),
      }));
      await mockHistory(page, { listening, speaking, writing: [] });
      await page.goto("/history");

      const chart = page.getByRole("region", { name: "Score progression" });
      const canvas = chart.getByTestId("score-progression-canvas");
      const dots = canvas.locator("circle.recharts-line-dot");
      const ticks = canvas.locator(".recharts-xAxis-tick-labels text");
      const summary = chart.getByTestId("score-progression-summary");
      const range = chart.getByRole("group", { name: "Chart attempt range" });
      await expect(range).toHaveAttribute(
        "data-testid",
        "score-progression-range",
      );
      const lastTen = range.getByRole("button", { name: "Last 10" });
      const lastTwentyFive = range.getByRole("button", { name: "Last 25" });
      const all = range.getByRole("button", { name: "All (50)" });
      await expect(lastTen).toHaveAttribute(
        "data-testid",
        "score-progression-range-10",
      );
      await expect(lastTwentyFive).toHaveAttribute(
        "data-testid",
        "score-progression-range-25",
      );
      await expect(all).toHaveAttribute(
        "data-testid",
        "score-progression-range-all",
      );
      const line = canvas.locator("path.recharts-line-curve");

      await expect(lastTen).toHaveAttribute("aria-pressed", "true");
      await expect(dots).toHaveCount(10);
      await expect(ticks.first()).toHaveText(/^10[/-]11$/);
      await expect(ticks.last()).toHaveText(/^19[/-]11$/);
      await expect(summary).toContainText("Showing last 10 of 50 full tests");
      await expectCleanGeometry(page, chart);
      if (mobile) {
        const mic = page.getByRole("button", { name: /Mic/i });
        await expect
          .poll(async () => {
            const plot = await line.boundingBox();
            const button = await mic.boundingBox();
            return Boolean(plot && button && plot.x + plot.width < button.x);
          })
          .toBe(true);
        for (const button of [lastTen, lastTwentyFive, all]) {
          const bounds = await button.boundingBox();
          expect(bounds?.width).toBeGreaterThanOrEqual(44);
          expect(bounds?.height).toBeGreaterThanOrEqual(44);
        }
      }
      await capture(
        page,
        mobile
          ? "edge-cases/edge-05-dense-50-last10-mobile.png"
          : "edge-cases/edge-03-dense-50-last10-desktop.png",
      );

      await all.click();
      await expect(all).toHaveAttribute("aria-pressed", "true");
      await expect(dots).toHaveCount(0);
      await expect(ticks.first()).toHaveText(/^01[/-]10$/);
      await expect(ticks.last()).toHaveText(/^19[/-]11$/);
      await expect(summary).toContainText("50 full tests");
      await expect(summary).not.toContainText("Showing last");
      await expectCleanGeometry(page, chart);
      expect(
        await ticks.evaluateAll((labels) => {
          const boxes = labels.map((label) => label.getBoundingClientRect());
          return boxes
            .slice(1)
            .every((box, index) => box.left >= boxes[index].right);
        }),
      ).toBe(true);
      await capture(
        page,
        mobile
          ? "edge-cases/edge-06-dense-50-all-mobile.png"
          : "edge-cases/edge-04-dense-50-all-desktop.png",
      );

      await lastTwentyFive.click();
      await expect(dots).toHaveCount(0);
      await expect(ticks.first()).toHaveText(/^26[/-]10$/);
      await expect(summary).toContainText("Showing last 25 of 50 full tests");
      const surface = canvas.locator("svg.recharts-surface");
      await surface.scrollIntoViewIfNeeded();
      await page.mouse.move(0, 0);
      await surface.focus();
      const tooltip = chart.getByTestId("score-progression-tooltip");
      await expect(tooltip).toContainText("Dense Test 26");
      await expect(canvas.locator(".recharts-active-dot circle")).toBeVisible();
      await page.keyboard.press("ArrowRight");
      await expect(tooltip).toContainText("Dense Test 27");

      await chart.getByRole("tab", { name: "Speaking (0-200)" }).click();
      await expect(lastTwentyFive).toHaveCount(0);
      await expect(
        range.getByRole("button", { name: "All (14)" }),
      ).toHaveAttribute("aria-pressed", "true");
      await expect(dots).toHaveCount(14);
      await expect(summary).toContainText("14 full tests");
      await expect(page.getByRole("article")).toHaveCount(9);
      await expectCleanGeometry(page, chart);
      if (!mobile)
        await capture(page, "edge-cases/edge-07-moderate-14-all-desktop.png");
    });
  });
}

test.describe("Desktop history score progression edge states", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  for (const total of [0, 1]) {
    test(`keeps the chart empty with ${total} scored full tests`, async ({
      page,
    }) => {
      await mockHistory(page, {
        listening: lrHistory.slice(0, total),
        speaking: speakingHistory.filter(({ mode }) => mode !== "FULL"),
        writing: writingHistory.filter(({ isPractice }) => isPractice),
      });
      await page.goto("/history");
      const chart = page.getByRole("region", { name: "Score progression" });
      await expect(chart.getByTestId("score-progression-empty")).toBeVisible();
      await expect(chart.getByTestId("score-progression-canvas")).toHaveCount(
        0,
      );
      await expect(page.getByRole("article")).toHaveCount(total + 2);
      await capture(
        page,
        total === 0
          ? "edge-cases/edge-01-zero-attempts-empty.png"
          : "edge-cases/edge-02-single-attempt-insufficient.png",
      );
    });
  }

  test("plots 0 and 990 in chronological order on the same day", async ({
    page,
  }) => {
    const listening = [990, 0].map((score, index) => ({
      ...lrHistory[index],
      listeningScaledScore: score / 2,
      readingScaledScore: score / 2,
      totalScaledScore: score,
      startedAtUtc: `2026-11-18T0${9 - index}:00:00Z`,
      submittedAtUtc: `2026-11-18T0${9 - index}:30:00Z`,
    }));
    await mockHistory(page, { listening, speaking: [], writing: [] });
    await page.goto("/history");
    const chart = page.getByRole("region", { name: "Score progression" });
    const canvas = chart.getByTestId("score-progression-canvas");
    await expect(canvas.getByText("0", { exact: true })).toBeVisible();
    await expect(canvas.getByText("990", { exact: true })).toBeVisible();
    const dots = canvas.locator("circle.recharts-line-dot");
    await expect(dots).toHaveCount(2);
    const bottom = await dots.first().boundingBox();
    const top = await dots.last().boundingBox();
    if (!bottom || !top)
      throw new Error("Expected both score dots to be visible");
    expect(bottom.x).toBeLessThan(top.x);
    expect(bottom.y).toBeGreaterThan(top.y);
    await expectCleanGeometry(page, chart);
    await capture(page, "edge-cases/edge-08-boundary-scores-same-day.png");
  });

  test("hides the chart for a guest", async ({ page }) => {
    await page.route(
      /\/api\/(auth\/(session|refresh)|lr\/exam-attempts\/history|speaking\/attempts|writing\/attempts)\b/,
      (route) => route.fulfill({ status: 401, json: {} }),
    );
    await page.goto("/history");
    await expect(
      page.getByText("Sign in to view your attempt history"),
    ).toBeVisible();
    await expect(page.getByTestId("score-progression-chart")).toHaveCount(0);
    await capture(page, "edge-cases/edge-09-guest-hidden.png");
  });
});
