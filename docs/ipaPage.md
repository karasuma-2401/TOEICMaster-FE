# Spec: IPA Pronunciation Practice Page for Learners

| Field  | Value                                                            |
| ------ | ---------------------------------------------------------------- |
| Jira   | CNPMCS-60 (epic CNPMCS-55)                                       |
| Owner  | Tan Mai Phu                                                      |
| Due    | Week 1 Sprint 3 (2026-11-15 → 2026-11-22)                        |
| Status | Spec, not yet implemented                                        |
| Scope  | Learner side only, no Admin management page                      |
| Route  | `/pronunciation` (learner), `/api/pronunciation/*` (Next.js BFF) |

## 1. Goal

Learners open a single page containing all 44 IPA sounds, including 12 monophthongs, 8 diphthongs, and 24 consonants.
When selecting a sound, learners listen to the sample audio, read the articulation instructions, view example words, and then record their own voice.
The system **evaluates the speaker's pronunciation** and indicates whether the target sound was pronounced accurately or not.

### Acceptance Criteria Mapping

| AC in Jira                                                                        | Fulfilled By                                                                             |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Display full IPA chart (Vowels & Consonants), clearly grouped                     | `IpaChart`: 3 groups, consonants arranged in voiceless/voiced pairs (§7.3)               |
| Select sound: view symbol, pronunciation description, example words, sample audio | `SoundDetailPanel`: sample audio, articulation, example words with listen buttons (§7.4) |
| Practice recording/reading along, receive feedback, and play back own recording   | `PracticeRecorder` and `AssessmentResult`: record → AI assessment → playback (§8, §9)    |

## 2. Standalone Feature, Separate from Speaking

IPA pronunciation is **a separate section** for learners, at the same level as Listening & Reading, Speaking, and Writing.
It is not a Part, a tab, or a sub-screen of Speaking.

| Aspect          | IPA Pronunciation (this feature)                                   | Do Not Do                                                             |
| --------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------- |
| Menu            | Separate item "Pronunciation", `href="/pronunciation"`             | Place link inside `/speaking` page or in `SpeakingHeader`             |
| Route           | `src/app/pronunciation/**`                                         | Place under `src/app/speaking/**`                                     |
| Feature         | `src/features/pronunciation/**`                                    | Add files to `src/features/speaking/**`                               |
| BFF             | `src/app/api/pronunciation/assessments`                            | Add path to `speaking-proxy.ts` or `/api/speaking/[...segments]`      |
| Backend         | `PronunciationController`, route `api/v1/pronunciation`            | Add action to Speaking controller, edit `AzureSpeakingSpeechAssessor` |
| Recording       | Dedicated hook `use-pronunciation-recorder.ts`                     | Use or modify `useVoiceRecorder`                                      |
| UI              | Shared `ExamLibrary` shell (`sp-theme` + `sp-font`, §7.1)          | Wrap with `sp-learner`, use components in `speaking/components`       |
| Documentation   | This file (`docs/ipaPage.md`)                                      | Add to `docs/speaking-be-handoff.md` or Speaking specs                |
| History, scores | Do not save practice attempts to server; do not show on `/history` | Save to Speaking history or Speaking scores                           |

The only things taken from the `features/speaking` directory are `fonts.ts` and `speaking-theme.css` (solely for the `sp-font` class).
Writing, Listening & Reading, and History also import these exact two files, so this is the shared font setup for all learner pages, not a dependency on Speaking logic.

## 3. Boundaries: Do Not Modify Others' Code

The entire feature lives in **new files and directories**.
Do not refactor, reformat, or change the behavior of existing code.

| Allowed                                                                                                                                                                               | Not Allowed                                                                      |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Create `src/features/pronunciation/**`, `src/app/pronunciation/**`, `src/app/api/pronunciation/**`                                                                                    | Edit files in `src/features/speaking/**`, `writing/**`, `lr-exam/**`, `admin/**` |
| Create `public/audio/ipa/**`                                                                                                                                                          | Move `useVoiceRecorder` to `shared/` or change its function signature            |
| **Import (read-only)** from `src/shared/**`, `features/user/components/user-menu`, `features/speaking/fonts.ts` + `speaking-theme.css` (only for `sp-font`, §2), auth helpers in §9.3 | Edit `speaking-theme.css`, `styles.ts`, or components in `shared/`               |
| Add new tests alongside new code                                                                                                                                                      | Delete or edit existing tests; change lockfiles, configs, or CI                  |

**Two integration points must touch shared code.**
Each point must be submitted as a separate small PR and requires approval from the code owner:

1. **Learner menu.**
   Add one entry `{ id: "pronunciation", label: "Pronunciation", href: "/pronunciation" }` (localized in the UI) to the `navigation` array in `src/shared/components/practice/skill-header.tsx` and the `navigation` array in `src/app/page.tsx` (this array has no `id`, only add `{ label: "Pronunciation", href: "/pronunciation" }`).
   Insert **before** "History", so that `milestoneLinks = navigation.slice(0, 3)` on the home page still takes only the 3 exam skills.
   Add `"pronunciation"` to the `PracticeNavId` union.
   Before this PR is merged, `PronunciationHeader` renders `SkillHeader` without passing `active`, and the page remains accessible via direct URL.

   In this same PR (optional): add an entry `{ match: /^\/pronunciation/, ... }` to `src/shared/components/mascot/mascot-tips.ts` so the mascot has tips specific to the IPA page.
   Before merging, the mascot shows default tips without affecting functionality.

