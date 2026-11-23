import { test, expect } from "@playwright/test";
import path from "node:path";
import {
  MockWritingAdminBackend,
  FIXTURES_DIR,
  loginAsAdmin,
} from "./admin-writing-helpers";

test.describe("Admin Writing - Exercise Bank (/admin/content/writing)", () => {
  let backend: MockWritingAdminBackend;

  test.beforeEach(async ({ page, context }) => {
    await loginAsAdmin(context);
    backend = new MockWritingAdminBackend();
    await backend.setupRoutes(page);
    await page.goto("/admin/content/writing/part-1");
    await expect(
      page.getByRole("heading", { name: "Writing Part 1" }),
    ).toBeVisible();
  });

  test("TC-CONTENT-01: Displays exercise list and switches tabs between Part 1, Part 2, Part 3", async ({
    page,
  }) => {
    // Part 1 tab is selected by default
    await expect(page.getByText("WP1-SEED-01")).toBeVisible();
    await expect(page.getByText("Office Workspace")).toBeVisible();

    // Switch to Part 2
    await page.getByRole("link", { name: /Part 2/ }).click();
    await expect(
      page.getByRole("heading", { name: "Writing Part 2" }),
    ).toBeVisible();
    await expect(page.getByText("WP2-SEED-01")).toBeVisible();
    await expect(page.getByText("Customer Meeting")).toBeVisible();

    // Switch to Part 3
    await page.getByRole("link", { name: /Part 3/ }).click();
    await expect(
      page.getByRole("heading", { name: "Writing Part 3" }),
    ).toBeVisible();
    await expect(page.getByText("WP3-SEED-01")).toBeVisible();
    await expect(page.getByText("Remote Work Opinion")).toBeVisible();
  });

  test("TC-CONTENT-02: Filters exercises by search keyword and status", async ({
    page,
  }) => {
    // Search exercises
    const searchInput = page.getByLabel("Search Writing exercises");
    await searchInput.fill("Office");
    await expect(page.getByText("WP1-SEED-01")).toBeVisible();

    await searchInput.fill("Nonexistent");
    await expect(page.getByText("WP1-SEED-01")).not.toBeVisible();
    await expect(page.getByText("No matching exercises found")).toBeVisible();

    // Clear search and filter by status
    await searchInput.clear();
    await page.getByLabel("Filter by status").selectOption("DRAFT");
    await expect(page.getByText("No matching exercises found")).toBeVisible();

    await page.getByLabel("Filter by status").selectOption("PUBLISHED");
    await expect(page.getByText("WP1-SEED-01")).toBeVisible();
  });

  test("TC-CONTENT-03: Adds new Part 1 exercise successfully (Happy Path: Complete info & image upload)", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "+ Add exercise" }).click();
    const dialog = page.getByRole("dialog", { name: "Writing exercise form" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("WRITING PART 1")).toBeVisible();

    // Fill general information
    await dialog.getByLabel("Exercise code *").fill("WP1-NEW-01");
    await dialog.getByLabel("Topic *").fill("Office Meeting Room");
    await dialog.getByLabel("Difficulty").selectOption("Medium");

    // Upload valid prompt image
    const validImage = path.join(FIXTURES_DIR, "valid-sample.png");
    await dialog.locator('input[type="file"]').setInputFiles(validImage);
    await expect(dialog.getByText("valid-sample.png")).toBeVisible();

    // Fill Part 1 keywords
    await dialog.getByLabel("Keyword 1 *").fill("colleagues");
    await dialog.getByLabel("Keyword 2 *").fill("discuss");
    await dialog
      .getByLabel("Image alt text")
      .fill("Colleagues discussing in a meeting room");

    // Save exercise
    await dialog.getByRole("button", { name: "Save exercise" }).click();

    // Success notice and exercise appears in table
    await expect(dialog).not.toBeVisible();
    await expect(page.getByText("Exercise saved.")).toBeVisible();
    await expect(page.getByText("WP1-NEW-01")).toBeVisible();
  });

  test("TC-CONTENT-04: Fails to add Part 1 exercise when required fields are missing (Validation Error)", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "+ Add exercise" }).click();
    const dialog = page.getByRole("dialog", { name: "Writing exercise form" });

    // 1. When image and keywords are not filled (default code WP1-NEW is prefilled)
    await dialog.getByRole("button", { name: "Save exercise" }).click();
    await expect(dialog.getByRole("alert")).toContainText(
      "Part 1 requires an image and two keywords.",
    );

    // 2. Clear exercise code -> Reports error that code and topic are required
    await dialog.getByLabel("Exercise code *").clear();
    await dialog.getByRole("button", { name: "Save exercise" }).click();
    await expect(dialog.getByRole("alert")).toContainText(
      "Exercise code and topic are required.",
    );
  });

  test("TC-CONTENT-05: Part 1 image upload - Blocks invalid file format (.txt)", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "+ Add exercise" }).click();
    const dialog = page.getByRole("dialog", { name: "Writing exercise form" });

    await dialog.getByLabel("Exercise code *").fill("WP1-INVALID-FMT");
    await dialog.getByLabel("Topic *").fill("Test Format");
    await dialog.getByLabel("Keyword 1 *").fill("key1");
    await dialog.getByLabel("Keyword 2 *").fill("key2");

    // Upload .txt file instead of an image
    const invalidFile = path.join(FIXTURES_DIR, "invalid-format.txt");
    await dialog.locator('input[type="file"]').setInputFiles(invalidFile);
    await dialog.getByRole("button", { name: "Save exercise" }).click();

    // System displays invalid image format error
    await expect(dialog.getByRole("alert")).toContainText(
      "Invalid image format",
    );
  });

  test("TC-CONTENT-06: Part 1 image upload - Blocks file exceeding size limit (> 5MB)", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "+ Add exercise" }).click();
    const dialog = page.getByRole("dialog", { name: "Writing exercise form" });

    await dialog.getByLabel("Exercise code *").fill("WP1-OVERSIZED");
    await dialog.getByLabel("Topic *").fill("Test Size");
    await dialog.getByLabel("Keyword 1 *").fill("big");
    await dialog.getByLabel("Keyword 2 *").fill("file");

    // Upload file > 5MB
    const oversizedImage = path.join(FIXTURES_DIR, "oversized-image.png");
    await dialog.locator('input[type="file"]').setInputFiles(oversizedImage);
    await dialog.getByRole("button", { name: "Save exercise" }).click();

    // System displays file size exceeds 5 MiB error
    await expect(dialog.getByRole("alert")).toContainText("exceeds 5 MiB");
  });

  test("TC-CONTENT-07: Adds new Part 2 exercise successfully and checks validation when fields are missing", async ({
    page,
  }) => {
    // Switch to Part 2 tab
    await page.getByRole("link", { name: /Part 2/ }).click();
    await expect(
      page.getByRole("heading", { name: "Writing Part 2" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "+ Add exercise" }).click();
    const dialog = page.getByRole("dialog", { name: "Writing exercise form" });
    await expect(dialog.getByText("WRITING PART 2")).toBeVisible();

    // 1. Check validation when fields are missing
    await dialog.getByLabel("Exercise code *").fill("WP2-NEW-01");
    await dialog.getByLabel("Topic *").fill("Supplier Delay");
    await dialog.getByRole("button", { name: "Save exercise" }).click();
    await expect(dialog.getByRole("alert")).toContainText(
      "Part 2 requires the complete prompt email and response directions.",
    );

    // 2. Fill complete Part 2 details
    await dialog.getByLabel("From *").fill("purchasing@company.com");
    await dialog.getByLabel("To *").fill("vendor@supplier.com");
    await dialog.getByLabel("Subject *").fill("Order Delivery Status");
    await dialog
      .getByLabel("Email body *")
      .fill("When will batch #902 be shipped?");
    await dialog
      .getByLabel("Response directions *")
      .fill("Apologize and provide the tracking code.");

    // Click save
    await dialog.getByRole("button", { name: "Save exercise" }).click();
    await expect(dialog).not.toBeVisible();
    await expect(page.getByText("Exercise saved.")).toBeVisible();
    await expect(page.getByText("WP2-NEW-01")).toBeVisible();
  });

  test("TC-CONTENT-08: Adds new Part 3 exercise successfully and checks validation when prompt is missing", async ({
    page,
  }) => {
    // Switch to Part 3 tab
    await page.getByRole("link", { name: /Part 3/ }).click();
    await expect(
      page.getByRole("heading", { name: "Writing Part 3" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "+ Add exercise" }).click();
    const dialog = page.getByRole("dialog", { name: "Writing exercise form" });
    await expect(dialog.getByText("WRITING PART 3")).toBeVisible();

    // 1. Check validation when prompt is missing
    await dialog.getByLabel("Exercise code *").fill("WP3-NEW-01");
    await dialog.getByLabel("Topic *").fill("Higher Education");
    await dialog.getByRole("button", { name: "Save exercise" }).click();
    await expect(dialog.getByRole("alert")).toContainText(
      "Part 3 requires a prompt and minimum word count.",
    );

    // 2. Fill complete Part 3 details
    await dialog
      .getByLabel("Essay prompt *")
      .fill("Should university education be free for all students?");
    await dialog.getByLabel("Minimum word count *").fill("300");
    await dialog
      .getByLabel("Suggested outline")
      .fill("1. Intro\n2. Social equity\n3. Fiscal impact\n4. Conclusion");

    await dialog.getByRole("button", { name: "Save exercise" }).click();
    await expect(dialog).not.toBeVisible();
    await expect(page.getByText("Exercise saved.")).toBeVisible();
    await expect(page.getByText("WP3-NEW-01")).toBeVisible();
  });

  test("TC-CONTENT-09: Edits existing exercise successfully", async ({
    page,
  }) => {
    // Click "Edit" button on the first row of Part 1
    const firstRow = page.locator("tbody tr").first();
    await firstRow.getByRole("button", { name: "Edit" }).click();

    const dialog = page.getByRole("dialog", { name: "Writing exercise form" });
    await expect(dialog).toBeVisible();

    // Edit topic
    const topicInput = dialog.getByLabel("Topic *");
    await topicInput.clear();
    await topicInput.fill("Updated Office Workspace");

    await dialog.getByRole("button", { name: "Save exercise" }).click();
    await expect(dialog).not.toBeVisible();
    await expect(page.getByText("Exercise saved.")).toBeVisible();
    await expect(page.getByText("Updated Office Workspace")).toBeVisible();
  });

  test("TC-CONTENT-10: Deletes/Archives existing exercise successfully", async ({
    page,
  }) => {
    // Register confirm dialog auto-accept
    page.on("dialog", (dialog) => dialog.accept());

    const firstRow = page.locator("tbody tr").first();
    await firstRow.getByRole("button", { name: "Archive" }).click();

    await expect(page.getByText("Exercise archived.")).toBeVisible();
  });

  test("TC-CONTENT-11: Imports single Part 1 exercises via valid Excel (.xlsx) file", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "⇧ Import Excel" }).click();
    const dialog = page.getByRole("dialog", { name: "Import Writing Excel" });
    await expect(dialog).toBeVisible();

    // Select valid Excel file
    const validFile = path.join(FIXTURES_DIR, "valid-part1-exercise.xlsx");
    await dialog
      .locator('input[type="file"][accept=".xlsx"]')
      .setInputFiles(validFile);

    // Preview table displays valid rows
    await expect(dialog.getByText("Valid").first()).toBeVisible();

    // Import button is enabled
    const importBtn = dialog.getByRole("button", { name: "Import exercises" });
    await expect(importBtn).toBeEnabled();
    await importBtn.click();

    // Success closes modal and shows notice
    await expect(dialog).not.toBeVisible();
    await expect(
      page.getByText("Exercises imported successfully."),
    ).toBeVisible();
  });

  test("TC-CONTENT-12: Fails to import single exercises when Excel file is missing required columns", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "⇧ Import Excel" }).click();
    const dialog = page.getByRole("dialog", { name: "Import Writing Excel" });

    // Select Excel file missing columns
    const invalidFile = path.join(
      FIXTURES_DIR,
      "invalid-part1-missing-cols.xlsx",
    );
    await dialog
      .locator('input[type="file"][accept=".xlsx"]')
      .setInputFiles(invalidFile);

    // Preview table displays errors
    await expect(dialog.getByText("Missing Difficulty.")).toBeVisible();

    // Import button is disabled
    const importBtn = dialog.getByRole("button", { name: "Import exercises" });
    await expect(importBtn).toBeDisabled();
  });
});
