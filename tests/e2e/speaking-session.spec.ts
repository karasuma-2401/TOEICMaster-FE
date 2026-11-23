import { expect, test } from "@playwright/test";
import {
  attemptDto,
  exerciseDto,
  ids,
  testSummaryDto,
} from "../../src/features/speaking/testing/fixtures";

declare global {
  interface Window {
    __micCalls: number;
    __trackStops: number;
  }
}

test("Speaking keeps one capture stream across device check and eleven answers", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.addInitScript(() => {
    const state = window as Window & {
      __micCalls: number;
      __trackStops: number;
    };
    state.__micCalls = 0;
    state.__trackStops = 0;
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      value: async () => {
        state.__micCalls++;
        const context = new AudioContext();
        await context.resume();
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        gain.gain.value = 0.4;
        const destination = context.createMediaStreamDestination();
        oscillator.connect(gain).connect(destination);
        oscillator.start();
        for (const track of destination.stream.getTracks()) {
          const stop = track.stop.bind(track);
          track.stop = () => {
            state.__trackStops++;
            stop();
            oscillator.stop();
            void context.close();
          };
        }
        return destination.stream;
      },
    });
    Object.defineProperty(navigator.mediaDevices, "enumerateDevices", {
      value: async () => [],
    });
  });
  let phase = 0;
  let deadline = 0;
  let posted = 0;
  const recordings = new Map<number, number>();
  const parts = [1, 1, 2, 2, 3, 3, 3, 4, 4, 4, 5] as const;
  const snapshot = () => {
    const complete = phase >= 22;
    return attemptDto({
      mode: "FULL",
      status: complete ? "SUBMITTED" : "IN_PROGRESS",
      currentQuestionPosition: complete ? null : Math.floor(phase / 2) + 1,
      currentPhase: complete ? null : phase % 2 ? "RESPONDING" : "PREPARING",
      phaseEndsAtUtc: complete ? null : new Date(deadline).toISOString(),
      createdAtUtc: new Date(Date.now() - 60000).toISOString(),
      serverNowUtc: new Date().toISOString(),
      submittedAtUtc: complete ? new Date().toISOString() : null,
      questions: parts.map((part, index) => ({
        position: index + 1,
        part,
        questionIndex: part === 3 ? index - 4 : part === 4 ? index - 7 : 0,
        readingSeconds: 0,
        preparationSeconds: 1,
        responseSeconds: 2,
        lockedAtUtc:
          complete || index < Math.floor(phase / 2)
            ? new Date().toISOString()
            : null,
        recording: recordings.has(index + 1)
          ? { durationSeconds: 2, uploadedAtUtc: new Date().toISOString() }
          : null,
        content: exerciseDto(part),
      })),
    });
  };
  await page.route("**/api/speaking/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === `/api/speaking/tests/${ids.test}`)
      return route.fulfill({ json: testSummaryDto() });
    if (
      path === "/api/speaking/attempts" &&
      route.request().method() === "POST"
    ) {
      posted++;
      deadline = Date.now() + 2000;
      return route.fulfill({ status: 201, json: snapshot() });
    }
    const recording = /\/recordings\/(\d+)$/.exec(path);
    if (recording && route.request().method() === "PUT") {
      recordings.set(
        Number(recording[1]),
        route.request().postDataBuffer()?.length ?? 0,
      );
      return route.fulfill({ json: snapshot() });
    }
    if (path === `/api/speaking/attempts/${ids.attempt}`) {
      if (phase < 22 && Date.now() >= deadline) {
        phase++;
        deadline = Date.now() + (phase % 2 ? 1800 : 1000);
      }
      return route.fulfill({ json: snapshot() });
    }
    if (path === "/api/speaking/attempts")
      return route.fulfill({ json: { items: [] } });
    if (path.endsWith("evaluation-availability"))
      return route.fulfill({ json: { available: false } });
    if (path.includes("/media/")) return route.fulfill({ status: 404 });
    return route.fulfill({ status: 404, json: { title: "No fixture" } });
  });
  await page.goto(`/speaking/tests/${ids.test}/practice`);
  await expect(
    page.getByRole("button", { name: "Start test →" }),
  ).toBeDisabled();
  expect(posted).toBe(0);
  expect(
    await page.evaluate(
      () => (window as Window & { __micCalls: number }).__micCalls,
    ),
  ).toBe(0);
  await page.getByRole("button", { name: "Allow microphone" }).click();
  await page.getByRole("button", { name: "Record 5-second test" }).click();
  const audio = page.getByLabel("Test recording");
  await expect(audio).toBeVisible({ timeout: 10000 });
  await audio.evaluate((element: HTMLAudioElement) => element.play());
  await expect(
    page.getByRole("button", { name: "I can hear my recording clearly" }),
  ).toBeEnabled({ timeout: 10000 });
  await page
    .getByRole("button", { name: "I can hear my recording clearly" })
    .click();
  await page.getByRole("button", { name: "Start test →" }).click();
  await expect(page).toHaveURL(
    new RegExp(`/speaking/attempts/${ids.attempt}$`),
  );
  await expect.poll(() => recordings.size, { timeout: 60000 }).toBe(11);
  expect([...recordings.values()].every((size) => size > 0)).toBe(true);
  expect(
    await page.evaluate(
      () => (window as Window & { __micCalls: number }).__micCalls,
    ),
  ).toBe(1);
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as Window & { __trackStops: number }).__trackStops,
      ),
    )
    .toBe(1);
});

test("opening a submitted Speaking attempt never requests a microphone", async ({
  page,
}) => {
  await page.addInitScript(() => {
    (window as Window & { __micCalls: number }).__micCalls = 0;
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      value: async () => {
        (window as Window & { __micCalls: number }).__micCalls++;
        throw new Error("Submitted attempts must not capture audio");
      },
    });
  });
  await page.route("**/api/speaking/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith(ids.attempt))
      return route.fulfill({
        json: attemptDto({
          status: "SUBMITTED",
          currentPhase: null,
          currentQuestionPosition: null,
          phaseEndsAtUtc: null,
          submittedAtUtc: new Date().toISOString(),
        }),
      });
    if (path.endsWith("evaluation-availability"))
      return route.fulfill({ json: { available: false } });
    return route.fulfill({ json: { items: [] } });
  });
  await page.goto(`/speaking/attempts/${ids.attempt}`);
  await expect(page.getByText("Recordings completed")).toBeVisible();
  expect(
    await page.evaluate(
      () => (window as Window & { __micCalls: number }).__micCalls,
    ),
  ).toBe(0);
});
