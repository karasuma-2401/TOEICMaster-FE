import fs from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { loginAsUser } from "./learner-writing-helpers";

const ATTEMPT_LR = "11111111-1111-4111-8111-111111111111";
const ATTEMPT_SP = "55555555-5555-4555-8555-555555555555";
const ATTEMPT_WR = "22222222-2222-4222-8222-222222222222";
const EXAM_LR = "33333333-3333-4333-8333-333333333333";
const ASSET_AUDIO = "44444444-4444-4444-8444-444444444444";

const SCREENSHOT_DIR = process.env.PIPELINE_SCREENSHOTS_DIR
  ? path.resolve(process.env.PIPELINE_SCREENSHOTS_DIR)
  : null;

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

async function captureScreenshot(page: Page, filename: string) {
  if (!SCREENSHOT_DIR) return;
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, filename),
    fullPage: true,
  });
}

async function mockCommonApis(page: Page) {
  let savedProfile = {
    id: "user-learner-01",
    displayName: "Learner User",
    email: "learner@example.com",
    phone: "0912345678",
    dateOfBirth: "1998-05-12",
    targetScore: 800,
    avatarUrl: null as string | null,
    hasPassword: true,
  };

  await page.route("**/api/auth/session", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: "authenticated",
        user: {
          id: savedProfile.id,
          displayName: savedProfile.displayName,
          email: savedProfile.email,
        },
      }),
    });
  });

  await page.route("**/api/auth/logout", async (route) => {
    await route.fulfill({ status: 204, body: "" });
  });

  await page.route("**/api/profile", async (route) => {
    if (route.request().method() === "PUT") {
      const payload = route.request().postDataJSON() as Record<string, unknown>;
      savedProfile = {
        ...savedProfile,
        displayName:
          typeof payload.displayName === "string"
            ? payload.displayName
            : savedProfile.displayName,
        phone:
          typeof payload.phone === "string" || payload.phone === null
            ? (payload.phone as string)
            : savedProfile.phone,
        dateOfBirth:
          typeof payload.dateOfBirth === "string" ||
          payload.dateOfBirth === null
            ? (payload.dateOfBirth as string)
            : savedProfile.dateOfBirth,
        targetScore:
          typeof payload.targetScore === "number"
            ? payload.targetScore
            : savedProfile.targetScore,
      };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(savedProfile),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(savedProfile),
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
          {
            attemptId: "11111111-1111-4111-8111-111111111112",
            examId: EXAM_LR,
            examTitle: "ETS 2026 Test 01",
            examCode: "ETS-2026-01",
            status: "Completed",
            listeningScaledScore: 400,
            readingScaledScore: 390,
            totalScaledScore: 790,
            isTimeExpired: false,
            startedAtUtc: "2026-11-10T08:00:00Z",
            submittedAtUtc: "2026-11-10T10:00:00Z",
            durationSeconds: 7000,
          },
        ],
        totalCount: 2,
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
        items: [
          {
            id: "sp-test-1",
            code: "SPK-01",
            title: "Speaking Test 01",
            description: "Full speaking mock test",
            publishedAtUtc: "2026-11-17T00:00:00Z",
            parts: [{ part: 1, questionCount: 2, durationSeconds: 180 }],
          },
        ],
        pageNumber: 1,
        pageSize: 20,
        totalCount: 1,
        totalPages: 1,
      }),
    });
  });

  await page.route("**/api/speaking/attempts**", async (route) => {
    const url = route.request().url();
    if (url.includes(`/api/speaking/attempts/${ATTEMPT_SP}/questions/`)) {
      await route.fulfill({
        status: 200,
        contentType: "audio/wav",
        body: SAMPLE_WAV,
      });
      return;
    }
    if (url.includes(`/api/speaking/attempts/${ATTEMPT_SP}`)) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: ATTEMPT_SP,
          testId: "sp-test-1",
          exerciseId: null,
          testCode: "SPK-01",
          testTitle: "Speaking Test 01",
          mode: "FULL",
          status: "SUBMITTED",
          currentQuestionPosition: null,
          currentPhase: null,
          phaseEndsAtUtc: null,
          serverNowUtc: "2026-11-17T12:00:00Z",
          createdAtUtc: "2026-11-17T11:30:00Z",
          submittedAtUtc: "2026-11-17T11:50:00Z",
          questions: [
            {
              position: 1,
              part: 1,
              questionIndex: 0,
              readingSeconds: 0,
              preparationSeconds: 45,
              responseSeconds: 45,
              lockedAtUtc: "2026-11-17T11:32:00Z",
              recording: {
                durationSeconds: 18,
                uploadedAtUtc: "2026-11-17T11:32:00Z",
              },
              content: {
                part: 1,
                passage: "Welcome to the downtown convention center.",
              },
            },
          ],
          reviewQuestions: [
            {
              position: 1,
              modelAnswer: "Welcome to the downtown convention center.",
              rubricNotes: "Clear pacing and stress.",
            },
          ],
          evaluation: {
            status: "COMPLETED",
            estimatedScore: 150,
            summary: "Clear pronunciation.",
            strengths: ["Steady pace"],
            improvements: ["Stress compound nouns"],
            items: [
              {
                position: 1,
                part: 1,
                recognitionStatus: "RECOGNIZED",
                transcript: "Welcome to the downtown convention center.",
                accuracyScore: 88,
                fluencyScore: 80,
                completenessScore: 95,
                prosodyScore: 76,
                pronunciationScore: 84,
                grammarScore: null,
                vocabularyScore: null,
                relevanceScore: null,
                rawScore: 3,
                maxRawScore: 3,
                feedback: "Good intonation.",
                suggestedResponse: null,
                wordIssues: [{ word: "convention", accuracyScore: 52 }],
              },
            ],
            speechProvider: "azure-speech",
            languageProvider: "gemini",
            languageModel: "gemini-2.5-flash",
            rubricVersion: "toeic-speaking-v1",
            consentAcceptedAtUtc: "2026-11-17T11:50:10Z",
            queuedAtUtc: "2026-11-17T11:50:11Z",
            completedAtUtc: "2026-11-17T11:50:30Z",
            retryCount: 0,
            failureMessage: null,
          },
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: [
          {
            id: ATTEMPT_SP,
            testId: "sp-test-1",
            exerciseId: null,
            testCode: "SPK-01",
            testTitle: "Speaking Test 01",
            mode: "FULL",
            status: "SUBMITTED",
            questionCount: 11,
            currentQuestionPosition: null,
            estimatedScore: 150,
            evaluationStatus: "COMPLETED",
            createdAtUtc: "2026-11-17T11:30:00Z",
            submittedAtUtc: "2026-11-17T11:50:00Z",
          },
        ],
        pageNumber: 1,
        pageSize: 20,
        totalCount: 1,
        totalPages: 1,
      }),
    });
  });

  await page.route("**/api/speaking/evaluation-availability", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ available: true }),
    });
  });

  await page.route("**/api/writing/tests*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: [
          {
            id: "wr-test-1",
            code: "WR-01",
            title: "Writing Test 01",
            description: "Full writing mock test",
            publishedAtUtc: "2026-11-16T00:00:00Z",
            parts: [{ part: 1, questionCount: 5, durationSeconds: 480 }],
          },
        ],
        pageNumber: 1,
        pageSize: 4,
        totalCount: 1,
        totalPages: 1,
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
        items: Array.from({ length: 5 }, (_, idx) => ({
          id:
            idx === 0
              ? ATTEMPT_WR
              : `22222222-2222-4222-8222-22222222220${idx}`,
          testId: "wr-test-1",
          testCode: `WR-0${idx + 1}`,
          testTitle: `Writing Test 0${idx + 1}`,
          isPractice: false,
          mode: "FULL",
          status: "SUBMITTED_AWAITING_EVALUATION",
          questionCount: 8,
          currentQuestionPosition: null,
          estimatedScore: 160 - idx * 10,
          evaluationStatus: "COMPLETED",
          createdAtUtc: `2026-11-1${5 - idx}T09:00:00Z`,
          submittedAtUtc: `2026-11-1${5 - idx}T10:00:00Z`,
          updatedAtUtc: `2026-11-1${5 - idx}T10:00:25Z`,
        })),
      }),
    });
  });
}

