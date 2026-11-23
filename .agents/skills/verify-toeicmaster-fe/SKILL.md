---
name: verify-toeicmaster-fe
description: "Drive and verify the TOEICMaster Next.js web application and BFF surface using Playwright. Use when proving user journeys, frontend bugfixes, UI accessibility, or API proxy regressions."
---

# Verify TOEICMaster Frontend

This skill provides a self-contained, automated harness for launching, driving, and proving user journeys on the TOEICMaster Next.js frontend and BFF edge.
It drives the real application the way a human learner or administrator does, capturing full-page screenshots and accessibility snapshots as proof.

## Surface and Stack

- **Surface:** Next.js 16 (App Router) web application, React 19 client components, and BFF server route handlers under `src/app/api/**`.
- **Harness:** Playwright with Chromium (headless or headed) driving stable ARIA roles and labels.
- **Port and Isolation:** Runs on a dedicated, isolated port (default `3100` or dynamic) to prevent collisions with existing development or container instances.

## Launch

Start an isolated instance of the Next.js frontend application for verification.
The harness assigns a unique `RUN_ID`, selects a free port, configures runtime environment variables, writes tracking metadata to `/tmp/toeicmaster-fe-verify-<run_id>/runtime/server.json`, and waits for the ready signal.

```bash
RUN_ID="verify-$(date +%s)"
PORT=3100
.agents/skills/verify-toeicmaster-fe/scripts/launch.sh "$RUN_ID" "$PORT"
```

The launch script starts `npx next dev --port $PORT` in the background with isolated output logging and polls `http://localhost:$PORT/api/health` until HTTP 200 is confirmed.

## Doctor

Perform a read-only health check to confirm the instance is worth driving.
This validates that the recorded process ID is active, the port is bound to our instance, and the health endpoint responds.

```bash
.agents/skills/verify-toeicmaster-fe/scripts/doctor.sh "$RUN_ID"
```

If the doctor check fails, inspect the launch log at `/tmp/toeicmaster-fe-verify-<run_id>/runtime/next-dev.log`.

## Drive

Drive user journeys using Playwright and capture observable UI and network outcomes.
The driver scripts load the feature recipes documented under `.agents/skills/verify-toeicmaster-fe/features/`.

```bash
# Drive the Flashcards Speed Match game and vocabulary workspace
.agents/skills/verify-toeicmaster-fe/scripts/drive.sh "$RUN_ID" flashcards

# Drive Authentication and Home page flows
.agents/skills/verify-toeicmaster-fe/scripts/drive.sh "$RUN_ID" auth-and-home

# Drive Listening and Reading library
.agents/skills/verify-toeicmaster-fe/scripts/drive.sh "$RUN_ID" listening-reading

# Drive Admin Exam Management
.agents/skills/verify-toeicmaster-fe/scripts/drive.sh "$RUN_ID" admin-exams
```

The harness interacts with elements through accessible queries (for example `getByRole`, `getByLabel`, `getByText`) and waits for stable DOM mutations rather than arbitrary sleep timers.

## Evidence

Every verification drive stores proof artifacts in a persistent directory that is never purged during teardown:

- Directory: `/tmp/toeicmaster-fe-verify-<run_id>/evidence/`
- Full-page screenshots: `screenshot.png` (or `<feature>-match-game.png`)
- DOM and ARIA snapshots: `aria-summary.txt`
- Execution logs: `transcript.txt`

Proof artifacts survive cleanup and remain available for inspection and audit reports.

## Cleanup

Tear down only the exact process started by the current verification run.
Cleanup checks `/tmp/toeicmaster-fe-verify-<run_id>/runtime/server.json`, sends SIGTERM to the exact PID, confirms the port is freed, and removes the `runtime/` scratch directory.
The `evidence/` directory is intentionally preserved.

```bash
.agents/skills/verify-toeicmaster-fe/scripts/cleanup.sh "$RUN_ID"
```

## Helpers

The following helper scripts are executable under `.agents/skills/verify-toeicmaster-fe/scripts/`:

- `verify-fe.mjs`: Core Node.js script implementing launch, doctor, drive, and cleanup logic.
- `launch.sh <run_id> [port]`: Wrapper to start the dev server and poll `/api/health`.
- `doctor.sh <run_id>`: Wrapper to verify instance readiness and port binding.
- `drive.sh <run_id> [feature]`: Wrapper to launch Playwright and exercise the named feature.
- `cleanup.sh <run_id>`: Wrapper to terminate the server, verify port release, and remove scratch state.
