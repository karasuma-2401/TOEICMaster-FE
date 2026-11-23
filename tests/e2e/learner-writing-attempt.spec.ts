import { test, expect } from "@playwright/test";
import {
  MockWritingLearnerBackend,
  loginAsUser,
} from "./learner-writing-helpers";

test.describe("Learner Writing - 2-Phase Virtual Exam Room (/writing/attempts/[id])", () => {
  let backend: MockWritingLearnerBackend;

  test.beforeEach(async ({ page, context }) => {
    backend = new MockWritingLearnerBackend();
    await backend.setupRoutes(page);
    await loginAsUser(context);
  });

  test("TC-ATTEMPT-01: Two-phase mechanism - Preparation phase (PREPARING) locks the answer input", async ({
    page,
  }) => {
    await page.goto("/writing/attempts/att-in-progress-01");

    // Verify header displays attempt info
    await expect(page.getByText("WT-PUB-FULL-01 · QUESTION 1/3")).toBeVisible();

    // Timer displays "Prepare" phase
    await expect(page.getByText("Prepare", { exact: true })).toBeVisible();

    // Answer input is disabled during preparation phase
    const textarea = page.locator("#writing-answer");
    await expect(textarea).toBeDisabled();
    await expect(
      page.getByText("Editor is locked during preparation."),
    ).toBeVisible();

    // Next button is not visible during preparation phase
    await expect(
      page.getByRole("button", { name: "Next · lock this question" }),
    ).not.toBeVisible();
    await expect(
      page.getByText(
        "Read the prompt and prepare your ideas. The editor will open when the timer reaches 00:00.",
      ),
    ).toBeVisible();
  });

  test("TC-ATTEMPT-02: Two-phase mechanism - Response phase (ANSWERING) unlocks the input for the learner to type", async ({
    page,
  }) => {
    // Switch attempt to ANSWERING phase
    const attempt = backend.attempts.find(
      (a) => a.id === "att-in-progress-01",
    )!;
    attempt.currentPhase = "ANSWERING";
    attempt.phaseEndsAtUtc = new Date(Date.now() + 45000).toISOString();

    await page.goto("/writing/attempts/att-in-progress-01");

    // Timer displays "Respond" phase
    await expect(page.getByText("Respond")).toBeVisible();

    // Answer input is enabled
    const textarea = page.locator("#writing-answer");
    await expect(textarea).toBeEnabled();
    await expect(textarea).toHaveAttribute(
      "placeholder",
      "Write an English sentence…",
    );

    // Next button is visible
    await expect(
      page.getByRole("button", { name: "Next · lock this question" }),
    ).toBeVisible();
  });

  test("TC-ATTEMPT-03: Countdown timer - Keeps server-synced rhythm (Reloading the page does not reset remaining time)", async ({
    page,
  }) => {
    // Set fixed end time with 30 seconds remaining
    const attempt = backend.attempts.find(
      (a) => a.id === "att-in-progress-01",
    )!;
    attempt.currentPhase = "ANSWERING";
    attempt.phaseEndsAtUtc = new Date(Date.now() + 30000).toISOString();

    await page.goto("/writing/attempts/att-in-progress-01");
    await expect(page.getByText("Respond")).toBeVisible();

    // Wait 2 seconds then reload the page
    await page.waitForTimeout(2000);
    await page.reload();

    // After reload, timer continues counting down accurately (around 27-28s left) rather than resetting to 30s
    await expect(page.getByText("Respond")).toBeVisible();
    const timerText = await page
      .locator("header, div")
      .filter({ hasText: /00:2[0-9]/ })
      .first()
      .isVisible();
    expect(timerText).toBe(true);
  });

  test("TC-ATTEMPT-04: Realtime Autosave while typing", async ({ page }) => {
    const attempt = backend.attempts.find(
      (a) => a.id === "att-in-progress-01",
    )!;
    attempt.currentPhase = "ANSWERING";
    attempt.phaseEndsAtUtc = new Date(Date.now() + 45000).toISOString();

    await page.goto("/writing/attempts/att-in-progress-01");

    const textarea = page.locator("#writing-answer");
    await textarea.fill("The man is sitting at his desk typing an email.");

    // Status displays autosave success
    await expect(page.getByText("Autosaved on server")).toBeVisible();

    // Verify data was saved on the backend
    expect(attempt.questions[0].answer).toContain(
      "The man is sitting at his desk",
    );
  });

  test("TC-ATTEMPT-05: Realtime Word Count in Part 3", async ({ page }) => {
    // Move attempt to Part 3 question (requires minimum 300 words)
    const attempt = backend.attempts.find(
      (a) => a.id === "att-in-progress-01",
    )!;
    attempt.currentQuestionPosition = 3;
    attempt.currentPhase = "ANSWERING";
    attempt.phaseEndsAtUtc = new Date(Date.now() + 1800000).toISOString();

    await page.goto("/writing/attempts/att-in-progress-01");

    await expect(page.getByText("Writing Part 3")).toBeVisible();

    const textarea = page.locator("#writing-answer");
    // Type 6 words
    await textarea.fill("Higher education provides many great opportunities");

    // Verify word counter displays 6/300 words
    await expect(page.getByText("6/300 words")).toBeVisible();
  });

  test("TC-ATTEMPT-06: Locks answer after advancing to next question (Cannot go back to previous question)", async ({
    page,
  }) => {
    const attempt = backend.attempts.find(
      (a) => a.id === "att-in-progress-01",
    )!;
    attempt.currentPhase = "ANSWERING";
    attempt.phaseEndsAtUtc = new Date(Date.now() + 45000).toISOString();

    await page.goto("/writing/attempts/att-in-progress-01");

    // Type answer for question 1
    const textarea = page.locator("#writing-answer");
    await textarea.fill("Answer for question 1.");

    // Click Next to lock question 1 and move to question 2
    await page
      .getByRole("button", { name: "Next · lock this question" })
      .click();

    // Moved to question 2/3
    await expect(page.getByText("QUESTION 2/3")).toBeVisible();

    // Check progress rail: Question 1 is locked/done, hint states it cannot be reopened
    await expect(
      page.getByText("Locked questions cannot be reopened."),
    ).toBeVisible();
    expect(attempt.questions[0].lockedAtUtc).not.toBeNull();
  });

  test("TC-ATTEMPT-07: Submits attempt on the last question and redirects to the result page", async ({
    page,
  }) => {
    // Move attempt to the last question (question 3)
    const attempt = backend.attempts.find(
      (a) => a.id === "att-in-progress-01",
    )!;
    attempt.currentQuestionPosition = 3;
    attempt.currentPhase = "ANSWERING";
    attempt.phaseEndsAtUtc = new Date(Date.now() + 1800000).toISOString();

    await page.goto("/writing/attempts/att-in-progress-01");

    // Button on the last question is "Submit" instead of "Next"
    const submitBtn = page.getByRole("button", { name: "Submit" });
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Submit confirmation modal appears
    await expect(
      page.getByRole("heading", { name: "Submit Writing attempt?" }),
    ).toBeVisible();
    await expect(
      page.getByText(
        "The final question will be locked and your attempt will be queued for AI evaluation.",
      ),
    ).toBeVisible();

    // Confirm submit
    await page.getByRole("button", { name: "Confirm submit" }).click();

    // Redirects to /result page
    await expect(page).toHaveURL(
      /\/writing\/attempts\/att-in-progress-01\/result/,
    );
    await expect(
      page.getByRole("heading", { name: "Writing Attempt Submitted" }),
    ).toBeVisible();
  });
});
