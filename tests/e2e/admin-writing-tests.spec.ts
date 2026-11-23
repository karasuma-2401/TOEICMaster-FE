import { test, expect } from "@playwright/test";
import path from "node:path";
import {
  MockWritingAdminBackend,
  FIXTURES_DIR,
  chooseFilter,
  loginAsAdmin,
} from "./admin-writing-helpers";

test.describe("Admin Writing - Standalone Writing Tests Management (/admin/tests/writing)", () => {
  let backend: MockWritingAdminBackend;

  test.beforeEach(async ({ page, context }) => {
    await loginAsAdmin(context);
    backend = new MockWritingAdminBackend();
    await backend.setupRoutes(page);
    await page.goto("/admin/tests/writing");
    await expect(
      page.getByRole("heading", { name: "Writing Tests" }),
    ).toBeVisible();
  });

  test("TC-TEST-01: Displays standalone tests list, searches, and filters by status", async ({
    page,
  }) => {
    const tableBody = page.locator("tbody");

    // Check initial tests list
    await expect(tableBody.getByText("WT-DRAFT-01")).toBeVisible();
    await expect(tableBody.getByText("WT-PUB-01")).toBeVisible();
    await expect(tableBody.getByText("WT-ARC-01")).toBeVisible();

    // Filter by search keyword
    const searchInput = page.getByLabel("Search Writing tests");
    await searchInput.fill("PUB");
    await expect(tableBody.getByText("WT-PUB-01")).toBeVisible();
    await expect(tableBody.getByText("WT-DRAFT-01")).not.toBeVisible();

    // Filter by Published status
    await searchInput.clear();
    await chooseFilter(page, /^Filter by test status/, "Published");
    await expect(tableBody.getByText("WT-PUB-01")).toBeVisible();
    await expect(tableBody.getByText("WT-DRAFT-01")).not.toBeVisible();

    // Filter by Draft status
    await chooseFilter(page, /^Filter by test status/, "Draft");
    await expect(tableBody.getByText("WT-DRAFT-01")).toBeVisible();
    await expect(tableBody.getByText("WT-PUB-01")).not.toBeVisible();

    // Filter by Archived status
    await chooseFilter(page, /^Filter by test status/, "Archived");
    await expect(tableBody.getByText("WT-ARC-01")).toBeVisible();
  });

  test("TC-TEST-02: Creates a new test directly (full 8 questions 5/2/1) and saves draft successfully", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "+ Create Writing test" }).click();
    const builder = page.getByRole("dialog", { name: "Writing test builder" });
    await expect(builder).toBeVisible();
    await expect(
      builder.getByText("Writing Test Builder · 5/2/1"),
    ).toBeVisible();

    // Verify all 8 questions exist in structure navigation
    await expect(
      builder.getByText("Test structure · 8 questions"),
    ).toBeVisible();
    await expect(
      builder.getByRole("button", { name: "Part 1 · Question 1" }),
    ).toBeVisible();
    await expect(
      builder.getByRole("button", { name: "Part 1 · Question 5" }),
    ).toBeVisible();
    await expect(
      builder.getByRole("button", { name: "Part 2 · Question 1" }),
    ).toBeVisible();
    await expect(
      builder.getByRole("button", { name: "Part 2 · Question 2" }),
    ).toBeVisible();
    await expect(
      builder.getByRole("button", { name: "Part 3 · Question 1" }),
    ).toBeVisible();

    // Fill test code and title
    await builder.getByLabel("Test code *").fill("WT-NEW-01");
    await builder.getByLabel("Test title *").fill("New Writing Test 01");
    await builder
      .getByRole("textbox", { name: "Description", exact: true })
      .fill("Description for directly created test");

    // Click "Save draft"
    await builder.getByRole("button", { name: "Save draft" }).click();

    // Builder closes and notice displays
    await expect(builder).not.toBeVisible();
    await expect(page.getByText("Writing test draft saved.")).toBeVisible();
    await expect(page.getByText("WT-NEW-01")).toBeVisible();
  });

  test("TC-TEST-03: Fails to create test when Test code or Test title is empty (Validation Error)", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "+ Create Writing test" }).click();
    const builder = page.getByRole("dialog", { name: "Writing test builder" });

    // Click Save draft without filling anything
    await builder.getByRole("button", { name: "Save draft" }).click();
    await expect(builder.getByRole("alert")).toContainText(
      "Test code and title are required.",
    );

    // Fill only test code without test title
    await builder.getByLabel("Test code *").fill("WT-FAIL-NO-TITLE");
    await builder.getByRole("button", { name: "Save draft" }).click();
    await expect(builder.getByRole("alert")).toContainText(
      "Test code and title are required.",
    );
  });

  test("TC-TEST-04: Test lifecycle - Allows editing a test in Draft (DRAFT) status", async ({
    page,
  }) => {
    // Find DRAFT row and click "Edit"
    const draftRow = page.locator("tbody tr", { hasText: "WT-DRAFT-01" });
    await expect(draftRow.getByRole("button", { name: "Edit" })).toBeVisible();
    await draftRow.getByRole("button", { name: "Edit" }).click();

    const builder = page.getByRole("dialog", { name: "Writing test builder" });
    await expect(builder).toBeVisible();
    await expect(builder.getByLabel("Test code *")).toHaveValue("WT-DRAFT-01");

    // Edit test title
    const titleInput = builder.getByLabel("Test title *");
    await titleInput.clear();
    await titleInput.fill("Edited Writing Draft Test");

    await builder.getByRole("button", { name: "Save draft" }).click();
    await expect(builder).not.toBeVisible();
    await expect(page.getByText("Writing test draft saved.")).toBeVisible();
    await expect(page.getByText("Edited Writing Draft Test")).toBeVisible();
  });

  test("TC-TEST-05: Test lifecycle - Allows deleting a test in Draft (DRAFT) status", async ({
    page,
  }) => {
    page.on("dialog", (dialog) => {
      expect(dialog.message()).toContain(
        "Permanently delete draft test WT-DRAFT-01",
      );
      dialog.accept();
    });

    const draftRow = page.locator("tbody tr", { hasText: "WT-DRAFT-01" });
    await expect(
      draftRow.getByRole("button", { name: "Delete" }),
    ).toBeVisible();
    await draftRow.getByRole("button", { name: "Delete" }).click();

    // Delete notice displays and test disappears from table
    await expect(page.getByText("Draft test deleted.")).toBeVisible();
    await expect(page.getByText("WT-DRAFT-01")).not.toBeVisible();
  });

  test("TC-TEST-06: Test lifecycle - Publishes a test with 8 questions (5/2/1) successfully", async ({
    page,
  }) => {
    // Open draft test with 8 questions to publish
    const draftRow = page.locator("tbody tr", { hasText: "WT-DRAFT-01" });
    await draftRow.getByRole("button", { name: "Edit" }).click();

    const builder = page.getByRole("dialog", { name: "Writing test builder" });
    await expect(builder).toBeVisible();

    // Click "Save and publish"
    await builder.getByRole("button", { name: "Save and publish" }).click();

    // Publish success notice
    await expect(builder).not.toBeVisible();
    await expect(page.getByText("Writing test published.")).toBeVisible();

    // Check status changed to "Published"
    const updatedRow = page.locator("tbody tr", { hasText: "WT-DRAFT-01" });
    await expect(updatedRow.getByText("Published")).toBeVisible();
  });

  test("TC-TEST-07: Freezes (FREEZE) published test content - Editing is not allowed", async ({
    page,
  }) => {
    // Check published test row WT-PUB-01
    const pubRow = page.locator("tbody tr", { hasText: "WT-PUB-01" });
    await expect(pubRow.getByText("Published", { exact: true })).toBeVisible();

    // PUBLISHED test only has "View" and "Archive" buttons, NEVER "Edit" or "Delete"
    await expect(pubRow.getByRole("button", { name: "View" })).toBeVisible();
    await expect(pubRow.getByRole("button", { name: "Archive" })).toBeVisible();
    await expect(
      pubRow.getByRole("button", { name: "Edit" }),
    ).not.toBeVisible();
    await expect(
      pubRow.getByRole("button", { name: "Delete" }),
    ).not.toBeVisible();

    // Click view details to verify read-only mode
    await pubRow.getByRole("button", { name: "View" }).click();
    const preview = page.getByRole("dialog", { name: "Writing test details" });
    await expect(preview).toBeVisible();
    await expect(preview.getByText("WT-PUB-01 · Published")).toBeVisible();
    await preview.getByRole("button", { name: "Close", exact: true }).click();
    await expect(preview).not.toBeVisible();
  });

  test("TC-TEST-08: Test lifecycle - Archives and Restores a test", async ({
    page,
  }) => {
    // 1. ARCHIVE test WT-PUB-01
    page.once("dialog", (dialog) => {
      expect(dialog.message()).toContain("Archive test WT-PUB-01");
      dialog.accept();
    });

    const pubRow = page.locator("tbody tr", { hasText: "WT-PUB-01" });
    await pubRow.getByRole("button", { name: "Archive" }).click();
    await expect(page.getByText("Writing test archived.")).toBeVisible();

    // Status changes to "Archived"
    const arcRow = page.locator("tbody tr", { hasText: "WT-PUB-01" });
    await expect(arcRow.getByText("Archived", { exact: true })).toBeVisible();

    // 2. RESTORE the archived test
    page.once("dialog", (dialog) => {
      expect(dialog.message()).toContain("Restore test WT-PUB-01");
      dialog.accept();
    });

    await arcRow.getByRole("button", { name: "Restore" }).click();
    await expect(page.getByText("Writing test restored.")).toBeVisible();

    // Status returns to "Published"
    await expect(
      page
        .locator("tbody tr", { hasText: "WT-PUB-01" })
        .getByText("Published", { exact: true }),
    ).toBeVisible();
  });

  test("TC-TEST-09: Imports a complete test from a 4-sheet Excel (.xlsx) file successfully", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Import Excel" }).click();
    const dialog = page.getByRole("dialog", { name: "Import Writing test" });
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole("heading", { name: "Import Writing Test Excel" }),
    ).toBeVisible();

    // Check download template link
    const templateLink = dialog.getByRole("link", {
      name: "Download template",
    });
    await expect(templateLink).toBeVisible();
    await expect(templateLink).toHaveAttribute(
      "href",
      "/api/admin/writing/tests/import-template",
    );

    // Upload valid Excel file (4 sheets, 8 questions)
    const validExam = path.join(FIXTURES_DIR, "valid-complete-test.xlsx");
    await dialog
      .locator('input[type="file"][accept=".xlsx"]')
      .setInputFiles(validExam);

    // Preview shows valid file
    await expect(
      dialog.getByText("Valid file, ready to create draft."),
    ).toBeVisible();

    // Import button is enabled
    const importBtn = dialog.getByRole("button", { name: "Import draft" });
    await expect(importBtn).toBeEnabled();
    await importBtn.click();

    // Modal closes and new test appears in list
    await expect(dialog).not.toBeVisible();
    await expect(
      page.getByText("Writing test imported as a draft."),
    ).toBeVisible();
    await expect(page.getByText("WT-IMP-FULL")).toBeVisible();
  });

  test("TC-TEST-10: Fails to import test when Excel file is missing sheets or has wrong question counts (5/2/1)", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Import Excel" }).click();
    const dialog = page.getByRole("dialog", { name: "Import Writing test" });

    // 1. File missing sheets (only Manifest and Part 1)
    const missingSheetExam = path.join(
      FIXTURES_DIR,
      "invalid-missing-sheets-test.xlsx",
    );
    await dialog
      .locator('input[type="file"][accept=".xlsx"]')
      .setInputFiles(missingSheetExam);

    // Preview displays error requiring all 4 sheets
    await expect(
      dialog.getByText(
        "File must have all 4 sheets: Manifest, Part1, Part2, Part3.",
      ),
    ).toBeVisible();
    const importBtn = dialog.getByRole("button", { name: "Import draft" });
    await expect(importBtn).toBeDisabled();

    // 2. File with wrong question counts (Part 1 only has 2 instead of 5 questions)
    const wrongCountExam = path.join(FIXTURES_DIR, "invalid-counts-test.xlsx");
    await dialog
      .locator('input[type="file"][accept=".xlsx"]')
      .setInputFiles(wrongCountExam);

    // Preview displays Part 1 must have 5 questions error
    await expect(
      dialog.getByText("Part 1 must have exactly 5 questions."),
    ).toBeVisible();
    await expect(importBtn).toBeDisabled();
  });

  test("TC-TEST-11: Fails to import test when using a Listening & Reading Excel template file", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Import Excel" }).click();
    const dialog = page.getByRole("dialog", { name: "Import Writing test" });

    // Use LR output template file from the project
    const lrExamFile = path.resolve(
      FIXTURES_DIR,
      "../../../../TOEICMaster-BE/outputs/admin-lr-exam-import-template/toeic-lr-exam-import-template.xlsx",
    );
    await dialog
      .locator('input[type="file"][accept=".xlsx"]')
      .setInputFiles(lrExamFile);

    // Preview displays error due to mismatch with 4 Writing sheets
    await expect(
      dialog.getByText(
        "File must have all 4 sheets: Manifest, Part1, Part2, Part3.",
      ),
    ).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: "Import draft" }),
    ).toBeDisabled();
  });
});