2. **Backend.**
   The pronunciation assessment endpoint (§9.1) consists of a **new** controller, handler, and assessor.
   The only existing file to touch is the DI registration.
   Do not modify `AzureSpeakingSpeechAssessor`.

## 4. Current State (Re-surveyed on 2026-11-20, branch `feat/fixUser_mergeUI` @ `740762f`)

- There is currently no route, feature, menu item, or API for IPA.
  The backend contract (`TOEICMaster-BE/docs/contracts/api-contract.md`) does not yet have a pronunciation section.
- The learner menu is `SkillHeader`: 4 items ("Listening & Reading", "Speaking", "Writing", "History").
  On desktop it is a horizontal bar; below `md` it switches to a sliding sidebar via `HeaderMenu`.
  The home page has a separate `navigation` array and `milestoneLinks = navigation.slice(0, 3)`.
- How learner pages build their layouts:
  - Speaking: `sp-theme sp-learner` + `speaking-learner.css`.
    Speaking's dedicated UI; `--sp-*` tokens only exist inside `.sp-theme`.
  - Writing, Listening & Reading, History: `sp-font ${speakingFontClasses}` + `<GuideMascot />`, colors use Tailwind and classes in `shared/components/practice/styles.ts`.
    They do not use `--sp-*` variables.
- The Listening & Reading BFF (`lr-exam/server/lr-proxy.ts`) only imports helpers from `features/auth/server/*`, not from `features/speaking`.
- The backend already has `AzureSpeakingSpeechAssessor` (scoring at the **word** level, `Granularity = "Word"`) and `ISpeakingAudioConverter`, converting webm/ogg/mp4 to 16 kHz PCM WAV.
  Both are tied to the Speaking test flow; there is no endpoint yet to assess a single word at the **phoneme** level.

## 5. Architecture Overview

```text
/pronunciation (Server Component)
  ├─ IpaChart (Server)            ← static data ipa-sounds.ts
  └─ SoundDetailPanel ("use client", reads ?sound=<slug>)
       ├─ sample <audio>          ← /audio/ipa/<slug>.mp3 (static)
       ├─ Example words: TTS      ← speechSynthesis (en-US)
       └─ PracticeRecorder
            record (MediaRecorder) → POST /api/pronunciation/assessments (multipart)
                                     → Next.js BFF (server) → POST {API_BASE_URL}/api/v1/pronunciation/assessments
                                     → Backend → ISpeakingAudioConverter → Azure Pronunciation Assessment
                                                 (Granularity=Phoneme, PhonemeAlphabet=IPA, ReferenceText=<word>)
            ← word score + per-phoneme scores → AssessmentResult
```

**Key Decisions:**

- **All 44 sounds are static data stored in the frontend.**
  The IPA chart does not change and the task has no Admin page, so no backend database table is needed.
- **Assess on an example word, not an isolated sound.**
  Speech recognition services do not reliably score an isolated sound such as /θ/.
  We assess a full word (e.g., `think`), then extract the score for the target phoneme within that word.
- **The browser never calls Azure directly.**
  The Azure key exists only on the backend.
  The browser only calls the same-origin route.

## 6. Directory Structure (All New Files)

```text
src/app/pronunciation/
  layout.tsx                    # sp-font + font + GuideMascot (same as app/writing/layout.tsx)
  page.tsx                      # Server Component: PracticePage + Breadcrumbs + PageIntro + PronunciationWorkspace
src/app/api/pronunciation/assessments/
  route.ts                      # POST → forwardPronunciationAssessment
src/features/pronunciation/
  ipa-sounds.ts                 # 44 sounds, types, lookup helpers by slug/group
  ipa-sounds.test.ts
  assessment.ts                 # result types + parseAssessment(unknown) + target phoneme scoring
  assessment.test.ts
  api.ts                        # assessPronunciation(blob, word, signal)
  api.test.ts
  practice-progress.ts          # read/write practiced sounds in localStorage (try/catch)
  practice-progress.test.ts
  hooks/
    use-pronunciation-recorder.ts       # dedicated recorder hook, 1 take, auto-stop after 5s
    use-pronunciation-recorder.test.tsx
    use-word-speech.ts                  # TTS for example words
  components/
    pronunciation-header.tsx    # SkillHeader + UserMenu (same as writing-header.tsx)
    pronunciation-workspace.tsx # "use client": syncs ?sound, 2-column layout
    ipa-chart.tsx               # 3-group chart
    ipa-sound-tile.tsx          # single sound tile
    group-filter.tsx            # All / Monophthongs / Diphthongs / Consonants
    sound-detail-panel.tsx      # details of selected sound
    sample-audio-button.tsx     # sample audio playback button
    example-word-list.tsx       # example words + transcription + listen button + select word to practice
    practice-recorder.tsx       # recording/assessment state machine
    assessment-result.tsx       # scores + phoneme chips + improvement tips
    *.test.tsx
  server/
    pronunciation-proxy.ts      # validate + forward to backend
    pronunciation-proxy.test.ts
    upstream.ts                 # backendBase, readMultipart, relay: dedicated copy, no import from speaking
public/audio/ipa/
  <slug>.mp3                    # 44 sample audio files
  CREDITS.md                    # source and license for each file
```

