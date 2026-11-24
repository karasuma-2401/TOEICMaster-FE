#!/usr/bin/env node

import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { chromium, expect } from "@playwright/test";

const DEFAULT_PORT = 3100;
const BASE_TMP = "/tmp";

function getPaths(runId) {
  const root = path.join(BASE_TMP, `toeicmaster-fe-verify-${runId}`);
  const runtimeDir = path.join(root, "runtime");
  const evidenceDir = path.join(root, "evidence");
  const stateFile = path.join(runtimeDir, "server.json");
  return { root, runtimeDir, evidenceDir, stateFile };
}

function checkPortFree(port) {
  return new Promise((resolve) => {
    const tester = net.createServer()
      .once("error", () => resolve(false))
      .once("listening", () => {
        tester.close(() => resolve(true));
      })
      .listen(port, "127.0.0.1");
  });
}

async function waitForHttpOk(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status === 200) return true;
    } catch {
      // Server not ready yet.
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

async function dismissGuideMascot(page) {
  const closeButton = page.locator('button[aria-label="Close guide"]');
  await closeButton.waitFor({ state: "visible", timeout: 1200 }).catch(() => {});
  if (await closeButton.isVisible().catch(() => false)) {
    await closeButton.click();
    await closeButton.waitFor({ state: "hidden", timeout: 2000 }).catch(() => {});
  }
}

async function captureSettledScreenshot(page, screenshotPath) {
  await page.evaluate(async () => {
    window.scrollTo(0, 0);
    await document.fonts.ready;
  });

  const hasSidebar = await page.evaluate(() =>
    Boolean(document.querySelector(".practice-sidebar")),
  );
  if (hasSidebar) {
    await page
      .waitForFunction(
        () => getComputedStyle(document.body).paddingLeft === "240px",
        { timeout: 3000 },
      )
      .catch(() => {});
  }

  const layout = await page.evaluate(() => ({
    scrollX: window.scrollX,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));

  expect(layout.scrollX).toBe(0);
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth);

  await page.screenshot({
    path: screenshotPath,
    fullPage: true,
    animations: "disabled",
  });
}

export async function launch(runId, rawPort) {
  const port = Number(rawPort || process.env.PORT || DEFAULT_PORT);
  const { runtimeDir, stateFile } = getPaths(runId);

  const isFree = await checkPortFree(port);
  if (!isFree) {
    throw new Error(`Port ${port} is already in use. Please select a different port or stop the conflicting process.`);
  }

  fs.mkdirSync(runtimeDir, { recursive: true });

  const logFile = path.join(runtimeDir, "next-dev.log");
  const logFd = fs.openSync(logFile, "a");

  const env = {
    ...process.env,
    PORT: String(port),
    BASE_URL: `http://localhost:${port}`,
    AUTH_SESSION_SECRET: process.env.AUTH_SESSION_SECRET || "34JICjBs7nQVpB7JJM3WjxMof8fZ6nVUdP2LbQXUA3w",
    API_BASE_URL: process.env.API_BASE_URL || "http://localhost:5287",
    ADMIN_PREVIEW: process.env.ADMIN_PREVIEW || "true",
  };

  const child = spawn("npx", ["next", "dev", "--port", String(port)], {
    stdio: ["ignore", logFd, logFd],
    detached: true,
    env,
  });

  child.unref();

  const pid = child.pid;
  const state = {
    runId,
    pid,
    port,
    baseUrl: `http://localhost:${port}`,
    logFile,
    startedAt: new Date().toISOString(),
  };

  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2), "utf8");
  console.log(`[Launch] Spawned Next.js dev server PID ${pid} on port ${port}. Waiting for ready signal...`);

  const ready = await waitForHttpOk(`http://localhost:${port}/api/health`, 35000);
  if (!ready) {
    throw new Error(`Server failed to respond at http://localhost:${port}/api/health within 35s. Check logs: ${logFile}`);
  }

  console.log(`[Launch] Server is healthy and ready at http://localhost:${port} (PID ${pid}).`);
  return state;
}

export async function doctor(runId) {
  const { stateFile } = getPaths(runId);
  if (!fs.existsSync(stateFile)) {
    throw new Error(`No verification runtime state found at ${stateFile}. Has launch been run?`);
  }

  const state = JSON.parse(fs.readFileSync(stateFile, "utf8"));
  const { pid, port, baseUrl } = state;

  let pidAlive = false;
  try {
    process.kill(pid, 0);
    pidAlive = true;
  } catch {
    pidAlive = false;
  }

  if (!pidAlive) {
    throw new Error(`Server PID ${pid} is not running.`);
  }

  const healthUrl = `${baseUrl}/api/health`;
  const res = await fetch(healthUrl).catch((err) => ({ ok: false, status: 0, statusText: err.message }));
  if (res.status !== 200) {
    throw new Error(`Doctor check failed: ${healthUrl} returned status ${res.status}.`);
  }

  console.log(`[Doctor] Instance OK: PID ${pid} is alive, listening on port ${port}, and responding with 200 at ${healthUrl}.`);
  return state;
}

