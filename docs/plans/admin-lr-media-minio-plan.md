# Plan: MinIO Media for Listening & Reading Administration

## Goal

Allow admins to import Listening/Reading content first and add media afterward:

- Listening MP3s attached per audio group.
- Reading images attached to questions or context blocks configured as requiring an image.
- Uploads go directly from the browser to MinIO using a backend-issued presigned URL.
- Drafts may lack media; revisions cannot be published while required media is still missing.

The decision and rationale are recorded in [ADR-001](../decisions/001-admin-lr-media-in-minio.md).

## Scope and boundaries

| In scope                                                                     | Out of scope                                                                |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Admin L&R, Excel import, MP3/image management, checklist, and publish gating | Migrating legacy files, learner player/UI, Speaking/Writing, public buckets |
| Backend/MinIO contract needed for presigned uploads                          | Exposing MinIO credentials or `API_BASE_URL` to the client                  |

## Target design

```text
Admin UI -> Next.js same-origin BFF -> Backend: create upload intent
Admin UI ---------------------------> MinIO: PUT with presigned URL
Admin UI -> Next.js same-origin BFF -> Backend: complete intent + attach asset
Backend -> MinIO: verify object / issue read URL when needed
```

`MediaAsset` stores metadata and object key; it does not store presigned URLs.
An `AudioGroup` has at most one active MP3.
Part 1/2 has one group per question; Part 3/4 has one group per question cluster.
Reading images are attached to a question or context block and are only required when the position is configured with `imageRequired`.

## Implementation plan

### 1. Finalize backend contract and MinIO configuration

Owner: backend + frontend

1. Update the backend API contract before writing client code.
   The contract must define request/response schemas, error codes, and authorization for: creating an upload intent, completing an intent, fetching a revision with media status, importing, and publish validation.
2. Define `MediaAsset`, `UploadIntent`, `AudioGroup`, and references from Listening questions/groups and Reading questions/context blocks.
   Finalize how `imageRequired` is represented.
3. Specify the allow-list, MIME types, maximum sizes, and URL expiration separately for `audio/mpeg` and supported image formats.
   The backend generates the object key; the key must not contain the admin-provided filename.
4. Configure a private bucket, CORS allowing only the admin frontend origin, and a policy for presigned PUTs.
   Do not put credentials in the frontend.
5. `complete` must verify that the object exists and matches the accepted size/content-type metadata before attaching the asset.
   Define expired/failed intent statuses and an orphan object cleanup mechanism.

**Completion criteria:** the API contract has been reviewed by both repositories; MinIO accepts direct uploads from the admin origin without the browser receiving secrets.

### 2. Update Listening import flow and prepare audio group data

Owner: backend + frontend

1. Update Listening Excel import to accept only the workbook (questions, answer choices, explanations); do not require MP3s during import.
2. The backend creates audio groups based on the part and imported group structure.
   Part 1/2 creates groups per question; Part 3/4 creates groups per cluster.
3. The revision/detail response returns each group with its label/question range, current asset, media status, and missing reason.
   It also returns Reading image positions and required flags.
4. Maintain compatibility with existing data using one of two approaches finalized before release: represent legacy `master-audio` as read-only legacy media, or block editing legacy revisions from the new flow.
   Do not perform migration within this scope.

**Completion criteria:** importing a new exam succeeds without an MP3; new revisions can read the list of groups and image requirements.

### 3. Build the presigned-URL upload client

Owner: frontend

1. Add a typed API client in `src/features/admin/` for creating intents, direct uploads, and completion; validate responses at the boundary.
2. Add Next.js route handlers under `src/app/api/admin/...` only to proxy authenticated business requests with session to the backend.
   The browser PUTs directly to MinIO using the returned URL; do not proxy file bytes through Next.js.
3. Replace the current multipart functions in `src/features/admin/exam-api.ts` (`uploadReadingImage`, `uploadReadingMasterAudio`) once the new contract is ready.
   Do not remove old endpoints before the backend confirms the compatibility strategy.