**Why write a dedicated recorder hook instead of using Speaking's `useVoiceRecorder`?**
Speaking's hook manages multiple takes by question number and mic level checks for the exam room.
The IPA page only needs a single short recording, auto-stopping after at most 5 seconds, and must overwrite when re-recording.
A dedicated hook avoids depending on changes made by the Speaking team.
Mic permission requests, unsupported browser detection, and object URL revocation are implemented **the same way** as Speaking's hook for consistent behavior.

## 7. UI: Consistent with Existing Skill Pages

### 7.1 Page Shell

The IPA page follows the shell of **`ExamLibrary`** (`shared/components/practice/exam-library.tsx`), the shared component used by Listening & Reading and Writing.
This shell wraps `sp-theme` to access `--sp-*` tokens; these are shared component tokens, not Speaking's custom UI.
Do not use `sp-learner` and do not import any components from `features/speaking/components` (§2).
Shared blocks may only be imported, never modified.

| Element          | Implementation                                                                                                             |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Layout, font     | `app/pronunciation/layout.tsx` matches `app/writing/layout.tsx`: `sp-font` + `speakingFontClasses` + `<GuideMascot />`     |
| Page shell       | `<div className="sp-theme min-h-dvh bg-white">`, `SkillHeader` with `wide`, `main` uses `wideContainer pb-12 pt-6`         |
| Breadcrumbs      | `Breadcrumbs`: Home / Pronunciation                                                                                        |
| Page heading     | Small badge `rounded-md text-xs uppercase`, `h1` `text-[28px] font-bold leading-9`, subtitle `text-[15px]` in `--sp-ink-2` |
| Stat card        | Matches "Best score" card: `rounded-2xl border px-[18px] py-4 sm:w-60`, number `text-[36px] font-bold text-[#f4511e]`      |
| Filter, words    | Pills matching Part selector buttons: `rounded-[10px] border px-4 text-sm`; active uses `--sp-orange-soft` + `--sp-brand`  |
| Sound tile, card | `rounded-2xl border border-(--sp-line)/70 bg-white`, hover `--sp-hero-line` + `--sp-shadow-card`                           |
| Group heading    | `h2` `text-lg font-semibold`, sound count `text-[13px]` in `--sp-ink-2`                                                    |
| Primary buttons  | `primaryAction`, `secondaryAction` in `styles.ts`                                                                          |
| Take playback    | Feature-specific `TakePlayback`, copying Speaking's "Play back previous take" layout (bg `--sp-subtle`, `mm:ss` duration)  |
| Error states     | `InlineError`, `ErrorPanel` in `state-panels.tsx`                                                                          |

**Typography and Colors**

- One font for the entire page, including IPA symbols.
  Do not set a separate font for symbols.
- `font-bold` is only for `h1` and large numbers; section headings use `font-semibold`; everything else uses regular weight.
- Secondary text uses `--sp-ink-2`, size `13px`/`15px` like the exam library page.
- No gradients, no distinct colors per sound group.
  Orange is reserved for active states and result numbers; per-phoneme scores only change text color (`--sp-success`, `--sp-warning`, `--sp-danger`).
- Do not add step-by-step tutorial blocks or praise messages; keep only core content: articulation, common mistakes, example words.

### 7.2 Layout by Breakpoint

```text
Desktop ≥ lg                                         Mobile < lg
┌──────────────────────────────────────────────┐     ┌──────────────────────┐
│ SkillHeader (… Writing · Pronunc. · History) │     │ Logo            [≡]  │ ← ≡ opens sidebar with "Pronunciation"
├──────────────────────────────────────────────┤     ├──────────────────────┤
│ PRONUNCIATION · IPA                          │     │ PageIntro            │
│ International Phonetic Alphabet    [5/44]    │     │ [All][Mono][Diph]…   │ ← horizontal scroll
│ [All][Monophthongs][Diphthongs][Consonants]  │     │ ┌──┬──┬──┬──┐        │
├────────────────────────────┬─────────────────┤     │ │iː│ɪ │ʊ │uː│ 4 cols │
│ Monophthongs  12 sounds    │  /θ/  Consonant │     │ └──┴──┴──┴──┘        │
│ ┌──┬──┬──┬──┬──┬──┐        │  ▶ Sample       │     │ …                    │
│ │iː│ɪ │ʊ │uː│e │ə │        │  Articulation … │     ├──────────────────────┤
│ ├──┼──┼──┼──┼──┼──┤        │  Example words  │     │ SoundDetailPanel     │ ← selecting sound scrolls here
│ │ɜː│ɔː│æ │ʌ │ɑː│ɒ │        │  think ▶ [Pract]│     │  + PracticeRecorder  │
│ └──┴──┴──┴──┴──┴──┘        │  ── Practice ── │     └──────────────────────┘
│ Diphthongs  8 sounds       │  ● Rec    0:03  │
│ Consonants  24 (paired)    │  Score: 82      │
└────────────────────────────┴─────────────────┘
```

