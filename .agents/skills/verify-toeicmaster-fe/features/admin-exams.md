# Admin Exam Management

The Admin Exam Management console provides staff members and instructors with administrative tools for managing the TOEIC reading and listening data bank, importing exam revision content, publishing tests, and monitoring draft statuses.

## Sub-features

- `admin-data-bank`: Central workspace organizing reading tests, listening exercises, and shared audio/image assets.
- `admin-exam-list`: Paginated table displaying exam code, title, version, creation timestamp, and revision status (Draft, Published, Superseded).
- `admin-revision-editor`: Detailed editing suite for updating passage contexts, stems, options, and audio durations.
- `admin-excel-import`: Bulk upload wizard for importing exam spreadsheets and validating structure before publication.

## How to get to it (user POV)

- Authenticate as an administrator with the `ADMIN` role.
- Visit `/admin/exams` or use the Admin Portal link in the site footer.
- Switch between exam items, review draft revisions, or trigger excel import modals.

## Driving it with Playwright

Preconditions:
- The frontend server is launched and listening at `BASE_URL` with `ADMIN_PREVIEW=true` (development-mode bypass in `src/proxy.ts` / `src/features/admin/server/admin-preview.ts`) or a valid `ADMIN` session cookie.
- When the backend is not running, the driver mocks `GET /api/admin/lr-exercise-bank/summary`, `GET /api/admin/exams*`, and `GET /api/admin/score-profiles` via `page.route()`.

1. Navigate to the admin exams view:
   `await page.goto(`${BASE_URL}/admin/exams`, { waitUntil: "domcontentloaded" });`
   Assert `expect(page.url()).not.toContain("/login")` and verify that the Data Bank heading and summary settle.

2. Verify that administrative navigation tabs and main area are present:
   `await expect(page.getByRole("main")).toBeVisible();`
   `await expect(page.locator('nav[aria-label="TOEIC skills"]')).toBeVisible();`

3. When testing the Complete Tests tab with live or mock data, switch tabs and inspect the status filter:
   `await page.goto(`${BASE_URL}/admin/exams?tab=tests`, { waitUntil: "domcontentloaded" });`
   `const statusSelect = page.locator("#exam-status-filter");`
   `if (await statusSelect.isVisible()) await statusSelect.selectOption("Draft");`

4. Capture screenshot and administrative layout state:
   `await page.screenshot({ path: `${EVIDENCE_DIR}/admin-exams.png`, fullPage: true, animations: "disabled" });`

## Gotchas

- Unauthenticated requests or non-admin users attempting to access `/admin/**` routes are rejected with HTTP 403 or redirected to `/login` when backend authentication is enforced.
- When testing the UI without backend seed data, set `ADMIN_PREVIEW=true` or mock `/api/admin/exams` to provide fixture revisions.
- Exam revision statuses strictly adhere to the contract union: Draft, Published, and Superseded.
