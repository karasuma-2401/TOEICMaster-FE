import { test, expect } from "@playwright/test";
import {
  MockWritingLearnerBackend,
  loginAsUser,
  sanitizeAttempt,
  sanitizeQuestion,
  sanitizeEvaluation,
} from "./learner-writing-helpers";

test.describe("Writing Security & Limits", () => {
  let backend: MockWritingLearnerBackend;

  test.beforeEach(async ({ page }) => {
    backend = new MockWritingLearnerBackend();
    await backend.setupRoutes(page);
  });

  test("TC-SEC-01: Guest limit - Only allowed 1 AI evaluation in 24 hours", async ({
    page,
  }) => {
    // Anonymous / guest user (not logged in)
    // 1. Create first guest attempt
    const guestAttempt1 = sanitizeAttempt({
      id: "att-guest-01",
      testCode: "WT-PUB-FULL-01",
      testTitle: "TOEIC Writing Simulation Test 01",
      ownerId: "guest-anon-session",
      isPractice: false,
      mode: "FULL",
      status: "SUBMITTED_AWAITING_EVALUATION",
      currentQuestionPosition: null,
      submittedAtUtc: new Date().toISOString(),
      questions: [
        sanitizeQuestion({
          position: 1,
          part: 1,
          answer: "A man is working on the laptop.",
          lockedAtUtc: new Date().toISOString(),
        }),
      ],
      evaluation: sanitizeEvaluation({
        id: "eval-guest-01",
        status: "CONSENT_REQUIRED",
      }),
    });
    backend.attempts.push(guestAttempt1);

    // First time: Guest requests AI grading -> Succeeds
    await page.goto("/writing/attempts/att-guest-01/result");
    await page
      .getByRole("checkbox", {
        name: "I agree to send my writing to the AI service for estimated scoring.",
      })
      .check();
    await page.getByRole("button", { name: "Agree and grade" }).click();

    // System accepts the first grading request
    await expect(
      page.getByRole("heading", { name: "AI is grading your writing" }),
    ).toBeVisible();
    expect(backend.guestConsentUsed).toBe(true);

    // 2. Create second guest attempt within 24 hours
    const guestAttempt2 = sanitizeAttempt({
      id: "att-guest-02",
      testCode: "WT-PUB-FULL-01",
      testTitle: "TOEIC Writing Simulation Test 01",
      ownerId: "guest-anon-session",
      isPractice: false,
      mode: "FULL",
      status: "SUBMITTED_AWAITING_EVALUATION",
      currentQuestionPosition: null,
      submittedAtUtc: new Date().toISOString(),
      questions: [
        sanitizeQuestion({
          position: 1,
          part: 1,
          answer: "Two people are talking in the office.",
          lockedAtUtc: new Date().toISOString(),
        }),
      ],
      evaluation: sanitizeEvaluation({
        id: "eval-guest-02",
        status: "CONSENT_REQUIRED",
      }),
    });
    backend.attempts.push(guestAttempt2);

    // Second time: Guest requests grading again -> Blocked with 409 Conflict
    await page.goto("/writing/attempts/att-guest-02/result");
    await page
      .getByRole("checkbox", {
        name: "I agree to send my writing to the AI service for estimated scoring.",
      })
      .check();
    await page.getByRole("button", { name: "Agree and grade" }).click();

    // Displays anonymous guest limit exceeded message
    await expect(
      page.getByText(
        "This anonymous session has already used its AI evaluation in the past 24 hours. Please log in or try again later.",
      ),
    ).toBeVisible();
  });

  test("TC-SEC-02: Attempt security - Cannot access another user's attempt via direct link", async ({
    page,
    context,
  }) => {
    // Log in with regular learner account
    await loginAsUser(context, "user-learner-01", "learner@example.com");

    // Try to directly access another user's attempt (att-other-user-99 belongs to victim-user-99)
    await page.goto("/writing/attempts/att-other-user-99");

    // System blocks access and displays 404 error message
    await expect(page.getByText("Attempt not found.")).toBeVisible();

    // Confirm private content of the other user is not leaked in the UI
    await expect(
      page.getByText("Private Attempt of Another User"),
    ).not.toBeVisible();
  });

  test("TC-SEC-03: Content security - Learner UI does not render Model Answer or internal prompts", async ({
    page,
    context,
  }) => {
    await loginAsUser(context);

    // Open graded attempt results page
    await page.goto("/writing/attempts/att-completed-01/result");

    await expect(
      page.getByRole("heading", { name: "Writing Results" }),
    ).toBeVisible();

    // Get all rendered HTML content on learner page
    const pageContent = await page.content();

    // Ensure no internal AI system prompt or secret system instruction is present
    expect(pageContent).not.toContain(
      "You are an expert TOEIC Writing evaluator",
    );
    expect(pageContent).not.toContain("System Prompt:");
    expect(pageContent).not.toContain("Internal rubric prompt");

    // Ensure no secret internal model answer is rendered
    expect(pageContent).not.toContain("Secret Model Answer:");
    expect(pageContent).not.toContain("OFFICIAL_ETS_SAMPLE_ANSWER");
  });

  test("TC-SEC-04: Route authorization - Guests and regular users cannot access /admin/* pages", async ({
    page,
    context,
  }) => {
    // 1. Guest user (Not logged in):
    // Directly access Writing exercise management
    await page.goto("/admin/content/writing");
    // Redirected to login page with next parameter
    await expect(page).toHaveURL(/\/login\?next=%2Fadmin%2Fcontent%2Fwriting/);

    // Directly access Writing test management
    await page.goto("/admin/tests/writing");
    await expect(page).toHaveURL(/\/login\?next=%2Fadmin%2Ftests%2Fwriting/);

    // 2. Logged-in regular learner (role: 'USER'):
    await loginAsUser(context, "normal-user-01", "normal@example.com");

    // Attempt to access exercise management page
    await page.goto("/admin/content/writing");
    // Redirected to home page /
    await expect(page).toHaveURL("http://localhost:3000/");

    // Attempt to access test management page
    await page.goto("/admin/tests/writing");
    // Redirected to home page /
    await expect(page).toHaveURL("http://localhost:3000/");
  });
});