- Sound tile grid: 4 columns (mobile), 6 columns (`sm`), 6 columns (`lg`, since the main column narrows).
  Consonants are displayed in voiceless/voiced **pairs** (p-b, t-d, ...) to highlight contrast.
- Below `lg`: `PracticeColumns` stacks the panel below the chart.
  When a sound is selected, call `scrollIntoView({ behavior: "smooth", block: "start" })` to the panel, then focus the panel heading (`tabIndex={-1}`).
- No page-level horizontal scrolling.
  The group filter bar may scroll horizontally within its own container (`overflow-x-auto`).

### 7.3 Sound Tile (`IpaSoundTile`)

- Rendered as a `<button type="button">`, never a `div` with `onClick`.
- Content: large symbol (`text-2xl font-bold`), one small example word below, and a small ✓ badge in the corner if the sound has been practiced (read from `practice-progress`).
- `aria-label="Sound /θ/, example think"`, `aria-pressed={selected}`, minimum height 44px.
- Keyboard: Tab moves sequentially through tiles, Enter/Space selects.
  Arrow-key navigation is not required.
- Each group is a `<section aria-labelledby>` with an `<h2>` heading.

### 7.4 Detail Panel (`SoundDetailPanel`)

Content order from top to bottom:

1. Symbol `/θ/` (`<h2>`), group and subgroup chips (e.g., "Consonant · voiceless"), **Listen to sample** button (`SampleAudioButton`, using an `<audio>` element with `preload="none"`).
2. **Articulation:** 2-4 short steps describing tongue, lip, and vocal cord positions.
3. **Common Vietnamese learner mistake:** 1 line, e.g., "Often pronounced as /t/ or /s/".
4. **Example words:** 3 words.
   Each word shows its IPA transcription (with the target phoneme highlighted in the group color), a ▶ button (TTS), and a **Practice this word** button (sets `referenceText` for the recorder).
5. `PracticeRecorder` (§8).

When no sound is selected (no `?sound`), render `EmptyPanel`: "Select a sound from the chart to get started".
When `?sound` is invalid, also show the empty state along with an `InlineError`: "Sound not found".

### 7.5 URL State and Progress

- `?sound=<slug>` (e.g., `?sound=th-voiceless`).
  Switch sounds using `router.replace(..., { scroll: false })` to avoid cluttering browser history.
  Links are shareable, and reloading preserves the selected sound.
- `?group=monophthong|diphthong|consonant` for the filter (optional).
- Practice progress ("practiced 5/44") is stored in `localStorage` (`toeicmaster.ipa.practiced`).
  All reads/writes are wrapped in `try/catch`.
  If `localStorage` is unavailable, the page still works normally, just without showing ✓ badges.

## 8. Practice and Speaker Pronunciation Assessment (Required)

### 8.1 User Flow

1. Select a sound, then choose an example word (defaults to the first word).
2. Click **Record**.
   On first use, the browser requests microphone permission.
3. Pronounce the word.
   The volume meter reacts to the voice.
   The timer counts up to a 5-second maximum.
   Click **Stop** or let it stop automatically.
4. The recording is automatically submitted for assessment.
   While waiting, the panel displays "Assessing pronunciation...".
5. Display the results (§8.3).
   Learners can **Play recording**, **Play sample**, **Re-record**, or choose another word.

### 8.2 `PracticeRecorder` State Machine

```text
idle ──Record──▶ requesting ──granted──▶ recording ──Stop/5s──▶ assessing ──200──▶ result
  ▲                 │ denied                 │ mic lost             │ error           │
  │                 ▼                        ▼                      ▼                 │
  └─── Re-record ─ denied / unsupported   error ◀──────────────── error ◀─────────────┘
```

| State         | UI                                                                                  |
| ------------- | ----------------------------------------------------------------------------------- |
| `idle`        | `primaryAction` button "Record", prompt "Read the word **think**"                   |
| `requesting`  | Button disabled, "Requesting microphone permission..."                              |
| `recording`   | Blinking red dot (`bg-red-600 animate-pulse`), timer, volume bar, "Stop" button     |
| `assessing`   | Spinner matching `LoadingPanel`, "Cancel" button (calls `AbortController.abort()`)  |
| `result`      | `AssessmentResult` + `<audio controls>` playback of recording + "Re-record"         |
| `denied`      | `InlineError`: instructions to enable microphone permission in the browser          |
| `unsupported` | `InlineError`: "Browser does not support audio recording"; sample audio still works |
| `error`       | `ErrorPanel` with "Retry" button, message mapped by error code in §9.2              |

Rules:

- **Recording too short** (under 0.3 seconds) or near-zero volume throughout: do not send to the server; show "No voice detected, please try speaking closer to the microphone".
- **Stop the mic stream when leaving the page or switching sounds.**
  Revoke the old object URL when re-recording or unmounting.
- **Only send one request at a time.**
  If the user switches sounds or words while an assessment is in progress, abort the previous request.
- **Keep the last 3 attempts for the current sound** in component state, only used on this page and discarded on navigation.
  This lets learners track immediate improvement.
- Include `aria-live="polite"` for status and results so screen readers announce updates.

