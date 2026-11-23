#!/usr/bin/env node

import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { chromium } from "@playwright/test";

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
    AUTH_SESSION_SECRET: process.env.AUTH_SESSION_SECRET || "dGVzdC1zZWNyZXQtMzItYnl0ZXMtdmFsdWUtZm9yLWF1dGg=",
    API_BASE_URL: process.env.API_BASE_URL || "http://localhost:5287",
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

    log("Verifying match tiles render");
    await page.waitForSelector('button:has-text("Term")');

    log("Capturing UI proof");
    const screenshotPath = path.join(evidenceDir, "flashcards-match-game.png");
    await page.screenshot({ path: screenshotPath, fullPage: true });

    const ariaText = await page.evaluate(() => {
      const h1 = document.querySelector("h1")?.textContent?.trim() || "";
      const tabs = Array.from(document.querySelectorAll('[role="tab"]'))
        .map((t) => t.textContent?.trim().replace(/\s+/g, " "));
      const buttons = Array.from(document.querySelectorAll("button"))
        .map((b) => b.textContent?.trim().replace(/\s+/g, " "))
        .filter(Boolean)
        .slice(0, 15);
      return `H1: ${h1}\nTabs: ${JSON.stringify(tabs, null, 2)}\nTop Buttons: ${JSON.stringify(buttons, null, 2)}`;
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
    await page.waitForSelector('h2:has-text("Welcome back")');

    log("Triggering client-side form validation");
    await page.click('button:has-text("Sign in")');
    await page.waitForSelector("#email-error");

    const screenshotPath = path.join(evidenceDir, "auth-login-validation.png");
    await page.screenshot({ path: screenshotPath, fullPage: true });
    fs.writeFileSync(path.join(evidenceDir, "auth-summary.txt"), "Login page validated client-side error states.", "utf8");
    log(`Saved screenshot to ${screenshotPath}`);
  } else if (featureName === "listening-reading") {
    const targetUrl = `${baseUrl}/listening-reading`;
    log(`Navigating to ${targetUrl}`);
    await page.goto(targetUrl, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("main");

    const screenshotPath = path.join(evidenceDir, "listening-reading.png");
    await page.screenshot({ path: screenshotPath, fullPage: true });
    fs.writeFileSync(path.join(evidenceDir, "lr-summary.txt"), "Listening & Reading library page loaded.", "utf8");
    log(`Saved screenshot to ${screenshotPath}`);
  } else if (featureName === "admin-exams") {
    const targetUrl = `${baseUrl}/admin/exams`;
    log(`Navigating to ${targetUrl}`);
    await page.goto(targetUrl, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("main");

    const screenshotPath = path.join(evidenceDir, "admin-exams.png");
    await page.screenshot({ path: screenshotPath, fullPage: true });
    fs.writeFileSync(path.join(evidenceDir, "admin-summary.txt"), "Admin exams page loaded.", "utf8");
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
      process.kill(pid, "SIGKILL");
    } catch {
      // Ignore
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
