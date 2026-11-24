# TOEIC Vocabulary Flashcards

The Flashcards feature enables learners to master essential TOEIC workplace vocabulary across six business categories using interactive 3D flip cards, audio pronunciation, rapid Speed Match challenges, and spaced-repetition quizzes.

## Sub-features

- `fc-category-filter`: Category filter buttons for Office, Contracts, Finance, Travel, Marketing, HR, and custom decks.
- `fc-search-filter`: Real-time text search filtering decks by title, description, or contained vocabulary terms.
- `fc-study-modes`: Multi-mode study switcher supporting Flip cards, Speed Match, Quiz mode, and Word list view.
- `fc-match-game`: Interactive memory matching game with streak multipliers, combo timers, and personal best records.
- `fc-deck-creator`: Dialog for composing custom vocabulary decks with term, phonetic, part of speech, and meaning inputs.

## How to get to it (user POV)

- Open the browser and visit `/flashcards`.
- Filter decks by topic pills such as "Office & Operations" or use the search box to find specific terms.
- Click a deck card to open its study workspace, then choose "Speed Match" from the mode tabs to start a matching game.

## Driving it with Playwright

Preconditions:
- The frontend server is launched and listening at `BASE_URL`.
- An isolated browser context is initialized.

1. Navigate to the flashcards workspace:
   `await page.goto(`${BASE_URL}/flashcards`, { waitUntil: "domcontentloaded" });`
   Verify that the main heading `TOEIC Vocabulary Flashcards` is visible.

2. Filter decks using search:
   `const searchInput = page.getByLabel("Search decks or vocabulary");`
   `await searchInput.fill("Office");`
   `await expect(page.getByRole("heading", { name: "Office & Business Operations" })).toBeVisible();`

3. Enter the selected deck:
   `const officeCard = page.locator("article", { hasText: "Office & Business Operations" });`
   `await officeCard.getByRole("button", { name: /(?:Start|Continue) studying/ }).click();`
   Verify the deck title and mastery stats are displayed.

4. Switch to Speed Match game mode:
   `await page.getByRole("tab", { name: "Speed Match" }).click();`
   `await page.waitForSelector('[role="tab"]:has-text("Speed Match")[aria-selected="true"]');`
   Verify matching board tiles are rendered with Term and Meaning cards.

5. Match a pair of cards and trigger selection:
   `const termButton = page.locator('button:has-text("Term"):has-text("itinerary")');`
   `const meaningButton = page.locator('button:has-text("Meaning"):has-text("lịch trình chi tiết")');`
   `await termButton.click();`
   `await meaningButton.click();`
   `const nextTile = page.locator('button:has-text("Term"):not([disabled])').first();`
   `await nextTile.click();`
   `await page.waitForSelector('button[aria-pressed="true"]');`

6. Capture screenshot and ARIA snapshot:
   `await page.screenshot({ path: `${EVIDENCE_DIR}/flashcards-match-game.png`, fullPage: true });`

## Gotchas

- Built-in decks are statically bundled and operate without a live backend connection.
- Local study progress and high scores are scoped per user account in browser storage under `toeicmaster.scoped.v1:flashcards`.
- In guest mode, progress is isolated to the guest scope and automatically presents a "Saved on device" status badge.