### 8.3 Results (`AssessmentResult`)

- **Target phoneme score** (large number) and label:
  - ≥ 80: "Good", emerald color (§7.1).
  - 60-79: "Fair, close", amber color.
  - < 60: "Needs practice", red color.
- **Whole-word score:** `accuracyScore`, plus `pronunciationScore` as a progress bar.
- **Phoneme chips** for the entire word, e.g., `θ ɪ ŋ k`.
  Each chip is colored by score, with a bold border on the target phoneme chip.
  The chip's `title`/`aria-label` reads "θ: 54 points".
- **What the system heard:** if the highest-scoring phoneme in `candidates` differs from the target phoneme, display "Sounded more like /s/ than /θ/".
  Then display the common confusion tip from `ipa-sounds.ts`, e.g., `confusions: { s: "Place your tongue tip between your teeth, ..." }`.
- **Recognized word differs from target word** (`recognizedText`, e.g., recognized as "sink"): display "Heard as **sink**".
- **`NoSpeech`:** "No speech recognized", with a "Re-record" button.
- Upon successful assessment, mark the sound as practiced in `practice-progress`.

**Calculating the target phoneme score** (function `scoreTargetPhoneme` in `assessment.ts`, pure, tested):

1. Retrieve the list of phonemes returned by Azure for that word.
2. Find the phonemes matching `azurePhonemes` of the currently practiced sound (mapping table in §10.2).
3. Multi-symbol sounds (e.g., /ɪə/ → `ɪ ɹ`) take the average score.
4. If the phoneme appears multiple times in the word, take the lowest score.
5. If no matching phoneme is found, return `null`.
   In that case, the UI shows only the whole-word score along with a note: "Could not isolate a separate score for this sound".

### 8.4 When AI Assessment Is Unavailable

Assessment is required, but the page must remain usable when the service fails:

- `401`: show "Sign in to get pronunciation assessment" with a `/login` link.
  The user can still play back their recording.
- `503 NOT_CONFIGURED` or upstream error: show `ErrorPanel` "Unable to assess right now".
  Still allow playing back the recording and sample audio for self-comparison.
- No client-side fallback scoring.
  The Web Speech API does not provide phoneme-level scores, so do not use it to simulate scores.

## 9. API

### 9.1 Proposed Backend Contract (Must Be Finalized with BE Team Before Coding)

`POST /api/v1/pronunciation/assessments`, sent as `multipart/form-data`:

| Field           | Required | Constraints                                                                    |
| --------------- | -------- | ------------------------------------------------------------------------------ |
| `file`          | Yes      | `audio/webm`, `audio/ogg`, `audio/mp4`, `audio/wav`; max 1 MiB; max 10 seconds |
| `referenceText` | Yes      | 1-40 characters, English letters, spaces, `'`, and `-` only                    |
| `locale`        | No       | Defaults to `en-US`                                                            |

`200` Response:

```json
{
  "recognitionStatus": "Recognized",
  "referenceText": "think",
  "recognizedText": "think",
  "accuracyScore": 78.0,
  "pronunciationScore": 80.5,
  "completenessScore": 100.0,
  "words": [
    {
      "word": "think",
      "accuracyScore": 78.0,
      "errorType": "None",
      "phonemes": [
        {
          "phoneme": "θ",
          "accuracyScore": 54.0,
          "candidates": [
            { "phoneme": "s", "score": 71.0 },
            { "phoneme": "θ", "score": 54.0 }
          ]
        },
        { "phoneme": "ɪ", "accuracyScore": 92.0, "candidates": [] },
        { "phoneme": "ŋ", "accuracyScore": 88.0, "candidates": [] },
        { "phoneme": "k", "accuracyScore": 95.0, "candidates": [] }
      ]
    }
  ]
}
```

`recognitionStatus` can be `Recognized` or `NoSpeech`.
When `NoSpeech`, all scores are 0 and `words` is `[]`.

Errors return ProblemDetails, consistent with existing APIs:

| Status  | `code`                                     | When                                        |
| ------- | ------------------------------------------ | ------------------------------------------- |
| 400     | `INVALID_AUDIO` / `INVALID_TEXT`           | Invalid format or missing field             |
| 401     | -                                          | Not authenticated                           |
| 413     | -                                          | File exceeds 1 MiB                          |
| 422     | `SPEECH_REJECTED`                          | Azure could not process the recording       |
| 429     | -                                          | Rate limit exceeded; includes `Retry-After` |
| 502/504 | `SPEECH_PROVIDER_ERROR` / `SPEECH_TIMEOUT` | Azure error or timeout                      |
| 503     | `NOT_CONFIGURED`                           | Azure is not configured                     |

**Backend Notes (for the BE team to implement):**

- **Add new code only:** `PronunciationController` (route `api/v1/pronunciation`), one command/handler, and `AzurePronunciationAssessor`.
  `AzurePronunciationAssessor` **re-injects** the existing `ISpeakingAudioConverter` and `IOptions<AzureSpeechOptions>`.
  Do not modify `AzureSpeakingSpeechAssessor`.
