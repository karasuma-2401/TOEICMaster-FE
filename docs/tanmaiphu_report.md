# QA Remediation Report: Tan Mai Phu (2026-11-25)

**Responds to:** QA Audit Action Report, Tan Mai Phu (2026-11-23)
**Branches:** `TOEICMaster-FE` `fix/qa-audit-tanmaiphu` (from `dev` @ `9bc9b5f`) · `TOEICMaster-BE` `fix/qa-audit-tanmaiphu` (from `4b21278`)
**Status:** changes are local on these branches and not yet committed or pushed.

## 1. Summary

| ID         | Severity | Result                                                         | Where                                                                           |
| :--------- | :------- | :------------------------------------------------------------- | :------------------------------------------------------------------------------ |
| CRIT-03    | CRITICAL | **Fixed**                                                      | Speaking admin builder/editor moved onto Radix Dialog                           |
| CRIT-02    | HIGH     | **Fixed**                                                      | `/admin/users`: "+ Add user" and row "•••" actions enabled and wired            |
| HIGH-01    | HIGH     | **Fixed**                                                      | `speaking-proxy.ts` forwards the trusted client IP                              |
| MED-09     | HIGH     | **Fixed** (Speaking) · **Already fixed upstream** (avatar)     | `speaking/server/upstream.ts`                                                   |
| HIGH-13    | HIGH     | **Fixed** (FE side)                                            | `speaking/parsers.ts` accepts `callerIntro: null`                               |
| HIGH-17    | HIGH     | **Fixed**                                                      | Speaking admin tables: overflow 459px → 0px, 85px → 0px                         |
| HIGH-19    | HIGH     | **Fixed**                                                      | Speaking CTA colors moved to a WCAG AA token                                    |
| MED-12     | MEDIUM   | **Fixed**                                                      | Pronunciation and Speaking clients now retry once after a 401 refresh           |
| MED-14     | MEDIUM   | **Fixed** (Speaking sub-scope)                                 | BE `SpeakingAttemptsController` declares 429 + snapshot synced                  |
| MED-16     | MEDIUM   | **Fixed**                                                      | `/profile` heading skip; Admin Users checkbox targets                           |
| MED-17     | MEDIUM   | **Fixed**                                                      | `use-speaking-attempt.ts` aborts in-flight requests                             |
| NEW-MED-08 | MEDIUM   | **Fixed**                                                      | `features/admin/api.ts` keeps ProblemDetails `code`/`detail`/`traceId`/`errors` |
| LOW-07     | LOW      | **Not reproducible in repo**: new Speaking specs added instead | see §5                                                                          |
| NEW-LOW-02 | LOW      | **Fixed** (dead code removed)                                  | Speaking Excel importer client/route/modal                                      |

## 2. CRITICAL

### CRIT-03: Speaking admin modal leaks Tab focus and shows the table behind it

- **Finding:** `create-test-modal.tsx` is not rendered anywhere. The overlay QA measured on `/admin/tests/speaking` is the test builder (`SpeakingTestWorkspace`, opened by "+ Create Speaking test"). It used the shared `AdminWorkspace` (`<dialog open>`, no focus trap).
- **Fix:**
  - New Speaking-owned `components/admin/speaking-workspace-dialog.tsx`, built on the shared Radix primitives (`Dialog`, `DialogPortal`, `DialogOverlay`, `DialogTitle`). It traps focus, hides the page from assistive tech (`aria-hidden`), locks scroll, sends Escape through `onClose` (the unsaved-changes guard still runs) and returns focus to the opener.
  - The overlay and surface are opaque (`--admin-page`), so the list is no longer visible behind the builder.
  - The portal targets the nearest `.sp-theme` ancestor, so Speaking fonts and tokens still apply.
  - Both `speaking-test-workspace.tsx` and `speaking-exercise-editor.tsx` now use it.
  - The orphaned `create-test-modal.tsx` was deleted, which also removes its `no-raw-dialog-open` violation.
- **Not changed:** the shared `admin-workspace.tsx`, `admin-overlay.tsx` and `admin-excel-import.tsx` (Nguyen Dang Khanh). Writing and other admin screens still use the native `<dialog open>`. `speaking-workspace-dialog.tsx` can serve as the migration reference.
- **Evidence:**
  - Playwright `tests/e2e/admin-speaking.spec.ts › test builder traps Tab focus…`: 8/8 Tab presses stay inside, the table is hidden, and focus returns to the opener after Escape.
  - Vitest `speaking-workspace-dialog.test.tsx` (2 tests).

