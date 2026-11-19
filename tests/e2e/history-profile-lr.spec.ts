import { expect, test, type Page } from "@playwright/test";
import { loginAsUser } from "./learner-writing-helpers";

const ATTEMPT_LR = "11111111-1111-4111-8111-111111111111";
const ATTEMPT_WR = "22222222-2222-4222-8222-222222222222";
const EXAM_LR = "33333333-3333-4333-8333-333333333333";
const ASSET_AUDIO = "44444444-4444-4444-8444-444444444444";

function createSilentWav(durationSeconds = 2): Buffer {
  const sampleRate = 8000;
  const dataSize = sampleRate * durationSeconds;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVEfmt ", 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate, 28);
  buffer.writeUInt16LE(1, 32);
  buffer.writeUInt16LE(8, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  buffer.fill(0x80, 44);
  return buffer;
}

const SAMPLE_WAV = createSilentWav(2);

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

async function mockCommonApis(page: Page) {
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
    if (route.request().method() === "PUT") {
      const payload = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "user-learner-01",
          displayName: payload.displayName ?? "Learner User",
          email: "learner@example.com",
          phone: payload.phone ?? "0912345678",
          dateOfBirth: payload.dateOfBirth ?? "1998-05-12",
          targetScore: payload.targetScore ?? 800,
          avatarUrl: null,
          hasPassword: true,
        }),
      });
      return;
    }
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
      body: JSON.stringify([
        {
          examId: EXAM_LR,
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
        },
      ]),
    });
  });

  await page.route("**/api/lr/exam-attempts/history*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: [
          {
            attemptId: ATTEMPT_LR,
            examId: EXAM_LR,
            examTitle: "ETS 2026 Test 01",
            examCode: "ETS-2026-01",
            status: 2,
            listeningScaledScore: 445,
            readingScaledScore: 410,
            totalScaledScore: 855,
            isTimeExpired: false,
            startedAtUtc: "2026-11-18T08:00:00Z",
            submittedAtUtc: "2026-11-18T10:00:00Z",
            durationSeconds: 6765,
          },
        ],
        totalCount: 1,
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
        pageSize: 4,
        totalCount: 0,
        totalPages: 0,
      }),
    });
  });

  await page.route(`**/api/writing/attempts/${ATTEMPT_WR}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: ATTEMPT_WR,
        testId: "wr-test-1",
        testCode: "WR-01",
        isPractice: false,
        testTitle: "Writing Test 01",
        mode: "FULL",
        status: "SUBMITTED_AWAITING_EVALUATION",
        currentQuestionPosition: null,
        currentPhase: null,
        phaseEndsAtUtc: null,
        serverNowUtc: "2026-11-17T10:05:00Z",
        createdAtUtc: "2026-11-17T09:00:00Z",
        submittedAtUtc: "2026-11-17T10:00:00Z",
        questions: [
          {
            position: 1,
            part: 1,
            preparationSeconds: 0,
            responseSeconds: 480,
            imageUrl: null,
            imageAlt: null,
            keywordOne: "walk",
            keywordTwo: "sidewalk",
            sender: null,
            recipient: null,
            subject: null,
            emailBody: null,
            directions: "Write a sentence based on the picture.",
            prompt: "Describe the picture.",
            minimumWordCount: null,
            outline: null,
            answer: "Two colleagues walks along the sidewalk.",
            lastSavedAtUtc: "2026-11-17T09:59:00Z",
            lockedAtUtc: "2026-11-17T10:00:00Z",
          },
        ],
        reviewQuestions: [
          {
            position: 1,
            modelAnswer: "Two colleagues walk together along the sidewalk.",
          },
        ],
        evaluation: {
          status: "COMPLETED",
          estimatedScore: 160,
          summary: "Good overall response.",
          failureMessage: null,
          provider: "gemini",
          model: "gemini-2.5-flash",
          rubricVersion: "1.0",
          consentAcceptedAtUtc: "2026-11-17T10:00:10Z",
          queuedAtUtc: "2026-11-17T10:00:11Z",
          completedAtUtc: "2026-11-17T10:00:25Z",
          retryCount: 0,
          strengths: ["Clear structure"],
          improvements: ["Subject-verb agreement"],
          feedback: [
            {
              questionPosition: 1,
              criterionScore: 2,
              feedback: "Check plural subject-verb agreement.",
              suggestedRevision: "Two colleagues walk along the sidewalk.",
            },
          ],
        },
      }),
    });
  });

  await page.route("**/api/writing/attempts", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: [
          {
            id: ATTEMPT_WR,
            testId: "wr-test-1",
            testCode: "WR-01",
            testTitle: "Writing Test 01",
            isPractice: false,
            mode: "FULL",
            status: "SUBMITTED_AWAITING_EVALUATION",
            questionCount: 8,
            currentQuestionPosition: null,
            estimatedScore: 160,
            evaluationStatus: "COMPLETED",
            createdAtUtc: "2026-11-17T09:00:00Z",
            submittedAtUtc: "2026-11-17T10:00:00Z",
            updatedAtUtc: "2026-11-17T10:00:25Z",
          },
        ],
      }),
    });
  });
}

test.describe("History, Profile, and L&R Flow", () => {
  test.beforeEach(async ({ context, page }) => {
    await loginAsUser(context);
    await mockCommonApis(page);
  });

  test("renders /, /listening, /history, and single-page /profile across Desktop and Mobile", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");

    await expect(page.getByText(/Sắp ra mắt/i)).toHaveCount(0);
    await expect(page.getByTestId("attempt-history-section")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "ETS 2026 Test 01" }).first(),
    ).toBeVisible();

    await page.getByTestId("user-menu-trigger").click();
    await expect(
      page.getByRole("menuitem", { name: "Hồ sơ cá nhân" }),
    ).toHaveAttribute("href", "/profile");
    await expect(
      page.getByRole("menuitem", { name: "Lịch sử làm bài" }),
    ).toHaveAttribute("href", "/history");
    await assertCleanDomGeometry(page);

    await page.goto("/listening");
    await expect(page.getByTestId("attempt-history-section")).toBeVisible();
    await expect(page.getByText("855 / 990").first()).toBeVisible();
    await assertCleanDomGeometry(page);

    await page.goto("/history");
    await expect(
      page.getByRole("heading", { name: "Lịch sử làm bài" }),
    ).toBeVisible();
    await expect(page.getByText("Writing Test 01")).toBeVisible();
    await assertCleanDomGeometry(page);

    await page.goto("/profile");
    await expect(page.getByRole("tablist")).toHaveCount(0);
    await expect(page.getByTestId("profile-section-details")).toBeVisible();
    await expect(page.getByTestId("profile-section-history")).toBeVisible();
    await expect(page.getByTestId("profile-section-security")).toBeVisible();
    await expect(page.getByTestId("profile-section-settings")).toBeVisible();
    await expect(page.getByLabel("Ngày sinh")).toHaveValue("1998-05-12");
    await assertCleanDomGeometry(page);

    await page.setViewportSize({ width: 390, height: 844 });
    await assertCleanDomGeometry(page);
  });

  test("renders L&R result/review, Writing sentence diff, and locked L&R listening player", async ({
    page,
  }) => {
    await page.route(
      `**/api/lr/exam-attempts/${ATTEMPT_LR}/result`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            attemptId: ATTEMPT_LR,
            examId: EXAM_LR,
            examCode: "ETS-2026-01",
            examTitle: "ETS 2026 Test 01",
            listeningRawScore: 89,
            readingRawScore: 83,
            listeningScaledScore: 445,
            readingScaledScore: 410,
            totalScaledScore: 855,
            listeningMaxScaledScore: 495,
            readingMaxScaledScore: 495,
            maxScaledScore: 990,
            totalCorrect: 172,
            totalIncorrect: 18,
            totalSkipped: 10,
            isTimeExpired: false,
            startedAtUtc: "2026-11-18T08:00:00Z",
            submittedAtUtc: "2026-11-18T10:00:00Z",
            durationSeconds: 6765,
            parts: [
              {
                part: 1,
                totalQuestions: 6,
                correctCount: 6,
                incorrectCount: 0,
                skippedCount: 0,
              },
              {
                part: 5,
                totalQuestions: 30,
                correctCount: 27,
                incorrectCount: 3,
                skippedCount: 0,
              },
            ],
          }),
        });
      },
    );

    await page.route(
      `**/api/lr/exam-attempts/${ATTEMPT_LR}/review*`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            attemptId: ATTEMPT_LR,
            examId: EXAM_LR,
            examCode: "ETS-2026-01",
            examTitle: "ETS 2026 Test 01",
            totalScaledScore: 855,
            listeningScaledScore: 445,
            readingScaledScore: 410,
            isTimeExpired: false,
            counts: { correct: 172, wrong: 18, skipped: 10, flagged: 0 },
            blocks: [
              {
                id: "block-32",
                part: 3,
                firstQuestionNumber: 32,
                audioAssetId: ASSET_AUDIO,
                audioDurationMs: 2000,
                contextBlocks: [],
                questions: [
                  {
                    questionId: "q32",
                    number: 32,
                    part: 3,
                    stem: "Where are the speakers?",
                    optionA: "Office",
                    optionB: "Airport",
                    optionC: "Hotel",
                    optionD: "Cafe",
                    userSelectedKey: "A",
                    correctKey: "B",
                    status: "wrong",
                    isFlagged: false,
                    explanation: "They discuss boarding gates.",
                    translation: "Họ nói về cổng lên máy bay.",
                    imageAssetId: null,
                  },
                ],
              },
            ],
          }),
        });
      },
    );

    await page.route(`**/api/lr/exam-attempts/${ATTEMPT_LR}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          attemptId: ATTEMPT_LR,
          examId: EXAM_LR,
          examCode: "ETS-2026-01",
          examTitle: "ETS 2026 Test 01",
          versionNumber: 1,
          phase: "listening",
          startedAtUtc: "2026-11-18T08:00:00Z",
          readingStartedAtUtc: null,
          timeLimitSeconds: 7200,
          remainingSeconds: 7100,
          totalQuestions: 1,
          blocks: [
            {
              id: "block-1",
              part: 1,
              firstQuestionNumber: 1,
              audioAssetId: ASSET_AUDIO,
              audioDurationMs: 2000,
              contextBlocks: [],
              questions: [
                {
                  id: "q1",
                  number: 1,
                  stem: "Listen and choose.",
                  optionA: "A",
                  optionB: "B",
                  optionC: "C",
                  optionD: "D",
                  imageAssetId: null,
                  userSelectedKey: null,
                  isFlagged: false,
                },
              ],
            },
          ],
        }),
      });
    });

    await page.route(
      `**/api/lr/exam-attempts/${ATTEMPT_LR}/listening-audio-urls`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            items: [
              {
                blockId: "block-1",
                part: 1,
                firstQuestionNumber: 1,
                audioAssetId: ASSET_AUDIO,
                durationMs: 2000,
                url: `https://minio.example.test/${ASSET_AUDIO}.wav`,
                expiresAtUtc: "2026-11-19T23:59:59Z",
              },
            ],
          }),
        });
      },
    );

    await page.route("https://minio.example.test/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "audio/wav",
        body: SAMPLE_WAV,
      });
    });

    await page.goto(`/exams/lr/attempts/${ATTEMPT_LR}/result`);
    await expect(page.getByText("855")).toBeVisible();
    await expect(page.getByText(/89 \/ 100 câu đúng/)).toBeVisible();

    await page.goto(`/exams/lr/attempts/${ATTEMPT_LR}/review`);
    await expect(page.getByRole("tab", { name: /Làm sai/ })).toBeVisible();
    await expect(page.getByText("Đáp án đúng")).toBeVisible();
    await expect(page.getByText("Bạn chọn")).toBeVisible();

    await page.goto(`/writing/attempts/${ATTEMPT_WR}/review`);
    await expect(page.getByText("High-score Model Essay")).toBeVisible();
    await expect(page.getByText("Nhận xét của AI")).toBeVisible();
    await expect(page.getByTestId("writing-sentence-diff")).toBeVisible();

    await page.goto(`/exams/lr/attempts/${ATTEMPT_LR}/attempt`);
    const toggle = page.getByTestId("lr-master-audio-toggle");
    await toggle.click();
    await expect(toggle).toHaveAccessibleName("Đang phát · Khóa tạm dừng");
    await expect(toggle).toBeDisabled();
  });
});