- **`Pronunciation-Assessment` header:** `ReferenceText=<word>`, `GradingSystem=HundredMark`, `Granularity=Phoneme`, `PhonemeAlphabet=IPA`, `NBestPhonemeCount=5`, `Dimension=Comprehensive`, `EnableMiscue=false`.
- **Authentication: undecided** (see §13).
  In the meantime, the backend **requires authentication by default**, because each Azure call incurs cost, with a rate limit of 30 requests/minute per user.
  If guest access is allowed later, simply remove the auth requirement on the endpoint and rate-limit by IP, e.g., 10 requests/minute.
  The frontend needs no changes, as both cases are already handled (§8.4, §9.3).
- **Do not store recordings.**
  Process in memory and discard after assessment.
- **Update the contract** in `TOEICMaster-BE/docs/contracts/api-contract.md` as a standalone "Pronunciation" section, not inside the Speaking section.

### 9.2 Client API Function (`features/pronunciation/api.ts`)

```ts
export async function assessPronunciation(
  audio: Blob,
  referenceText: string,
  signal?: AbortSignal,
): Promise<PronunciationAssessment>;
```

- Sends `FormData` to `POST /api/pronunciation/assessments`, same-origin.
- Treats response body as `unknown`.
  `parseAssessment` validates every field; malformed data throws `INVALID_RESPONSE`.
  Do not use `any`.
- Maps HTTP errors to Vietnamese UI messages without exposing internal details: 401 → prompt sign-in; 413/400 → "Invalid recording"; 429 → "Too many attempts, please wait N seconds"; 5xx → "Unable to assess right now".

### 9.3 Next.js BFF (`features/pronunciation/server/pronunciation-proxy.ts`)

`src/app/api/pronunciation/assessments/route.ts` exports only `POST`, sets `dynamic = "force-dynamic"`, and calls `forwardPronunciationAssessment(request)`.

Helpers **imported, not modified**, matching `lr-exam/server/lr-proxy.ts`:

- `problem` and `sameOrigin` from `@/features/auth/server/backend`.
- `sessionCookie` from `@/features/auth/server/session`.

**Do not import from `@/features/speaking/server/upstream`** (§2).
Write a dedicated copy in `features/pronunciation/server/upstream.ts` containing only what is needed: `backendBase()` (reads `API_BASE_URL`, only accepts http/https), `readMultipart()` (only accepts `multipart/form-data`, checks both declared `content-length` and actual bytes read), and `relay()` (copies status, `Content-Type`, `Retry-After`).
You may reference the Speaking version's implementation style, but do not share code.

What the proxy does:

1. Reject non-same-origin requests (`403`).
2. `readMultipart(request, 1 MiB + 64 KiB)`, enforcing the size limit at the boundary.
3. Attach `Authorization: Bearer <accessToken>` if a valid session exists; if no session exists, still forward so the backend returns `401`.
4. 20-second timeout.
   On network error or timeout, return `502`/`504` with a generic message.
5. `relay` the response to the client with `Cache-Control: no-store`.

## 10. Data (`ipa-sounds.ts`)

### 10.1 Data Types

```ts
export type IpaGroup = "monophthong" | "diphthong" | "consonant";

export interface IpaExample {
  word: string; // "think"
  ipa: string; // "θɪŋk"
  highlight: [start: number, end: number]; // position of target phoneme in `ipa`
}

export interface IpaSound {
  slug: string; // "th-voiceless", URL-safe, unique
  symbol: string; // "θ"
  group: IpaGroup;
  subgroup: "short" | "long" | "voiceless" | "voiced" | "glide"; // depends on group
  pairSlug?: string; // voiceless/voiced consonant pair, e.g. "th-voiced"
  audioSrc: string; // "/audio/ipa/th-voiceless.mp3"
  articulation: string[]; // 2-4 articulation steps, in Vietnamese
  commonMistake: string; // common mistake made by Vietnamese learners
  examples: [IpaExample, IpaExample, IpaExample];
  azurePhonemes: string[]; // corresponding Azure en-US symbols (see §10.2)
  confusions?: Record<string, string>; // commonly confused phoneme → correction tip
}

export const ipaSounds: readonly IpaSound[];
export function findSound(slug: string): IpaSound | undefined;
export function soundsByGroup(group: IpaGroup): readonly IpaSound[];
```

### 10.2 List of 44 Sounds (Standard British English IPA Chart, matching Cambridge/TOEIC textbooks)

The "Azure" column shows **expected** symbols in Azure's en-US IPA phoneme set.
This set uses American English: it has no length mark `ː` and lacks RP /ɒ/, /ɪə/, /eə/, /ʊə/.
These must be verified with the spike in §12, step B1, before finalizing.

**Monophthongs (12)**

| Slug      | IPA | Example Words          | Azure |
| --------- | --- | ---------------------- | ----- |
| `i-long`  | iː  | sheep, see, teacher    | i     |
| `i-short` | ɪ   | ship, sit, business    | ɪ     |
| `u-short` | ʊ   | good, book, put        | ʊ     |
| `u-long`  | uː  | shoot, food, blue      | u     |
| `e`       | e   | bed, many, said        | ɛ     |
| `schwa`   | ə   | teacher, about, banana | ə     |
| `er-long` | ɜː  | bird, work, learn      | ɝ     |
| `o-long`  | ɔː  | door, law, walk        | ɔ     |
| `ae`      | æ   | cat, bank, manager     | æ     |
| `uh`      | ʌ   | up, cup, money         | ʌ     |
| `a-long`  | ɑː  | far, car, start        | ɑ     |
| `o-short` | ɒ   | on, hot, job           | ɑ     |