## 3. HIGH

### CRIT-02: `/admin/users` add/row actions disabled

- "+ Add user" opens `CreateUserDialog` (full name, email, role, activation email) and calls `POST /api/admin/users`.
- The row "•••" is now a Radix `DropdownMenu` (keyboard accessible) with these actions:
  - Change role → `PATCH`
  - Lock / Unlock → `POST` / `DELETE /lock`
  - Send password reset → `POST /reset-password` (disabled for Google accounts)
  - Delete → `DELETE`
- Lock, unlock, reset and delete go through the shared `ConfirmDialog`. Change role and create use the shared `Dialog` and `FormField`.
- After a successful action the page shows a toast and reloads the list.
- **Files:** new `users-dialogs.tsx`; `users-page.tsx`; `users-table.tsx`.
- **Evidence:** Vitest `users-dialogs.test.tsx` (5), `users-page.test.tsx`, `users-table.test.tsx`; Playwright `tests/e2e/admin-users.spec.ts` (2).
- **For Nhat Minh Than:** the FE maps BE codes `LAST_ACTIVE_ADMIN`, `CANNOT_DEMOTE_SELF`, `CANNOT_LOCK_SELF`, `CANNOT_DELETE_SELF`, `PASSWORD_RESET_UNSUPPORTED_PROVIDER`, `USER_INACTIVE_OR_UNVERIFIED` and `PASSWORD_RESET_COOLDOWN` to user-facing messages. Any other code falls back to the ProblemDetails `detail`. No BE change was needed.

### HIGH-01: Guest Speaking evaluations share one rate-limit bucket

- `speaking-proxy.ts` now adds `extractForwardedClientHeaders()` from `shared/server/bff-proxy.ts`. It forwards a validated `X-Forwarded-For` (CF / Vercel / X-Real-IP / XFF priority) and `X-Forwarded-Proto`; invalid values are dropped.
- The backend base URL now comes from `resolveBackendBaseUrl()` (503 if invalid). The upstream fetch is also cancelled when the client disconnects (`AbortSignal.any([request.signal, timeout])`).
- **Remaining:** the proxy still calls `fetch` directly (baseline entry `no-raw-bff-fetch`) because the anonymous-session header and cookie are not supported by `forwardBffRequest`. Full migration needs an extra-headers/response hook in the shared proxy (Pham Hoang Thai).
- **Evidence:** `speaking-proxy.test.ts › forwards the trusted client IP…`.

### MED-09: Pre-auth / unbounded body buffering

- **`speaking/server/upstream.ts`:** `readForwardBody` now streams through the shared `readMultipartStream` (multipart) and `readBoundedJson` (JSON, 1 MiB cap). An oversized body is cancelled as soon as it passes the cap, even without `Content-Length`. Previously the whole body was read with `arrayBuffer()` / `json()` first. This covers both the learner proxy and the admin Speaking proxy.
- **`profile/avatar/route.ts`:** already fixed on `dev` by Pham Hoang Thai (`67cd923`). It checks origin and session before reading the body and uses `readMultipartStream`; `src/app/api/profile/avatar/route.test.ts` covers it. No change made.
- **Evidence:** tests for streamed and declared oversize uploads, and oversize JSON, in `speaking-proxy.test.ts` and `admin-speaking-proxy.test.ts`.

### HIGH-13: `"callerIntro": null` on DIRECT Part 4 → 502

- `parsers.ts` accepts `null | undefined | string` and normalizes it to `""`.
- **Evidence:** `parsers.test.ts › accepts a DIRECT Part 4 item serialized with "callerIntro": null`.
- **For Le Thang:** the BE DTO can keep `string?`; no contract change is required.

### HIGH-17: `/admin/content/speaking/part-1` overflows 459px / 85px

