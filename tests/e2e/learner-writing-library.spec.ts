import { test, expect } from "@playwright/test";
import {
  MockWritingLearnerBackend,
  loginAsUser,
} from "./learner-writing-helpers";

test.describe("Learner Writing - Test Library, Overview & Practice (/writing)", () => {
  let backend: MockWritingLearnerBackend;

  test.beforeEach(async ({ page, context }) => {
    backend = new MockWritingLearnerBackend();
    await backend.setupRoutes(page);
    await loginAsUser(context);
  });

  test("TC-LEARN-01: Writing test library (/writing) - Displays published Full Tests and supports search", async ({
    page,
  }) => {
    await page.goto("/writing");
    await expect(
      page.getByRole("heading", { name: "Writing Tests", level: 1 }),
    ).toBeVisible();

    // Display Full tests
    const catalog = page.locator(
      'section[aria-labelledby="exam-library-count"]',
    );
    await expect(
      catalog.getByRole("heading", {
        name: "TOEIC Writing Simulation Test 01",
        level: 3,
      }),
    ).toBeVisible();
    await expect(
      catalog.getByRole("heading", {
        name: "TOEIC Writing Simulation Test 02",
        level: 3,
      }),
    ).toBeVisible();

    // Search test by code
    const searchInput = page.getByPlaceholder("Search Writing tests...");
    await searchInput.fill("WT-PUB-FULL-01");
    await expect(
      catalog.getByRole("heading", {
        name: "TOEIC Writing Simulation Test 01",
        level: 3,
      }),
    ).toBeVisible();
    await expect(
      catalog.getByRole("heading", {
        name: "TOEIC Writing Simulation Test 02",
        level: 3,
      }),
    ).not.toBeVisible();
  });

  test("TC-LEARN-02: Writing test library (/writing) - Opens practice page and switches between Parts", async ({
    page,
  }) => {
    await page.goto("/writing");

    await page.getByRole("link", { name: "Exercises", exact: true }).click();
    await expect(page).toHaveURL(/\/writing\/practice\/1/);
    await expect(
      page.getByRole("heading", { name: "Writing Exercises", level: 1 }),
    ).toBeVisible();

    // Verify 3 Parts
    await expect(
      page.getByRole("link", {
        name: "Part 1 · Write sentences based on pictures",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Part 3 · Write an opinion essay" }),
    ).toBeVisible();

    await page
      .getByRole("link", { name: "Part 2 · Respond to an email" })
      .click();
    await expect(page).toHaveURL(/\/writing\/practice\/2/);
  });

  test("TC-LEARN-03: Test overview (/writing/tests/[id]) - Displays test overview and per-part timing before starting", async ({
    page,
  }) => {
    await page.goto("/writing/tests/test-pub-01");

    // Display test title and stats
    await expect(
      page.getByRole("heading", { name: "TOEIC Writing Simulation Test 01" }),
    ).toBeVisible();
    await expect(page.getByText("8 questions", { exact: true })).toBeVisible();

    // Display per-part structure
    await expect(
      page.getByText("Part 1 · Write sentences based on pictures"),
    ).toBeVisible();
    await expect(page.getByText("Part 2 · Respond to an email")).toBeVisible();
    await expect(page.getByText("Part 3 · Opinion essay")).toBeVisible();

    // Start test button
    const startBtn = page.getByRole("button", {
      name: "START WRITING TEST",
    });
    await expect(startBtn).toBeDisabled();
    await page.getByRole("checkbox").check();
    await expect(startBtn).toBeEnabled();
  });

  test("TC-LEARN-04: Test overview (/writing/tests/[id]) - Starting the test redirects to the virtual exam room", async ({
    page,
  }) => {
    await page.goto("/writing/tests/test-pub-01");

    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "START WRITING TEST" }).click();

    // Redirects to virtual exam room /writing/attempts/[id]
    await expect(page).toHaveURL(/\/writing\/attempts\/att-test-/);
    await expect(
      page.getByText("TOEIC Writing Simulation Test 01"),
    ).toBeVisible();
  });

  test("TC-LEARN-05: Single exercise practice (/writing/practice/[part]) - Displays untimed single exercises", async ({
    page,
  }) => {
    await page.goto("/writing/practice/1");
    await expect(
      page.getByRole("heading", { name: "Writing Exercises", level: 1 }),
    ).toBeVisible();

    // Display Part 1 exercises list
    await expect(page.getByText("Coffee Break Discussion")).toBeVisible();

    // Start practicing an exercise
    await page
      .locator("article", { hasText: "Coffee Break Discussion" })
      .getByRole("button", { name: "Practice Writing" })
      .click();

    // Opens exam room in untimed practice mode
    await expect(page).toHaveURL(/\/writing\/attempts\/att-prac-/);
    await expect(page.getByText("Untimed practice")).toBeVisible();
  });

  test("TC-LEARN-06: Attempt history (/history/writing) - Views completed attempts and reopens results", async ({
    page,
  }) => {
    await page.goto("/history/writing");
    await expect(
      page.getByRole("heading", { name: "Your attempts" }),
    ).toBeVisible();

    // Display completed attempt in list
    await expect(
      page.getByText("TOEIC Writing Simulation Test 01").first(),
    ).toBeVisible();
    await expect(page.getByText("AI estimate 170/200")).toBeVisible();

    // Click "View status" to open detailed report
    await page.getByRole("link", { name: "View status" }).first().click();
    await expect(page).toHaveURL(
      /\/writing\/attempts\/att-completed-01\/result/,
    );
    await expect(
      page.getByRole("heading", { name: "Writing Results" }),
    ).toBeVisible();
  });
});