**Diphthongs (8)**

| Slug | IPA | Example Words       | Azure |
| ---- | --- | ------------------- | ----- |
| `ie` | ɪə  | here, near, idea    | ɪ ɹ   |
| `ei` | eɪ  | wait, day, table    | eɪ    |
| `ue` | ʊə  | tourist, pure, sure | ʊ ɹ   |
| `oi` | ɔɪ  | boy, join, employ   | ɔɪ    |
| `ou` | əʊ  | show, go, phone     | oʊ    |
| `ea` | eə  | wear, hair, care    | ɛ ɹ   |
| `ai` | aɪ  | my, time, price     | aɪ    |
| `au` | aʊ  | cow, now, account   | aʊ    |

**Consonants (24, arranged in voiceless / voiced pairs)**

| Slug           | IPA | Example Words        | Azure | Slug        | IPA | Example Words                | Azure |
| -------------- | --- | -------------------- | ----- | ----------- | --- | ---------------------------- | ----- |
| `p`            | p   | pea, paper, stop     | p     | `b`         | b   | boat, job, about             | b     |
| `t`            | t   | tea, ticket, meet    | t     | `d`         | d   | dog, desk, need              | d     |
| `ch`           | tʃ  | cheese, check, watch | tʃ    | `j`         | dʒ  | June, job, manager           | dʒ    |
| `k`            | k   | car, call, book      | k     | `g`         | g   | go, bag, again               | ɡ     |
| `f`            | f   | fly, office, phone   | f     | `v`         | v   | video, very, have            | v     |
| `th-voiceless` | θ   | think, three, month  | θ     | `th-voiced` | ð   | this, mother, with           | ð     |
| `s`            | s   | see, sales, price    | s     | `z`         | z   | zoo, busy, plans             | z     |
| `sh`           | ʃ   | shall, shop, station | ʃ     | `zh`        | ʒ   | television, usually, measure | ʒ     |
| `m`            | m   | man, meeting, team   | m     | `n`         | n   | now, name, plan              | n     |
| `ng`           | ŋ   | sing, meeting, long  | ŋ     | `h`         | h   | hat, hotel, behind           | h     |
| `l`            | l   | love, late, email    | l     | `r`         | r   | red, report, sorry           | ɹ     |
| `w`            | w   | wet, work, quick     | w     | `y`         | j   | yes, year, use               | j     |

Prefer familiar TOEIC-context example words: office, meeting, manager, report.

**RP Sounds Absent from the American English Set:**

- /ɒ/: scored against `ɑ`, with a "US pronunciation" note.
- /ɪə/, /eə/, /ʊə/: scored against the `... ɹ` sequence.
- If the spike shows `en-GB` supports phoneme-level assessment with IPA symbols, switch `locale` to `en-GB` for the whole page and update the table.

### 10.3 Sample Audio

- 44 files at `public/audio/ipa/<slug>.mp3`, mono, 44.1 kHz or 22.05 kHz, under 50 KB each, pronouncing the isolated sound.
- **Confirmed (2026-11-19): use existing open-licensed sample audio files, do not self-record.**
  - Only source files with licenses permitting reuse, such as CC0, CC BY, or CC BY-SA on Wikimedia Commons.
    Do not take audio from dictionaries or commercial sites.
  - When downloading: rename to `<slug>.mp3`; trim leading and trailing silence; convert to mono mp3 under 50 KB.
  - Prefer sourcing all 44 sounds from **the same source** for a consistent voice.
- **Required:** maintain `public/audio/ipa/CREDITS.md` recording for each file: slug, original filename, source link, author, license, and edits made (trimming, format conversion).
  BY/BY-SA licenses require attribution, so include a small "Audio credits" line at the bottom of the panel linking to this list.
- Example words are spoken via `speechSynthesis` (`lang = "en-US"`).
  If no voice is available, hide the ▶ button on example words; sample sound playback still uses the mp3 files.
- Audio error or 404: the "Listen to sample" button shows `InlineError` "Unable to play audio".

## 11. Testing

`vitest.config.ts` runs both `*.test.ts` and `*.test.tsx`, defaulting to the `node` environment.
`jsdom`, Testing Library, and `src/test/setup.ts` (post-test cleanup) are already set up.
Every test file requiring DOM (`*.test.tsx`, hook tests) must begin with the docblock `// @vitest-environment jsdom`, matching tests in `lr-exam` and `home`.
Do not edit `vitest.config.ts`.
Colocate tests alongside source code.