test.describe("History, Profile, and L&R Flow", () => {
  test.beforeEach(async ({ context, page }) => {
    await loginAsUser(context);
    await mockCommonApis(page);
  });

  test("verifies /, /listening, /reading, /listening-reading, /speaking, /writing, /history, and /profile across Desktop and Mobile", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");

    await expect(page.getByText(/Sắp ra mắt/i)).toHaveCount(0);
    await expect(page.getByTestId("attempt-history-section")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "ETS 2026 Test 01" }).first(),
    ).toBeVisible();
    await assertCleanDomGeometry(page);
    await captureScreenshot(page, "01-desktop-default-1440x900.png");

    // UserMenu dropdown open, Escape close, outside click close
    const trigger = page.getByTestId("user-menu-trigger");
    await trigger.click();
    await expect(
      page.getByRole("menuitem", { name: "Hồ sơ cá nhân" }),
    ).toHaveAttribute("href", "/profile");
    await expect(
      page.getByRole("menuitem", { name: "Lịch sử làm bài" }),
    ).toHaveAttribute("href", "/history");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("menu")).toHaveCount(0);

    // Mobile Home screenshot & DOM geometry
    await page.setViewportSize({ width: 390, height: 844 });
    await assertCleanDomGeometry(page);
    await captureScreenshot(page, "02-mobile-default-390x844.png");

    // Back to Desktop for skill hubs
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/listening");
    await expect(page.getByTestId("attempt-history-section")).toBeVisible();
    await expect(page.getByText("Bạn đã thi 2 lần")).toBeVisible();
    await expect(page.getByText("855 / 990").first()).toBeVisible();
    await assertCleanDomGeometry(page);
    await captureScreenshot(page, "03-listening-history-1440x900.png");

    for (const routePath of [
      "/reading",
      "/listening-reading",
      "/speaking",
      "/writing",
    ]) {
      await page.goto(routePath);
      await expect(page.getByTestId("attempt-history-section")).toBeVisible();
      await assertCleanDomGeometry(page);
    }

    // /history unified page: 8 total items (2 LR + 1 SP + 5 WR), skill filter & Xem thêm
    await page.goto("/history");
    await expect(
      page.getByRole("heading", { name: "Lịch sử làm bài" }),
    ).toBeVisible();
    await expect(page.getByText("Writing Test 01")).toBeVisible();

    const filterGroup = page.getByRole("group", {
      name: "Lọc lịch sử theo kỹ năng",
    });
    await filterGroup.getByRole("button", { name: "Speaking" }).click();
    await expect(page.getByText("Speaking Test 01")).toBeVisible();
    await expect(page.getByText("Writing Test 01")).toHaveCount(0);
    await filterGroup.getByRole("button", { name: "Tất cả" }).click();
    await assertCleanDomGeometry(page);

    // /profile single-page 4 sections + dateOfBirth PUT + settings persistence
    await page.goto("/profile");
    await expect(page.getByRole("tablist")).toHaveCount(0);
    await expect(page.getByTestId("profile-section-details")).toBeVisible();
    await expect(page.getByTestId("profile-section-history")).toBeVisible();
    await expect(page.getByTestId("profile-section-security")).toBeVisible();
    await expect(page.getByTestId("profile-section-settings")).toBeVisible();
    const dobInput = page.getByLabel("Ngày sinh");
    await expect(dobInput).toHaveValue("1998-05-12");

    // Edit dateOfBirth & verify PUT /api/profile sends updated dateOfBirth
    const putPromise = page.waitForRequest(
      (req) => req.url().endsWith("/api/profile") && req.method() === "PUT",
    );
    await dobInput.fill("1999-07-20");
    await page.getByRole("button", { name: "Lưu thay đổi" }).click();
    const putReq = await putPromise;
    expect(putReq.postDataJSON()).toMatchObject({ dateOfBirth: "1999-07-20" });

    // Persist reviewAudioRate = 1.2 & mascotHidden
    await page.getByLabel("Tốc độ mặc định").selectOption("1.2");
    await page.getByRole("checkbox", { name: /Ẩn trợ lý Míc/ }).click();
    const prefs = await page.evaluate(() => ({
      rate: localStorage.getItem("toeicmaster-review-audio-rate"),
      mascot: localStorage.getItem("toeicmaster-mascot-hidden"),
    }));
    expect(prefs).toEqual({ rate: "1.2", mascot: "1" });

    // Toggle mascot back on for clean screenshot
    await page.getByRole("checkbox", { name: /Ẩn trợ lý Míc/ }).click();
    await assertCleanDomGeometry(page);
    await captureScreenshot(page, "04-profile-single-page-1440x900.png");

    await page.setViewportSize({ width: 390, height: 844 });
    await assertCleanDomGeometry(page);
  });

  test("verifies L&R Result/Review, Speaking Result/Review, Writing Result/Review diff, and locked L&R listening player", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
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

    // 1. L&R Result (Screen 18)
    await page.goto(`/exams/lr/attempts/${ATTEMPT_LR}/result`);
    await expect(page.getByText("855")).toBeVisible();
    await expect(page.getByText(/89 \/ 100 câu đúng/)).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Về lịch sử làm bài" }),
    ).toHaveAttribute("href", "/history");
    await assertCleanDomGeometry(page);
    await captureScreenshot(page, "05-lr-result-1440x900.png");

    // 2. L&R Review (Screen 19) + saved reviewAudioRate=1.2 preference
    await page.addInitScript(() => {
      localStorage.setItem("toeicmaster-review-audio-rate", "1.2");
    });
    await page.goto(`/exams/lr/attempts/${ATTEMPT_LR}/review`);
    await expect(page.getByRole("tab", { name: /Làm sai/ })).toBeVisible();
    await expect(page.getByText("Đáp án đúng")).toBeVisible();
    await expect(page.getByText("Bạn chọn")).toBeVisible();
    await expect(page.getByTestId("lr-review-audio-speed")).toHaveValue("1.2");
    await assertCleanDomGeometry(page);
    await captureScreenshot(page, "06-lr-review-1440x900.png");

    // 3. Speaking Result & Review (/history back links)
    await page.goto(`/speaking/attempts/${ATTEMPT_SP}`);
    await expect(
      page.getByRole("link", { name: "Về lịch sử làm bài" }),
    ).toHaveAttribute("href", "/history");
    await assertCleanDomGeometry(page);

    await page.goto(`/speaking/attempts/${ATTEMPT_SP}/review/1`);
    await expect(
      page.getByRole("link", { name: /Lịch sử làm bài|Về lịch sử/i }),
    ).toHaveAttribute("href", "/history");
    await assertCleanDomGeometry(page);

    // 4. Writing Result & Review Sentence Diff (Screens 26 & 27)
    await page.goto(`/writing/attempts/${ATTEMPT_WR}/result`);
    await expect(
      page.getByRole("link", { name: "Xem lịch sử" }),
    ).toHaveAttribute("href", "/history");
    await assertCleanDomGeometry(page);

    await page.goto(`/writing/attempts/${ATTEMPT_WR}/review`);
    await expect(page.getByText("High-score Model Essay")).toBeVisible();
    await expect(page.getByText("Nhận xét của AI")).toBeVisible();
    await expect(page.getByTestId("writing-sentence-diff")).toBeVisible();
    await assertCleanDomGeometry(page);
    await captureScreenshot(page, "07-writing-review-diff-1440x900.png");

    // 5. L&R Exam Room locked Listening audio player (zero seekbar + locked toggle)
    await page.goto(`/exams/lr/attempts/${ATTEMPT_LR}/attempt`);
    const player = page.getByTestId("lr-master-audio-player");
    await expect(player.locator('input[type="range"]')).toHaveCount(0);
    const toggle = page.getByTestId("lr-master-audio-toggle");
    await toggle.click();
    await expect(toggle).toHaveAccessibleName("Đang phát · Khóa tạm dừng");
    await expect(toggle).toBeDisabled();
    await assertCleanDomGeometry(page);
    await captureScreenshot(page, "08-lr-locked-audio-1440x900.png");
  });

  test("handles unauthenticated 401 guest state cleanly on / at Mobile 390x844", async ({
    context,
    page,
  }) => {
    await context.clearCookies();
    await page.unrouteAll({ behavior: "ignoreErrors" });

    await page.route("**/api/auth/session", async (route) => {
      await route.fulfill({ status: 401, body: "{}" });
    });
    await page.route("**/api/lr/exams/lr", async (route) => {
      await route.fulfill({ status: 401, body: "{}" });
    });
    await page.route("**/api/lr/exam-attempts/history*", async (route) => {
      await route.fulfill({ status: 401, body: "{}" });
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
      await route.fulfill({ status: 401, body: "{}" });
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
    await page.route("**/api/writing/attempts*", async (route) => {
      await route.fulfill({ status: 401, body: "{}" });
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(
      page.getByText("Đăng nhập để xem lịch sử làm bài"),
    ).toBeVisible();
    await assertCleanDomGeometry(page);
    await captureScreenshot(page, "09-guest-empty-state-390x844.png");
  });
});