- **Root cause (measured in Chromium):** it was not a missing `min-w-0` on a flex ancestor. The table's `<span class="sr-only">Actions</span>` is `position:absolute`, and its containing block sat outside the `overflow-x-auto` box. The span was therefore positioned at the table's far right (~850px) without being clipped, which widened the whole document.
- **Fix:** the scroll containers in `speaking-exercise-table.tsx` and `speaking-tests-table.tsx` are now `relative min-w-0 overflow-x-auto`. No shared admin file needed changing.
- **Evidence:** Playwright `admin-speaking.spec.ts`. Before the fix: 459px at 390×844 and 85px at 768×1024 (QA's figures reproduced exactly). After: 0px at both sizes.
- **For Nguyen Dang Khanh:** any admin table with an `sr-only` header inside `overflow-x-auto` will show the same bug.

### HIGH-19: Speaking solid CTA contrast 3.57:1

- `speaking-theme.css` changes:

  | Token                    | Before             | After                                                             |
  | :----------------------- | :----------------- | :---------------------------------------------------------------- |
  | `--sp-brand-flat`        | `#e0602a` (3.57:1) | `var(--tm-brand)` `#c93b0b` (5.10:1 on white)                     |
  | `--sp-brand`             | `#df5a28` (3.73:1) | `var(--tm-brand)` (5.10:1 on white, 4.55:1 on `--sp-orange-soft`) |
  | `--sp-gradient` end stop | `#e36a22` (3.31:1) | `#c9480f` (4.75:1); start stop `#cc2f20` (5.26:1)                 |

- Ratios are computed with the WCAG 2.x relative-luminance formula. Live axe/Chromium re-measurement is still pending (§6).

## 4. MEDIUM

### MED-12: No 401 refresh in Pronunciation / learner Speaking

- `speaking/http.ts` now uses the shared `fetchWithAuthRefresh` (cross-tab lock, single retry, AbortSignal-safe). Refresh is on by default for every Speaking call.
- `pronunciation/api.ts` uses the same client. A failed refresh maps to `UNAUTHORIZED`; aborts pass through unchanged.
- The `refreshSession` / `navigator.locks` code duplicated in `speaking/http.ts` is removed.
- **Evidence:** `pronunciation/api.test.ts › refreshes the session once on 401 and retries the upload`.

### MED-14: 429 annotations (Speaking sub-scope)

- **BE:** `[ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests)]` on `GrantEvaluationConsent` and `UploadRecording`. The rate limiter already returns a ProblemDetails body with `traceId`.
- `docs/contracts/openapi.json` was regenerated (`UPDATE_OPENAPI_SNAPSHOT=1`); the diff is only these two responses.
- **FE:** `npm run contract:sync` updated `docs/contracts/openapi.json` and `openapi.types.ts`; `contract:check` is clean.
- **Not changed:** the two Auth actions (Pham Hoang Thai / Auth owner).

### MED-16: Heading skip on `/profile`, and Admin Users checkboxes

- **`/profile`:** the attempt-history card titles were `<h4>` under the section `<h2>`. Changed to `<h3>` in `history/components/attempt-history-section.tsx`. This is a one-tag change in Pham Hoang Thai's file, made because QA assigned this item to me.
  - **Evidence:** `attempt-history-section.test.tsx › titles attempt cards with h3…`.
- **Admin Users checkboxes:** now 20×20px inside a 44×44px clickable label. Row action buttons are 44×44px.
  - **Evidence:** `users-table.test.tsx`.

### MED-17: No request cancellation in `use-speaking-attempt.ts`

- Each attempt id gets its own `AbortController`. It is aborted on unmount or when the attempt id changes; its signal is passed to `getSpeakingAttempt`.
- A late response from the previous attempt (including from `skipPhase`) is discarded.
- **Evidence:** new `use-speaking-attempt.test.tsx` (3 tests: abort on id change, abort on unmount, stale response ignored).

### NEW-MED-08: `features/admin/api.ts` drops ProblemDetails fields

- Rebuilt on the shared `requestJson` / `requestVoid` from `shared/api/http.ts`. `AdminUsersApiError` now carries `status`, `code`, `detail`, `traceId` and `fieldErrors`.
- `adminUserErrorMessage()` turns these into actionable text. The dialogs show the message, a `Reference: <traceId>` line, and per-field validation errors.
- The duplicated refresh/lock code was removed.
- **Evidence:** `api.test.ts`, 9 tests, including "keeps ProblemDetails code, detail and traceId (409 LAST_ACTIVE_ADMIN)".

## 5. LOW

### LOW-07: 8 stale Speaking Playwright tests

- The specs named in the audit (`admin-speaking-content`, `admin-speaking-tests`, `learner-speaking-flow`, `learner-speaking-library`) do not exist in `tests/e2e/` on `dev`, nor at the audit baseline `0dcb81a`. Only `speaking-session.spec.ts` is in the repo, so there are no stale locators to repair.
- **What I did:**
  - Ran `speaking-session.spec.ts`: 2/2 pass.
  - Added mocked-BFF specs `tests/e2e/admin-speaking.spec.ts` (3) and `tests/e2e/admin-users.spec.ts` (2). Both use role/label locators against the current English UI.
- **Request to QA:** please share the 4 spec files you ran (they may only exist locally) so I can update them against this branch.

### NEW-LOW-02: Orphan Speaking Excel importer

- The BE has no `POST /api/v1/admin/speaking/tests/import` (checked in `AdminSpeakingController` and the OpenAPI snapshot), and nothing renders `ImportTestModal`.
- Removed `importSpeakingTest` (`admin-api.ts`), the `tests/import` route and `importUploadLimit` (`admin-speaking-proxy.ts`), and `import-test-modal.tsx`.
- Proxy tests now cover the Part 2 image upload route, and a regression test asserts `tests/import` returns 404.
- **For Le Thang:** if Excel import is wanted again, it needs a BE endpoint first.

## 6. Verification

**FE (`TOEICMaster-FE`):**

| Command                                   | Result                                                                                                                                                                                                                     |
| :---------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run format:check`                    | pass                                                                                                                                                                                                                       |
| `npm run lint` (oxlint + guardrails)      | pass: "Guardrails passed (378 production files checked)"                                                                                                                                                                   |
| `npm run typecheck`                       | pass                                                                                                                                                                                                                       |
| `npm run contract:check`                  | pass                                                                                                                                                                                                                       |
| `npx vitest run`                          | 870/871 pass. The 1 failure is a pre-existing Flashcards test (`dialogs.test.tsx › caps batched additions at 200 cards…`, 5.6s, timed out under full-suite load); it passes alone (11/11). No Flashcards code was changed. |
| `npm run build`                           | pass                                                                                                                                                                                                                       |
| Playwright, local `next dev` + mocked BFF | `admin-speaking.spec.ts` 3/3 · `admin-users.spec.ts` 2/2 · `speaking-session.spec.ts` 2/2                                                                                                                                  |

**BE (`TOEICMaster-BE`):**

| Command                             | Result                                                                                                                                                                                                                       |
| :---------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dotnet restore --locked-mode`      | pass                                                                                                                                                                                                                         |
| `dotnet format --verify-no-changes` | pass                                                                                                                                                                                                                         |
| `dotnet build -c Release`           | pass, 0 errors                                                                                                                                                                                                               |
| `dotnet test`                       | 443 pass, 230 fail. Every failure is `TOEICMASTER_TEST_POSTGRES is required for API tests` (no Postgres/Docker on this machine). `OpenApiSnapshotTests` and `ArchitectureTests` pass. **CI needs to re-run the full suite.** |

**Not verified yet:**

- Against the live BE/BFF environment.
- axe/Lighthouse contrast scan of the Speaking CTA.

## 7. Files changed

**FE:**

| Area          | Files                                                                                                                                                                                                                                                                                                                                                                                              |
| :------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Speaking      | `http.ts`, `parsers.ts`, `admin-api.ts`, `speaking-theme.css`, `hooks/use-speaking-attempt.ts`, `server/{speaking-proxy,admin-speaking-proxy,upstream}.ts`, `components/admin/{speaking-test-workspace,speaking-exercise-editor,speaking-exercise-table,speaking-tests-table}.tsx`, new `components/admin/speaking-workspace-dialog.tsx`; deleted `create-test-modal.tsx`, `import-test-modal.tsx` |
| Pronunciation | `api.ts`                                                                                                                                                                                                                                                                                                                                                                                           |
| Admin Users   | `api.ts`, `components/{users-page,users-table}.tsx`, new `components/users-dialogs.tsx`                                                                                                                                                                                                                                                                                                            |
| History       | `components/attempt-history-section.tsx` (one tag)                                                                                                                                                                                                                                                                                                                                                 |
| Contract      | `docs/contracts/openapi.json`, `src/shared/api/generated/openapi.types.ts`                                                                                                                                                                                                                                                                                                                         |
| Tests         | the matching `*.test.ts(x)` files, `tests/e2e/admin-speaking.spec.ts`, `tests/e2e/admin-users.spec.ts`                                                                                                                                                                                                                                                                                             |

**BE:** `src/TOEICMaster.Api/Controllers/SpeakingAttemptsController.cs`, `docs/contracts/openapi.json`.

No shared primitives were modified (`shared/components/ui/dialog.tsx`, `shared/server/bff-proxy.ts`, `shared/api/http.ts`, `admin-workspace.tsx`, `check-guardrails.mjs`). No dependencies were added.
