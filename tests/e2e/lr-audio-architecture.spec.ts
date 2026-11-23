import fs from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { loginAsUser } from "./learner-writing-helpers";

const ATTEMPT_ID = "11111111-1111-4111-8111-111111111111";
const EXAM_ID = "22222222-2222-4222-8222-222222222222";
const ASSET_1 = "33333333-3333-4333-8333-333333333333";
const ASSET_2 = "44444444-4444-4444-8444-444444444444";
const IMAGE_1 = "55555555-5555-4555-8555-555555555555";

const SCREENSHOTS_DIR =
  process.env.PIPELINE_SCREENSHOTS_DIR ||
  path.resolve(process.cwd(), "test-results/lr-audio-screenshots");

const ONE_BY_ONE_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64",
);

function createSilentWav(durationSeconds = 4): Buffer {
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

const SAMPLE_WAV = createSilentWav(4);

function buildListeningSheet() {
  return {
    attemptId: ATTEMPT_ID,
    examId: EXAM_ID,
    examCode: "LR-2026-01",
    examTitle: "ETS 2026 Test 01",
    versionNumber: 1,
    phase: "listening",
    startedAtUtc: "2026-11-19T00:00:00Z",
    readingStartedAtUtc: null,
    timeLimitSeconds: 7200,
    remainingSeconds: 7100,
    totalQuestions: 3,
    blocks: [
      {
        id: "block-1",
        part: 1,
        firstQuestionNumber: 1,
        audioAssetId: ASSET_1,
        audioDurationMs: 15_000,
        contextBlocks: [],
        questions: [
          {
            id: "q1",
            number: 1,
            stem: null,
            optionA: "He is reading a book.",
            optionB: "He is typing on a laptop.",
            optionC: "He is walking outside.",
            optionD: "He is answering the phone.",
            imageAssetId: IMAGE_1,
            userSelectedKey: null,
            isFlagged: false,
          },
        ],
      },
      {
        id: "block-2",
        part: 3,
        firstQuestionNumber: 32,
        audioAssetId: ASSET_2,
        audioDurationMs: 20_000,
        contextBlocks: [],
        questions: [
          {
            id: "q32",
            number: 32,
            stem: "Where does the conversation take place?",
            optionA: "At an airport",
            optionB: "In an office",
            optionC: "At a hotel",
            optionD: "In a restaurant",
            imageAssetId: null,
            userSelectedKey: null,
            isFlagged: false,
          },
          {
            id: "q33",
            number: 33,
            stem: "What will the woman do next?",
            optionA: "Send an email",
            optionB: "Call a client",
            optionC: "Print a report",
            optionD: "Schedule a meeting",
            imageAssetId: null,
            userSelectedKey: null,
            isFlagged: false,
          },
        ],
      },
    ],
  };
}

function buildReviewPayload() {
  return {
    attemptId: ATTEMPT_ID,
    examId: EXAM_ID,
    examCode: "LR-2026-01",
    examTitle: "ETS 2026 Test 01",
    totalScaledScore: 850,
    listeningScaledScore: 440,
    readingScaledScore: 410,
    isTimeExpired: false,
    counts: { correct: 2, wrong: 1, skipped: 0, flagged: 0 },
    blocks: [
      {
        id: "block-1",
        part: 1,
        firstQuestionNumber: 1,
        audioAssetId: ASSET_1,
        audioDurationMs: 45_000,
        contextBlocks: [],
        questions: [
          {
            questionId: "q1",
            number: 1,
            part: 1,
            stem: null,
            optionA: "He is reading a book.",
            optionB: "He is typing on a laptop.",
            optionC: "He is walking outside.",
            optionD: "He is answering the phone.",
            userSelectedKey: "A",
            correctKey: "B",
            status: "wrong",
            isFlagged: false,
            explanation: "The man is typing on a laptop at his desk.",
            translation: "The man is typing on a laptop at his desk.",
            imageAssetId: IMAGE_1,
          },
          {
            questionId: "q2",
            number: 2,
            part: 1,
            stem: null,
            optionA: "Option A",
            optionB: "Option B",
            optionC: "Option C",
            optionD: "Option D",
            userSelectedKey: "A",
            correctKey: "A",
            status: "correct",
            isFlagged: false,
            explanation: "Correct answer is A.",
            translation: null,
            imageAssetId: null,
          },
        ],
      },
      {
        id: "block-5",
        part: 5,
        firstQuestionNumber: 101,
        audioAssetId: null,
        audioDurationMs: null,
        contextBlocks: [],
        questions: [
          {
            questionId: "q101",
            number: 101,
            part: 5,
            stem: "The quarterly report was ____ before noon.",
            optionA: "submit",
            optionB: "submitted",
            optionC: "submitting",
            optionD: "submission",
            userSelectedKey: "B",
            correctKey: "B",
            status: "correct",
            isFlagged: false,
            explanation: "Passive voice requires the past participle.",
            translation: "The quarterly report was submitted before noon.",
            imageAssetId: null,
          },
        ],
      },
    ],
  };
}

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

async function saveScreenshot(page: Page, filename: string) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, filename),
    fullPage: false,
  });
}