| Test File                             | Coverage                                                                                                                                                                     |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ipa-sounds.test.ts`                  | All 44 sounds present, exact 12/8/24 split; unique `slug`; bidirectional `pairSlug`; `highlight` within `ipa` bounds; every `audioSrc` exists in `public/`                   |
| `assessment.test.ts`                  | `parseAssessment` accepts valid payloads, rejects missing or wrong-typed fields; `scoreTargetPhoneme` for single, multi-symbol, repeated, missing sounds; 59/60/79/80 labels |
| `api.test.ts`                         | Mock `fetch`: sends expected `FormData`; maps 401/413/429/5xx; aborts via `AbortSignal`                                                                                      |
| `practice-progress.test.ts`           | Does not crash if `localStorage` throws; returns empty on corrupted data                                                                                                     |
| `pronunciation-proxy.test.ts`         | Rejects cross-origin requests; enforces size limit; attaches token; timeout → 504; hides upstream errors; `upstream.ts` rejects non-http/https `API_BASE_URL`                |
| `use-pronunciation-recorder.test.tsx` | Mock `MediaRecorder`/`getUserMedia`: granted, denied, unsupported, auto-stop at 5s, URL revocation, mic disconnected                                                         |
| `ipa-chart.test.tsx`                  | Renders 3 groups and 44 buttons; `aria-pressed`; clicking a tile invokes selection with the right slug                                                                       |
| `sound-detail-panel.test.tsx`         | Displays symbol, articulation, 3 example words; invalid slug renders empty state                                                                                             |
| `practice-recorder.test.tsx`          | Walks through §8.2 state machine with mocked API; 401 shows sign-in link; 503 still allows playing back recording                                                            |

Manual verification before handoff: Chrome, Safari (records `audio/mp4`), Firefox (`audio/ogg`), at 375px width and desktop; navigate the entire page via keyboard; enable VoiceOver to verify result announcements.

Commands: `npm run lint`, `npm run typecheck`, `npm test`, and finally `npm run check`.

## 12. Implementation Plan

| Step | Task                                                                                                                                                  | Dependency | Target |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------ |
| B1   | 1-2h spike: call Azure with `Granularity=Phoneme`, `PhonemeAlphabet=IPA` for 5 words (think, this, here, on, ship), finalize §10.2 symbols and locale | Azure Key  | 19/11  |
| B2   | Finalize §9.1 contract with BE team                                                                                                                   | B1         | 19/11  |
| B3   | `ipa-sounds.ts` + tests; download 44 open-licensed sample audio files, normalize + `CREDITS.md`                                                       | -          | 20/11  |
| B4   | Layout, header, `IpaChart`, `SoundDetailPanel`, `?sound` sync, progress tracking                                                                      | B3         | 20/11  |
| B5   | `use-pronunciation-recorder`, `PracticeRecorder` (recording and playback)                                                                             | B4         | 21/11  |
| B6   | `assessment.ts`, `api.ts`, BFF proxy + tests; wire up `AssessmentResult`                                                                              | B2         | 21/11  |
| B7   | Backend endpoint (BE team), end-to-end testing with local backend                                                                                     | B2         | 21/11  |
| B8   | Small PR adding "Pronunciation" menu item (§3), requires code owner approval                                                                          | B4         | 22/11  |
| B9   | Manual QA, `npm run check`, capture UI screenshots, open PR to `dev`                                                                                  | B5-B8      | 22/11  |

If B7 is delayed, B6 can still be completed with mocked APIs in tests.
On the UI, an unavailable service falls back to the §8.4 state.
In that case, **AC3 is not considered complete**, because pronunciation assessment is a mandatory requirement.

## 13. Risks and Open Questions

| Risk / Question                                    | Mitigation                                                                                                                                                 |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RP phoneme chart mismatches Azure en-US phonemes   | `azurePhonemes` mapping table; verify in B1; consider `en-GB`                                                                                              |
| Sample audio copyright                             | Decided to use open-licensed sample files; document in `CREDITS.md` + "Audio credits" link                                                                 |
| Azure cost                                         | Require sign-in, rate limit, 10-second and 1 MiB limits                                                                                                    |
| Safari/Firefox record different audio formats      | Backend already has `ISpeakingAudioConverter`; manually test all 3 browsers                                                                                |
| Font fails to render all IPA glyphs                | Dedicated IPA font class within the feature (§7.1)                                                                                                         |
| Shared menu PR needs external approval             | Split into small PR (B8); page still works via direct URL                                                                                                  |
| **Open:** Does pronunciation assessment need auth? | Viewing IPA chart, listening to samples, recording: public. AI assessment: require sign-in for now (§9.1). Ask PO before B7; changing only affects backend |

## 14. Definition of Done

- [ ] `/pronunciation` displays all 44 sounds in 3 groups, consonants in pairs; works cleanly at 375px and desktop.
- [ ] Selecting a sound shows symbol, articulation, common mistake, 3 example words; sample audio and example words are playable.
- [ ] Record voice, play back recording, receive pronunciation score from backend, with dedicated target phoneme score and correction tips.
- [ ] Every error state in §8.2 and §8.4 has a proper UI, with no blank screen.
- [ ] "Pronunciation" item appears in desktop header and mobile sidebar (after PR B8).
- [ ] `grep -rn "features/speaking" src/features/pronunciation src/app/pronunciation src/app/api/pronunciation` returns only `fonts.ts` and `speaking-theme.css` in `layout.tsx`; `sp-learner` is not used.
- [ ] No files outside §3 scope are modified; `git diff dev --stat` contains only new files plus the two approved integration points.
- [ ] `npm run check` passes; BE contract is updated.