4. The upload UI displays file selection, uploading state, progress if available, success, retryable errors, and completion status.
   Reset the input after each upload so the same file can be selected again.
5. Perform early client-side checks on file type/size for fast feedback, but always treat backend/MinIO validation errors as the source of truth.

**Completion criteria:** a successful upload only appears as attached after `complete`; expired URLs/MinIO errors/complete failures never cause the UI to display a fake asset.

### 4. Add admin workspace and missing-media warnings

Owner: frontend

1. In the L&R admin page, add a Listening Media section: total groups, count with MP3, missing count, a group table with Part and question range, and upload/replace buttons.
2. Add a Reading Media Requirements section for questions/context blocks with `imageRequired`; use image asset IDs and metadata from the contract, and do not allow admins to enter arbitrary URLs.
3. Each missing status has a link/focus action to the exact group or Reading position.
   Every upload control has an accessible label, error message, and focus state.
4. Keep draft saving independent of the checklist.
   When clicking publish, show the local checklist; if the backend returns a validation error, render the missing items from the response.

**Completion criteria:** admins can identify and jump directly to every missing resource, while still being able to save drafts.

### 5. Publish gate and safe operations

Owner: backend + frontend

1. The backend recomputes validation on publish: all required audio groups have a completed audio asset; every `imageRequired` Reading position has a completed image asset; assets must belong to the matching revision/content owner.
2. Publish returns structured errors containing type, owner ID, label/range, and reason so the UI can navigate admins to the exact spot.
   The frontend does not treat the local checklist as permission to publish.
3. Record audit events for intent creation, asset completion/replacement, and publish failures caused by missing media; do not log presigned URLs or credentials.
4. Implement a periodically scheduled job/command to clean up expired intents and uncompleted/unattached objects with a configurable grace period.

**Completion criteria:** publish requests are blocked even when calling the API directly, and the response tells the admin the exact item to fix.

## Testing and acceptance

### Backend/API

- Admin creates valid/invalid intents; non-admin and non-same-origin requests are rejected per existing policy.
- Intents properly enforce MIME type, size, owner, and expiry; `complete` fails when the object does not exist or is invalid.
- Part 1/2 creates one group per question, Part 3/4 creates one group per cluster; MP3s are not duplicated.
- Publish passes when all required media is present and fails with an accurate list when MP3s/images are missing.
- Assets from another revision cannot be attached without authorization.

### Frontend

- Parse and type-check upload intent, completion, and media checklist responses; test error handling/401 refresh/cancellation following existing API helpers.
- Test successful direct PUT, expired URL/upload error, failed complete, and retry.
- Test Listening import without requiring an MP3; test disabled publish button/checklist and clear rendering of backend errors.
- Test link/focus from warnings to the exact audio group or image field.

### Manual checks

1. Import a Listening workbook without media.
2. Confirm the revision is in Draft and the checklist lists all missing groups.
3. Upload an MP3 for a Part 3/4 group and verify it serves the exact shared question range.
4. Configure a required Reading image, upload an image, and confirm its status changes to completed only after `complete`.
5. Attempt to publish while one item is missing (must be blocked), then upload all missing items and publish (must succeed).

## Expected frontend files to touch when coding begins

- `src/features/admin/exam-api.ts` and its co-located tests.
- `src/features/admin/lr-exercise-bank-api.ts` and L&R data bank components.
- `src/features/admin/components/reading-exam-workspace.tsx` or the successor L&R workspace once the contract cleanly separates Listening and Reading.
- `src/app/api/admin/exams/**` and new media route handlers.
- Parsers/types in `src/features/admin/exam-management.ts`.

The final list depends on the backend contract; the backend repository is not present in this workspace to cross-reference the API contract.

## Not in this phase

- Migrating existing media.
- Modifying learner-facing UI or player.
- Supporting batch/ZIP uploads, transcoding, waveforms, CDN, or deduplication.
- Opening a public MinIO bucket or storing long-lived credentials/presigned URLs on the client.
