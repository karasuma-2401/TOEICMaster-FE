# Listening and Reading

The Listening and Reading exam section provides access to standardized full-length TOEIC test simulations and section-based practice tests, presenting question matrices, audio streams, and timed attempt flows.

## Sub-features

- `lr-library-browse`: Catalog of published Listening and Reading tests with target score categories and question counts.
- `lr-mode-filter`: Filter tabs allowing learners to switch between full 200-question practice tests and focused part-by-part exercises.
- `lr-attempt-flow`: Dedicated exam attempt workspace featuring sequential audio players, passage contexts, and answer matrix controls.
- `lr-result-review`: Detailed answer review screen comparing selected choices with correct keys, transcripts, and explanations.

## How to get to it (user POV)

- From the homepage, click "Browse tests" under the Listening & Reading card, or navigate directly to `/listening-reading`.
- Toggle between full exam simulations and targeted part practice via the section tabs.
- Select a specific exam card to enter its overview page at `/exams/lr/[examId]`, and choose "Start test" to begin.

## Driving it with Playwright

Preconditions:
- The frontend server is launched and listening at `BASE_URL`.
- If testing with a mock backend, route `/api/lr/**` to return deterministic exam fixture payloads.

1. Navigate to the Listening & Reading library:
   `await page.goto(`${BASE_URL}/listening-reading`, { waitUntil: "domcontentloaded" });`
   Verify that the main practice layout and library container are visible.

2. Verify navigation and breadcrumb indicators:
   `await expect(page.getByRole("main")).toBeVisible();`
   `await expect(page.getByRole("link", { name: "Home" })).toBeVisible();`

3. When connected to a live or mocked backend, select a test:
   `const examCard = page.locator("main article").first();`
   `if (await examCard.isVisible()) await examCard.getByRole("link", { name: /Start/i }).click();`

4. Capture screenshot and library state:
   `await page.screenshot({ path: `${EVIDENCE_DIR}/listening-reading.png`, fullPage: true });`

## Gotchas

- When the backend service is offline, the library shows a connection status banner and provides a retry button.
- Master Audio playback requires user interaction or browser media permissions in non-headless mode.
- In-flight listening progress is cached in session storage under `lr-listening-progress:${attemptId}`.