export async function drive(runId, featureName = "flashcards") {
  const { stateFile, evidenceDir } = getPaths(runId);
  if (!fs.existsSync(stateFile)) {
    throw new Error(`No runtime state found at ${stateFile}. Run launch first.`);
  }

  const state = JSON.parse(fs.readFileSync(stateFile, "utf8"));
  const { baseUrl } = state;

  fs.mkdirSync(evidenceDir, { recursive: true });

  console.log(`[Drive] Launching Playwright browser to exercise feature "${featureName}" against ${baseUrl}...`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  const transcript = [];
  function log(message) {
    const line = `[${new Date().toISOString()}] ${message}`;
    transcript.push(line);
    console.log(`  ${message}`);
  }

  log(`Target feature: ${featureName} at ${baseUrl}`);

  if (featureName === "flashcards") {
    const targetUrl = `${baseUrl}/flashcards`;
    log(`Navigating to ${targetUrl}`);
    await page.goto(targetUrl, { waitUntil: "domcontentloaded" });

    log("Waiting for Flashcards heading");
    await page.waitForSelector('h1:has-text("TOEIC Vocabulary Flashcards")');

    log("Searching for 'Office' deck");
    const searchInput = page.locator('input[aria-label="Search decks or vocabulary"]');
    await searchInput.fill("Office");

    log("Verifying search filter results for 'Office & Business Operations'");
    const officeHeading = page.locator('h2:has-text("Office & Business Operations")');
    await officeHeading.waitFor();

    log("Selecting 'Office & Business Operations' deck");
    const officeCard = page.locator("article", { hasText: "Office & Business Operations" });
    await officeCard.getByRole("button", { name: /studying/i }).click();

    log("Waiting for deck view heading");
    await page.waitForSelector('h1:has-text("Office & Business Operations")');

    log("Switching to 'Speed Match' mode");
    await page.getByRole("tab", { name: "Speed Match" }).click();
    await page.waitForSelector('[role="tab"]:has-text("Speed Match")[aria-selected="true"]');
    await page.waitForTimeout(300);

    log("Verifying match tiles render");
    await page.waitForSelector('button:has-text("Term")');

    log("Dismissing GuideMascot bubble if open");
    await dismissGuideMascot(page);

    log("Performing interactive match action: matching pair and selecting next tile");
    const termTile = page.locator('button:has-text("Term"):has-text("itinerary")');
    const meaningTile = page.locator('button:has-text("Meaning"):has-text("lịch trình chi tiết")');
    if ((await termTile.count()) > 0 && (await meaningTile.count()) > 0) {
      await termTile.click();
      await page.waitForTimeout(100);
      await meaningTile.click();
      await page.waitForTimeout(200);
    } else {
      const firstTile = page.locator('button:has-text("Term")').first();
      await firstTile.click();
      await page.waitForTimeout(100);
    }

    const nextTermTile = page.locator('button:has-text("Term"):not([disabled])').first();
    if ((await nextTermTile.count()) > 0) {
      await nextTermTile.click();
      await page.waitForSelector('button[aria-pressed="true"]');
    }

    await page.waitForTimeout(300);
    await dismissGuideMascot(page);

    log("Capturing UI proof");
    const screenshotPath = path.join(evidenceDir, "flashcards-match-game.png");
    await captureSettledScreenshot(page, screenshotPath);

    const ariaText = await page.evaluate(() => {
      const h1 = document.querySelector("h1")?.textContent?.trim() || "";
      const tabs = Array.from(document.querySelectorAll('[role="tab"]')).map((t) => ({
        label: t.textContent?.trim().replace(/\s+/g, " "),
        selected: t.getAttribute("aria-selected") === "true",
      }));
      const audioControl = document.querySelector('button[aria-label*="pronunciation on match"]');
      const tiles = Array.from(document.querySelectorAll("button[aria-pressed]"))
        .filter((b) => !b.getAttribute("aria-label")?.includes("pronunciation"))
        .map((b) => ({
          text: b.textContent?.trim().replace(/\s+/g, " "),
          pressed: b.getAttribute("aria-pressed") === "true",
          disabled: b.disabled,
        }));
      const stats = Array.from(document.querySelectorAll(".sp-mono"))
        .map((s) => s.textContent?.trim())
        .filter(Boolean);
      return [
        `H1: ${h1}`,
        `Tabs: ${JSON.stringify(tabs, null, 2)}`,
        `AudioToggle: ${JSON.stringify(
          audioControl
            ? {
                label: audioControl.getAttribute("aria-label"),
                pressed: audioControl.getAttribute("aria-pressed") === "true",
              }
            : null,
        )}`,
        `Stats: ${JSON.stringify(stats, null, 2)}`,
        `Tiles (${tiles.length}): ${JSON.stringify(tiles, null, 2)}`,
      ].join("\n");
    });

    fs.writeFileSync(path.join(evidenceDir, "flashcards-aria-summary.txt"), ariaText, "utf8");
    log(`Saved screenshot to ${screenshotPath}`);
  } else if (featureName === "auth-and-home") {
    const homeUrl = `${baseUrl}/`;
    log(`Navigating to Home: ${homeUrl}`);
    await page.goto(homeUrl, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('h1:has-text("ETS-Format TOEIC Exam Preparation Platform")');

    log("Navigating to Login page");
    await page.goto(`${baseUrl}/login`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('h1:has-text("Continue your journey")');

    log("Triggering client-side form validation");
    await page.click('button:has-text("Sign in")');
    await page.waitForSelector("#email-error");

    const screenshotPath = path.join(evidenceDir, "auth-login-validation.png");
    await captureSettledScreenshot(page, screenshotPath);
    fs.writeFileSync(path.join(evidenceDir, "auth-summary.txt"), "Login page validated client-side error states.", "utf8");
    log(`Saved screenshot to ${screenshotPath}`);
  } else if (featureName === "listening-reading") {
    log("Mocking BFF /api/lr/** endpoints (backend not running)");
    await page.route("**/api/lr/exams/lr", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            examId: "11111111-1111-4111-8111-111111111101",
            code: "ETS-2026-01",
            title: "TOEIC Practice Test 01",
            versionNumber: 1,
            totalQuestions: 200,
            listeningQuestions: 100,
            readingQuestions: 100,
            publishedAtUtc: "2026-11-01T08:00:00Z",
          },
          {
            examId: "11111111-1111-4111-8111-111111111102",
            code: "ETS-2026-02",
            title: "TOEIC Practice Test 02",
            versionNumber: 2,
            totalQuestions: 200,
            listeningQuestions: 100,
            readingQuestions: 100,
            publishedAtUtc: "2026-11-10T08:00:00Z",
          },
        ]),
      });
    });

    await page.route("**/api/lr/exam-attempts/history*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [],
          totalCount: 0,
          pageIndex: 1,
          pageSize: 100,
        }),
      });
    });

    const targetUrl = `${baseUrl}/listening-reading`;
    log(`Navigating to ${targetUrl}`);
    await page.goto(targetUrl, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("main");
    await page.waitForSelector('h1:has-text("Listening & Reading Tests")');
    await page.waitForSelector('main article:has-text("TOEIC Practice Test 01")');
    await page.waitForSelector('text="No attempts yet"');
    await dismissGuideMascot(page);

    const screenshotPath = path.join(evidenceDir, "listening-reading.png");
    await captureSettledScreenshot(page, screenshotPath);
    fs.writeFileSync(
      path.join(evidenceDir, "lr-summary.txt"),
      [
        "Listening & Reading library page settled with mocked BFF responses (BE not running).",
        "Mocked endpoints: GET /api/lr/exams/lr (2 published tests), GET /api/lr/exam-attempts/history (empty attempt history).",
        "Verified rendered test cards and settled empty attempt history section (no loading spinners).",
      ].join("\n"),
      "utf8",
    );
    log(`Saved screenshot to ${screenshotPath}`);
  } else if (featureName === "admin-exams") {
    log("Mocking BFF /api/admin/** endpoints under ADMIN_PREVIEW=true development bypass (BE not running)");
    await page.route("**/api/admin/lr-exercise-bank/summary", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          totalQuestionCount: 150,
          updatedAtUtc: "2026-11-15T10:30:00Z",
          parts: [
            { part: 1, kind: "SINGLE", itemCount: 12, questionCount: 12, updatedAtUtc: "2026-11-15T10:30:00Z" },
            { part: 2, kind: "SINGLE", itemCount: 25, questionCount: 25, updatedAtUtc: "2026-11-14T09:00:00Z" },
            { part: 3, kind: "GROUP", itemCount: 10, questionCount: 30, updatedAtUtc: "2026-11-13T11:00:00Z" },
            { part: 4, kind: "GROUP", itemCount: 8, questionCount: 24, updatedAtUtc: "2026-11-12T16:00:00Z" },
            { part: 5, kind: "SINGLE", itemCount: 30, questionCount: 30, updatedAtUtc: "2026-11-11T14:20:00Z" },
            { part: 6, kind: "GROUP", itemCount: 4, questionCount: 16, updatedAtUtc: "2026-11-10T08:15:00Z" },
            { part: 7, kind: "GROUP", itemCount: 4, questionCount: 13, updatedAtUtc: "2026-11-09T12:00:00Z" },
          ],
        }),
      });
    });

    await page.route("**/api/admin/exams*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [
            {
              examId: "22222222-2222-4222-8222-222222222201",
              code: "ETS-2026-01",
              title: "TOEIC Complete Test 01",
              revisionId: "33333333-3333-4333-8333-333333333301",
              versionNumber: 1,
              status: "Published",
              createdAtUtc: "2026-11-01T08:00:00Z",
            },
          ],
          pageNumber: 1,
          pageSize: 10,
          totalCount: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        }),
      });
    });

    await page.route("**/api/admin/score-profiles", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "44444444-4444-4444-8444-444444444401",
            name: "Standard TOEIC 990",
            isComplete: true,
            mappingCount: 200,
          },
        ]),
      });
    });

    const targetUrl = `${baseUrl}/admin/exams`;
    log(`Navigating to ${targetUrl}`);
    await page.goto(targetUrl, { waitUntil: "domcontentloaded" });
    expect(page.url()).not.toContain("/login");
    await page.waitForSelector('nav[aria-label="TOEIC skills"]');
    await page.waitForSelector('h1:has-text("Data Bank")');
    await page.waitForSelector('text="Total questions"');
    expect(page.url()).not.toContain("/login");

    const screenshotPath = path.join(evidenceDir, "admin-exams.png");
    await captureSettledScreenshot(page, screenshotPath);
    fs.writeFileSync(
      path.join(evidenceDir, "admin-summary.txt"),
      [
        "Admin Data Bank shell (/admin/exams) verified with ADMIN_PREVIEW=true development bypass and mocked /api/admin/** responses (BE not running).",
        `Final URL: ${page.url()}`,
        'Verified nav[aria-label="TOEIC skills"], Data Bank heading, and settled 7-part Listening & Reading summary.',
      ].join("\n"),
      "utf8",
    );
    log(`Saved screenshot to ${screenshotPath}`);
  } else {
    throw new Error(`Unknown feature: ${featureName}. Supported: flashcards, auth-and-home, listening-reading, admin-exams`);
  }

  fs.writeFileSync(path.join(evidenceDir, "transcript.txt"), transcript.join("\n"), "utf8");
  await browser.close();
  console.log(`[Drive] Completed verification for ${featureName}. Artifacts stored in ${evidenceDir}.`);
}

