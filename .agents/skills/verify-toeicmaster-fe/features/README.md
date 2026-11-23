# TOEICMaster Frontend verification map

This directory is the maintained source for verifying the user-facing behavior of the TOEICMaster Next.js web application and BFF surface.
Read this index before driving the application, then use the matching feature file as the execution recipe.

## Baseline preconditions

- Launch the frontend application on an isolated local port using the verification harness.
- Set dedicated temporary runtime directories so concurrent runs do not share PID state or server instances.
- Ensure the verification scripts under `scripts/` are executable.
- Run `doctor.sh` or `verify-fe.mjs doctor` to verify that the instance is running and returning HTTP 200 at `/api/health`.
- Never drive an instance that was not started by this verification run.

## Driving conventions

- Start every recipe from the baseline state unless its preconditions specify otherwise.
- Prefer ARIA roles and accessible names over CSS selectors or DOM positions.
- Treat every command as literal.
- Run browser actions through the Playwright driver recipe.
- Proof artifacts survive the teardown and are written to `/tmp/toeicmaster-fe-verify-<run_id>/evidence/`.

## Proof and skip reporting

- Capture the user action and the resulting state, not only the final screen.
- UI proof includes an ARIA snapshot and a full-page screenshot with the application identity visible.
- Record the feature ID and entry point with every artifact.
- When the live backend is unavailable, document which route and client-side interactions were driven directly.
- Report any skipped or mock-isolated backend journey clearly without falsifying live backend coverage.

## Features

- [Authentication and Home](./auth-and-home.md) covers landing page navigation, hero exam cards, header menus, and login form client-side validation.
- [Listening and Reading](./listening-reading.md) covers the Listening and Reading exam library, test filters, and exam attempt entry points.
- [Flashcards](./flashcards.md) covers vocabulary decks, topic filtering, flip cards, and interactive Speed Match game rounds.
- [Admin Exams](./admin-exams.md) covers the Data Bank Center, exam revisions, and administrative exercise management views.
