import { test, expect } from "@playwright/test";
import {
  MockWritingLearnerBackend,
  loginAsUser,
  sanitizeAttempt,
  sanitizeQuestion,
  sanitizeEvaluation,
} from "./learner-writing-helpers";

test.describe("Learner Writing - AI Gemini Evaluation (/writing/attempts/[id]/result)", () => {
  let backend: MockWritingLearnerBackend;

  test.beforeEach(async ({ page, context }) => {
    backend = new MockWritingLearnerBackend();
    await backend.setupRoutes(page);
    await loginAsUser(context);
  });

  test("TC-EVAL-01: Consent confirmation screen before submitting attempt to AI", async ({
    page,
  }) => {
    // Prepare submission in CONSENT_REQUIRED state
    const consentAttempt = sanitizeAttempt({
      id: "att-consent-01",
      testCode: "WT-PUB-FULL-01",
      testTitle: "TOEIC Writing Simulation Test 01",
      ownerId: "user-learner-01",
      isPractice: false,
      mode: "FULL",
      status: "SUBMITTED_AWAITING_EVALUATION",
      currentQuestionPosition: null,
      submittedAtUtc: new Date().toISOString(),
      questions: [
        sanitizeQuestion({
          position: 1,
          part: 1,
          answer: "The man is typing at his desk.",
          lockedAtUtc: new Date().toISOString(),
        }),
      ],
      evaluation: sanitizeEvaluation({
        id: "eval-consent-01",
        status: "CONSENT_REQUIRED",
      }),
    });
    backend.attempts.push(consentAttempt);

    await page.goto("/writing/attempts/att-consent-01/result");

    // Display heading and submission info
    await expect(
      page.getByRole("heading", { name: "Writing Attempt Submitted" }),
    ).toBeVisible();
    await expect(page.getByText("Awaiting confirmation")).toBeVisible();

    // AI consent confirmation box
    await expect(
      page.getByRole("heading", { name: "Submit for AI estimated scoring" }),
    ).toBeVisible();
    await expect(
      page.getByText(
        "When you confirm, the prompt, prompt image, and your writing will be sent to Gemini",
      ),
    ).toBeVisible();

    const consentCheckbox = page.getByRole("checkbox", {
      name: "I agree to send my writing to the AI service for estimated scoring.",
    });
    const submitBtn = page.getByRole("button", { name: "Agree and grade" });

    // Submit button is disabled until consent checkbox is checked
    await expect(consentCheckbox).not.toBeChecked();
    await expect(submitBtn).toBeDisabled();

    // Check consent checkbox
    await consentCheckbox.check();
    await expect(consentCheckbox).toBeChecked();
    await expect(submitBtn).toBeEnabled();

    // Click grade button
    await submitBtn.click();

    // Status transitions to AI grading (QUEUED)
    await expect(
      page.getByRole("heading", { name: "AI is grading your writing" }),
    ).toBeVisible();
    expect(consentAttempt.evaluation?.status).toBe("QUEUED");
  });

  test("TC-EVAL-02: AI grading pending state and automatic polling every 5s", async ({
    page,
  }) => {
    // Prepare attempt in QUEUED state waiting for AI
    const queuedAttempt = sanitizeAttempt({
      id: "att-queued-01",
      testCode: "WT-PUB-FULL-01",
      testTitle: "TOEIC Writing Simulation Test 01",
      ownerId: "user-learner-01",
      isPractice: false,
      mode: "FULL",
      status: "SUBMITTED_AWAITING_EVALUATION",
      currentQuestionPosition: null,
      submittedAtUtc: new Date().toISOString(),
      questions: [
        sanitizeQuestion({
          position: 1,
          part: 1,
          answer: "The man is typing at his desk.",
          lockedAtUtc: new Date().toISOString(),
        }),
      ],
      evaluation: sanitizeEvaluation({
        id: "eval-queued-01",
        status: "QUEUED",
      }),
    });
    backend.attempts.push(queuedAttempt);

    await page.goto("/writing/attempts/att-queued-01/result");

    // Screen displays pending grading status with 5-second polling cycle
    await expect(
      page.getByRole("heading", { name: "AI is grading your writing" }),
    ).toBeVisible();
    await expect(
      page.getByText("This status updates automatically every 5 seconds."),
    ).toBeVisible();

    // Simulate backend completing evaluation after a moment
    queuedAttempt.evaluation = sanitizeEvaluation({
      id: "eval-queued-01",
      status: "COMPLETED",
      estimatedScore: 185,
      summary:
        "The essay achieved a very high score with rich and accurate grammatical structures.",
      strengths: ["Flexible vocabulary usage.", "Completely accurate grammar."],
      improvements: ["Can add relative clauses for longer sentences."],
      feedback: [
        {
          questionPosition: 1,
          criterionScore: 3,
          feedback: "Accurately uses the keywords and describes the picture.",
          suggestedRevision:
            "The man is sitting and typing at his computer desk.",
        },
      ],
    });

    // Wait for 5-second polling to automatically update results without manual reload
    await expect(
      page.getByRole("heading", { name: "Writing Results" }),
    ).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("185")).toBeVisible();
    await expect(page.getByText("/200")).toBeVisible();
  });

  test("TC-EVAL-03: Detailed evaluation report", async ({ page }) => {
    // Use pre-graded attempt att-completed-01 (170/200)
    await page.goto("/writing/attempts/att-completed-01/result");

    // 1. Heading and overview
    await expect(
      page.getByRole("heading", { name: "Writing Results" }),
    ).toBeVisible();
    await expect(
      page.getByText("AI-estimated TOEIC Writing score"),
    ).toBeVisible();
    await expect(page.getByText("170")).toBeVisible();
    await expect(page.getByText("/200")).toBeVisible();

    // 2. Part scores
    await expect(page.getByText("Writing Part 1")).toBeVisible();
    await expect(page.getByText("Total AI rubric score")).toBeVisible();

    // 3. Overall feedback
    await expect(
      page.getByRole("heading", { name: "Overall feedback" }),
    ).toBeVisible();
    await expect(
      page.getByText(
        "The writing demonstrates strong grammar, rich vocabulary, and coherent sentence structure.",
      ),
    ).toBeVisible();

    // 4. Strengths and Areas for improvement lists
    await expect(
      page.getByRole("heading", { name: "Strengths" }),
    ).toBeVisible();
    await expect(
      page.getByText("Accurate verb tenses and subject-verb agreement."),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Areas for improvement" }),
    ).toBeVisible();
    await expect(
      page.getByText("Use a wider variety of linking words."),
    ).toBeVisible();

    // 5. Question-by-question feedback and toggle to view prompt + submitted answer
    await expect(
      page.getByRole("heading", { name: "Question-by-question feedback" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Question 1" }),
    ).toBeVisible();
    await expect(page.getByText("AI rubric score: 3")).toBeVisible();
    await expect(
      page.getByText("The person is typing diligently on the office computer."),
    ).toBeVisible();

    // Expand details to view prompt and submitted answer
    const detailsToggle = page.locator("summary", {
      hasText: "View prompt and submitted answer",
    });
    await expect(detailsToggle).toBeVisible();
    await detailsToggle.click();

    await expect(
      page.getByText("The person is typing diligently on the computer."),
    ).toBeVisible();
  });

  test('TC-EVAL-04: Handles AI failure and "Retry grading" button', async ({
    page,
  }) => {
    // Prepare attempt with failed AI grading (FAILED)
    const failedAttempt = sanitizeAttempt({
      id: "att-failed-01",
      testCode: "WT-PUB-FULL-01",
      testTitle: "TOEIC Writing Simulation Test 01",
      ownerId: "user-learner-01",
      isPractice: false,
      mode: "FULL",
      status: "SUBMITTED_AWAITING_EVALUATION",
      currentQuestionPosition: null,
      submittedAtUtc: new Date().toISOString(),
      questions: [
        sanitizeQuestion({
          position: 1,
          part: 1,
          answer: "The man is typing at his desk.",
          lockedAtUtc: new Date().toISOString(),
        }),
      ],
      evaluation: sanitizeEvaluation({
        id: "eval-failed-01",
        status: "FAILED",
        failureMessage:
          "The AI system is overloaded or hit a quota limit. Please try again later.",
      }),
    });
    backend.attempts.push(failedAttempt);

    await page.goto("/writing/attempts/att-failed-01/result");

    // Display error alert
    await expect(
      page.getByRole("heading", { name: "Unable to grade right now" }),
    ).toBeVisible();
    await expect(
      page.getByText(
        "The AI system is overloaded or hit a quota limit. Please try again later.",
      ),
    ).toBeVisible();

    // Retry grading button
    const retryBtn = page.getByRole("button", { name: "Retry grading" });
    await expect(retryBtn).toBeVisible();
    await expect(retryBtn).toBeEnabled();

    // Click Retry grading button
    await retryBtn.click();

    // System retriggers AI grading workflow
    await expect(
      page.getByRole("heading", { name: "AI is grading your writing" }),
    ).toBeVisible();
    expect(failedAttempt.evaluation?.status).toBe("QUEUED");
  });
});