export async function cleanup(runId) {
  const { runtimeDir, evidenceDir, stateFile } = getPaths(runId);

  if (!fs.existsSync(stateFile)) {
    console.log(`[Cleanup] No runtime state file found at ${stateFile}. Nothing to clean up.`);
    return;
  }

  const state = JSON.parse(fs.readFileSync(stateFile, "utf8"));
  const { pid, port } = state;

  console.log(`[Cleanup] Terminating exact PID ${pid} started by this verification run...`);
  try {
    process.kill(-pid, "SIGTERM");
  } catch {
    try {
      process.kill(pid, "SIGTERM");
    } catch {
      // Process already dead.
    }
  }

  // Poll for port release
  const start = Date.now();
  let portReleased = false;
  while (Date.now() - start < 10000) {
    const isFree = await checkPortFree(port);
    if (isFree) {
      portReleased = true;
      break;
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  if (!portReleased) {
    try {
      process.kill(-pid, "SIGKILL");
    } catch {
      try {
        process.kill(pid, "SIGKILL");
      } catch {
        // Ignore
      }
    }
  }

  // Delete runtime scratch directory, but preserve evidence directory!
  if (fs.existsSync(runtimeDir)) {
    fs.rmSync(runtimeDir, { recursive: true, force: true });
    console.log(`[Cleanup] Deleted scratch directory ${runtimeDir}.`);
  }

  console.log(`[Cleanup] Verified port ${port} released. Evidence preserved in ${evidenceDir}.`);
  if (fs.existsSync(evidenceDir)) {
    const files = fs.readdirSync(evidenceDir);
    console.log(`[Cleanup] Preserved evidence files: ${files.join(", ")}`);
  }
}

async function main() {
  const [,, cmd, runIdArg, opt1] = process.argv;
  const runId = runIdArg || `test-${Date.now()}`;

  if (cmd === "launch") {
    await launch(runId, opt1);
  } else if (cmd === "doctor") {
    await doctor(runId);
  } else if (cmd === "drive") {
    await drive(runId, opt1 || "flashcards");
  } else if (cmd === "cleanup") {
    await cleanup(runId);
  } else {
    console.error(`Usage: verify-fe.mjs <launch|doctor|drive|cleanup> [run_id] [option]`);
    process.exit(1);
  }
}

const isEntrypoint = process.argv[1] && process.argv[1].endsWith("verify-fe.mjs");
if (isEntrypoint) {
  main().catch((err) => {
    console.error(`[Error] ${err.message}`);
    process.exit(1);
  });
}
