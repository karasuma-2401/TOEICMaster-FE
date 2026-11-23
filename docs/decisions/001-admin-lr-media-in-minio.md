# ADR-001: Store Admin Listening & Reading Media in MinIO

## Status

Accepted

## Date

2026-10-31

## Context

Admins need to import Listening questions from Excel first, and then upload the corresponding MP3 files.
The Excel file only contains question content, answer choices, and explanations; it does not contain media.
Admins also need to upload images for Reading questions or contexts whose configuration requires an image.

The frontend currently has multipart upload routes through the Next.js BFF for images (`POST /api/admin/exam-media/images`) and a single `master-audio` for the entire revision.
The new approach does not use `master-audio` as the Listening media model: audio must be attached to the actual content unit so it is clear exactly which part is still missing.

The current goal covers only the Listening & Reading admin screen.
Learner flows are unchanged, and legacy data/files are not migrated within this scope.

## Decision

### 1. MinIO is the object storage; the backend owns permissions and metadata

Images and MP3s are stored in MinIO.
The bucket is not public.
The backend is the only component granted long-lived MinIO credentials, generating object keys, and validating admin permissions, file types, and size limits.

The frontend does not receive MinIO credentials and does not generate object keys.
The frontend only receives a short-lived presigned URL along with required headers, and then uploads the file directly to MinIO.

After the PUT succeeds, the frontend calls the backend `complete` endpoint.
The backend verifies that the object exists and matches the issued properties before creating/updating metadata and attaching the asset to the content.
An expired upload URL or an incomplete upload does not create a referenceable asset.

### 2. Listening MP3s are attached per audio group

`AudioGroup` is the MP3 ownership unit, not individual questions:

- Part 1 and Part 2: each question has one audio group.
- Part 3 and Part 4: questions belonging to the same conversation/talk share one audio group.

Each audio group has at most one active audio asset.
Questions reference the audio group so the same MP3 is not uploaded or stored repeatedly across multiple questions.

### 3. Reading images are intentionally attached assets

Images are attached to a Reading question or the context block of a question group, depending on where the image is configured.
Each position can declare `imageRequired`.
If required, that position is only complete once it has a valid image asset.
Alt text remains metadata of the Reading content and is not inferred from the filename.

### 4. Drafts can be saved; publishing is blocked when required media is missing

Importing and saving drafts do not require MP3s/images.
When opening the workspace, admins see the total count and list of missing audio groups or image positions, with each item linking directly to the corresponding position to upload the file.
The backend is the final source of truth: the publish endpoint rejects revisions with missing required media, even if the frontend is stale or bypassed.

The frontend also checks before submitting publish to display an easy-to-understand checklist, but does not replace backend validation.

## Proposed contract boundaries

Exact endpoint names will be finalized in the backend API contract.
The required boundaries are:

1. Admin requests an upload intent with the media type and owner (audio group or Reading position).
2. Backend authenticates, generates an unpredictable object key, and returns the intent ID, presigned URL, expiration, headers, and enforced limits.
3. Browser uploads directly to MinIO.
4. Admin confirms completion with the intent ID; backend verifies the object and then attaches the `MediaAsset` to the owner in a consistent operation.
5. The revision API returns media completeness/missing status and the identifiers needed to render the checklist.

`MediaAsset` should store at least: ID, bucket, object key, media type, content type, byte size, ETag/checksum if available, status, creation timestamp, and owner.
Do not store long-lived presigned URLs in the database.
Playback/preview URLs for admins or learners are issued by the backend when needed under future access policies.

## Alternatives considered

### Frontend sends multipart through Next.js/backend

- Pros: fewer endpoints and simpler CORS.
- Cons: MP3s pass through the frontend server/backend, increasing application bandwidth, memory, and processing time.
- Rejected: unsuitable for audio files and the requirement to offload the backend.

### One master MP3 for the entire revision

- Pros: simpler upload UI.
- Cons: cannot represent grouped audio for Part 1/2 and Part 3/4; cannot warn accurately about which group is missing.
- Rejected: does not match the TOEIC structure and confirmed admin requirements.

### Store free-form `audioUrl`/`imageUrl` in Excel or the database

- Pros: quick to implement.
- Cons: bypasses permission control, validation, and asset lifecycle, and easily creates broken links or objects not belonging to the system.
- Rejected: MinIO assets must be managed by the backend by identifier, not by admin-entered URLs.

### Only warn about missing media while still allowing publish

- Pros: flexible for admins.
- Cons: could release an unplayable exam to learners.
- Rejected: saving drafts already provides flexibility; publish must serve as a quality gate.

## Consequences

- The backend needs audio group/media asset models, an upload intent lifecycle, publish validation, and CORS/presigned policies for MinIO.
- The frontend needs to replace existing multipart uploads with client uploads via presigned URLs, and add media checklists/warnings in the admin workspace.
- Incomplete upload resources may become orphan objects; a job or cleanup process is needed for objects without an asset or with expired intents.
- The backend API contract is not yet in the frontend workspace, so exact schemas/endpoints will only be finalized when the backend updates the contract.
  This is not a migration for existing assets.

## Out of scope

- Migrating legacy URLs/files into MinIO.
- Learner exam-taking screen, audio playback, and image display.
- Public buckets, MinIO credentials in the browser, or permanent public URLs.
- Media upload for Speaking/Writing.
