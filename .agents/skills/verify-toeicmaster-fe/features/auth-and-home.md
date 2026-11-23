# Authentication and Homepage

The TOEICMaster homepage presents the ETS-format study overview with three standalone exam skill paths, recent attempt history, and global navigation, while the login view allows registered learners and administrators to authenticate with email and password or Google Sign-In.

## Sub-features

- `home-hero`: Landing hero section featuring the four skills, three standalone exam types, and quick navigation links.
- `home-exam-cards`: Skill cards for Listening & Reading, Speaking, and Writing leading to individual practice libraries.
- `home-user-menu`: Navigation header menu providing sign-in and sign-up links for guests, or personal profile and sign-out controls for authenticated users.
- `auth-login-form`: Authentication form supporting email, password with toggleable visibility, and accessible error alerts.
- `auth-tabs`: Tab switcher for toggling between Sign In and Sign Up views while preserving the return URL.

## How to get to it (user POV)

- Open the browser and visit `/` to view the homepage.
- Click the "Sign in" link in the header or visit `/login` directly.
- On the login page, inspect form fields, enter invalid values to trigger inline validation, or click "Sign up for free" to reach `/register`.

## Driving it with Playwright

Preconditions:
- The frontend server is launched and listening at `BASE_URL`.
- An isolated browser context is initialized at standard desktop resolution (`1440x900`).

1. Navigate to the homepage:
   `await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });`
   Verify that the hero heading `ETS-Format TOEIC Exam Preparation Platform` is visible.

2. Verify that exam skill cards are rendered:
   `await expect(page.getByRole("heading", { name: "Listening & Reading" })).toBeVisible();`
   `await expect(page.getByRole("heading", { name: "Speaking" })).toBeVisible();`
   `await expect(page.getByRole("heading", { name: "Writing" })).toBeVisible();`

3. Navigate to the login route:
   `await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });`
   Verify that the login heading `Welcome back` is present.

4. Submit an empty form to observe client-side validation errors:
   `await page.getByRole("button", { name: "Sign in" }).click();`
   `await expect(page.locator("#email-error")).toBeVisible();`
   `await expect(page.locator("#password-error")).toBeVisible();`

5. Verify password visibility toggle:
   `await page.locator("#password").fill("Secret123!");`
   `await page.getByLabel("Show password").click();`
   `await expect(page.locator("#password")).toHaveAttribute("type", "text");`

6. Capture screenshot and DOM evidence:
   `await page.screenshot({ path: `${EVIDENCE_DIR}/auth-login-validation.png`, fullPage: true });`

## Gotchas

- When testing without a live backend at `API_BASE_URL`, submitting valid credentials to `/api/auth/login` returns HTTP 502.
- The Google Sign-In script is loaded externally and should be intercepted in isolated tests if network access is restricted.
- The skip-to-main-content link is visible upon pressing Tab and targets `#main-content`.