test.describe("LR Audio Architecture E2E & Visual Guardrails", () => {
  test.beforeEach(async ({ context }) => {
    await loginAsUser(context);
  });

  test("Exam room renders single ListeningMasterPlayer, preloads playlist sequentially, and passes desktop & mobile geometry", async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));

    let playlistCalls = 0;
    let legacyAudioCalls = 0;

    await page.route(`**/api/lr/exam-attempts/${ATTEMPT_ID}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(buildListeningSheet()),
      });
    });

    await page.route(
      `**/api/lr/exam-attempts/${ATTEMPT_ID}/listening-audio-urls`,
      async (route) => {
        playlistCalls += 1;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            items: [
              {
                blockId: "block-1",
                part: 1,
                firstQuestionNumber: 1,
                audioAssetId: ASSET_1,
                durationMs: 15_000,
                url: "https://minio.example.test/p1.wav",
                expiresAtUtc: "2026-11-19T12:00:00Z",
              },
              {
                blockId: "block-2",
                part: 3,
                firstQuestionNumber: 32,
                audioAssetId: ASSET_2,
                durationMs: 20_000,
                url: "https://minio.example.test/p3.wav",
                expiresAtUtc: "2026-11-19T12:00:00Z",
              },
            ],
          }),
        });
      },
    );

    await page.route(
      `**/api/lr/exam-attempts/${ATTEMPT_ID}/images/${IMAGE_1}`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            url: "https://minio.example.test/q1.png",
            expiresAtUtc: "2026-11-19T12:00:00Z",
          }),
        });
      },
    );

    await page.route(
      `**/api/lr/exam-attempts/${ATTEMPT_ID}/audio/**`,
      async (route) => {
        legacyAudioCalls += 1;
        await route.abort();
      },
    );

    await page.route("https://minio.example.test/*.wav", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "audio/wav",
        headers: { "Access-Control-Allow-Origin": "*" },
        body: SAMPLE_WAV,
      });
    });

    await page.route("https://minio.example.test/q1.png", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "image/png",
        headers: { "Access-Control-Allow-Origin": "*" },
        body: ONE_BY_ONE_PNG,
      });
    });

    // Desktop 1440x900
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/exams/lr/attempts/${ATTEMPT_ID}/attempt`);

    const masterPlayer = page.getByTestId("lr-master-audio-player");
    await expect(masterPlayer).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Listening audio player" }),
    ).toBeVisible();
    await expect(page.locator("audio")).toHaveCount(1);
    await expect(masterPlayer.locator('input[type="range"]')).toHaveCount(0);

    const toggle = page.getByTestId("lr-master-audio-toggle");
    await expect(toggle).toHaveAccessibleName("Start Listening Audio");
    await expect(page.getByTestId("lr-master-audio-time")).toHaveText(
      /00:00\s*\/\s*00:\d{2}/,
    );

    expect(playlistCalls).toBe(1);
    expect(legacyAudioCalls).toBe(0);

    await assertCleanDomGeometry(page);
    await saveScreenshot(page, "01-desktop-default-1440x900.png");

    // Start playback on desktop (ETS lock: cannot pause once started)
    await toggle.click();
    await expect(toggle).toHaveAccessibleName("Playing · Pause Locked");
    await expect(toggle).toBeDisabled();

    // Mobile 390x844
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(masterPlayer).toBeVisible();
    const toggleBox = await toggle.boundingBox();
    expect(toggleBox?.height ?? 0).toBeGreaterThanOrEqual(44);
    await saveScreenshot(page, "02-mobile-default-390x844.png");
    await assertCleanDomGeometry(page);

    expect(pageErrors).toEqual([]);
  });

  test("Review mode lazy-loads & caches audio by assetId, supports seek and speed, and hides player for Part 5-7", async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));

    let audioFetchCount = 0;

    await page.route(
      `**/api/lr/exam-attempts/${ATTEMPT_ID}/review*`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(buildReviewPayload()),
        });
      },
    );

    await page.route(
      `**/api/lr/exam-attempts/${ATTEMPT_ID}/images/${IMAGE_1}`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            url: "https://minio.example.test/q1.png",
            expiresAtUtc: "2026-11-19T12:00:00Z",
          }),
        });
      },
    );

    await page.route(
      `**/api/lr/exam-attempts/${ATTEMPT_ID}/audio/${ASSET_1}`,
      async (route) => {
        audioFetchCount += 1;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            url: "https://minio.example.test/review-p1.wav",
            expiresAtUtc: "2026-11-19T12:00:00Z",
          }),
        });
      },
    );

    await page.route("https://minio.example.test/q1.png", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "image/png",
        headers: { "Access-Control-Allow-Origin": "*" },
        body: ONE_BY_ONE_PNG,
      });
    });

    await page.route(
      "https://minio.example.test/review-p1.wav",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "audio/wav",
          headers: { "Access-Control-Allow-Origin": "*" },
          body: SAMPLE_WAV,
        });
      },
    );

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/exams/lr/attempts/${ATTEMPT_ID}/review`);

    const reviewPlayer = page.getByTestId("lr-review-audio-player");
    await expect(reviewPlayer).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Question review audio" }),
    ).toBeVisible();
    await expect(reviewPlayer).toContainText(/00:00\s*\/\s*00:45/);
    expect(audioFetchCount).toBe(0);

    // Lazy-fetch audio on first Play click
    const reviewToggle = page.getByTestId("lr-review-audio-toggle");
    await reviewToggle.click();
    await expect.poll(() => audioFetchCount).toBe(1);

    // Playback rate 0.8x / 1.0x / 1.2x
    const speedControl = page.getByTestId("lr-review-audio-speed");
    await speedControl.selectOption("1.2");
    await expect(speedControl).toHaveValue("1.2");

    // Seekbar present & interactive
    const seekbar = page.getByTestId("lr-review-audio-seek");
    await expect(seekbar).toBeVisible();
    await seekbar.fill("1");

    await assertCleanDomGeometry(page);
    await saveScreenshot(page, "03-interactive-or-modal-state.png");
    await expect(reviewPlayer.getByRole("alert")).toHaveCount(0);

    // Switch to Q2 (same audioAssetId) -> reuses cache
    await page.getByRole("button", { name: /^Question 2\b/ }).click();
    await page.getByTestId("lr-review-audio-toggle").click();
    expect(audioFetchCount).toBe(1);

    // Switch to Part 5 Q101 -> ReviewAudioPlayer must NOT render
    await page.getByRole("button", { name: /^Question 101\b/ }).click();
    await expect(page.getByTestId("lr-review-audio-player")).toHaveCount(0);

    expect(pageErrors).toEqual([]);
  });

  test("Review mode surfaces accessible alert when lazy-loading audio fails", async ({
    page,
  }) => {
    await page.route(
      `**/api/lr/exam-attempts/${ATTEMPT_ID}/review*`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(buildReviewPayload()),
        });
      },
    );

    await page.route(
      `**/api/lr/exam-attempts/${ATTEMPT_ID}/images/${IMAGE_1}`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            url: "https://minio.example.test/q1.png",
            expiresAtUtc: "2026-11-19T12:00:00Z",
          }),
        });
      },
    );

    await page.route("https://minio.example.test/q1.png", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "image/png",
        headers: { "Access-Control-Allow-Origin": "*" },
        body: ONE_BY_ONE_PNG,
      });
    });

    await page.route(
      `**/api/lr/exam-attempts/${ATTEMPT_ID}/audio/${ASSET_1}`,
      async (route) => {
        await route.fulfill({
          status: 502,
          contentType: "application/json",
          body: JSON.stringify({ message: "Unable to load review audio." }),
        });
      },
    );

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/exams/lr/attempts/${ATTEMPT_ID}/review`);

    await page.getByTestId("lr-review-audio-toggle").click();
    const alert = page.getByTestId("lr-review-audio-player").getByRole("alert");
    await expect(alert).toBeVisible();

    await assertCleanDomGeometry(page);
    await saveScreenshot(page, "04-empty-or-error-state.png");
  });
});
