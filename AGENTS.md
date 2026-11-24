# AI guidance - TOEICMaster Frontend

This file applies to the entire frontend repository, including when cloned alone.
Read `README.md` and the actual configuration files before working.
If this guidance differs from the manifests or CI, follow the manifests and CI, then update this file.
In the two-repository workspace, also read `../AGENTS.md`.

For feature work, read `docs/feature-development.md` for an implementation map, existing examples, local setup, and testing guidance.
The backend API contract is in `../TOEICMaster-BE/docs/contracts/api-contract.md` when both repositories are present.
When cloned alone, use the running backend's OpenAPI document and the contract in the issue.

## Stack and versions

- Node.js `24.21.0` in `.nvmrc` (`package.json` requires `>=24.21.0 <25`), npm 11;
  install from `package-lock.json` with `npm ci`.
- Next.js `16.4.6` (App Router, Turbopack, standalone output); React and React DOM `19.3.0`.
- TypeScript `^5` with `strict: true`;
  Tailwind CSS `^4`.
  For version ranges, use `package-lock.json` to find the exact installed version.
- Oxlint `1.87.0`, Prettier `3.9.9`, Vitest `5.0.3`.
  Vite is a Vitest dependency, not the frontend runtime.
- Version sources of truth: `.nvmrc`, `package.json`, `package-lock.json`, `next.config.ts`, and `tsconfig.json`.

## Structure and code style

- `src/app/`: Next.js routes, layouts, and route handlers.
  `src/features/<feature>/`: feature UI, logic, and API functions.
  `src/shared/`: genuinely shared code, including HTTP client, server proxies, UI primitives, and scoped storage.
- Prefer React Server Components.
  Add `"use client"` only where state, effects, event handlers, or browser APIs are needed.
  Never put secrets or `API_BASE_URL` in the client bundle.
  The browser calls same-origin routes;
  server route handlers call the backend.
- Keep strict TypeScript types.
  Treat HTTP data as `unknown` and validate it at the boundary;
  do not use `any` to bypass errors.
  Use the `@/*` alias for internal imports when appropriate.
  Follow existing naming.
- The versioned OpenAPI snapshot is `docs/contracts/openapi.json`;
  deterministic generated types are in `src/shared/api/generated/openapi.types.ts`, with the stable facade at `src/shared/api/openapi.ts`.
  After a backend contract change, run `npm run contract:sync -- --source <path>` (or set `OPENAPI_SOURCE_PATH`) to copy and regenerate;
  use `npm run contract:generate` for local regeneration and `npm run contract:check` to detect drift.
- Use Tailwind CSS 4 with `shadcn/ui` (`radix-ui` primitives, `class-variance-authority`, `clsx` + `tailwind-merge` via `cn()`, and `tw-animate-css`) for shared UI components and overlays, and `recharts` for charts/analytics.
  Prefer accessible UI primitives over hand-rolled dialogs, drawers, dropdowns, or tabs, and preserve semantic HTML, visible focus states, design tokens, and responsive layouts.
- `.editorconfig`: UTF-8, LF, two-space indentation, and a final newline.
  Prettier: double quotes, semicolons, trailing commas.
  Format affected files;
  avoid unrelated mass formatting.
- Vitest configuration runs two projects:
  the `node` environment covers `src/**/*.test.ts` and `scripts/**/*.test.ts`;
  the `jsdom` environment covers DOM and component tests across `src/**/*.test.tsx`.
  Mock HTTP/environment boundaries and test behavior, errors, and cancellation where relevant.
  Playwright specs live under `tests/e2e/`.

## Rules for AI changes

1. Check `git status` and read related code and tests;
   preserve existing changes.
   Make a focused, complete change.
   Do not change lockfiles, configuration, CI, or dependencies outside the task's scope.
2. Preserve the backend contract.
   If routes, schemas, statuses, or errors change, update tests and coordinate with the backend repository when available.
   Never hard-code the backend URL in a client component.
3. Use `.env.example` as a template;
   keep `.env.local` local.
   Never commit credentials or place secrets in `NEXT_PUBLIC_` variables.
   Handle upstream errors without exposing internal details.
4. Run relevant tests, lint, and type checks after code changes.
   Before handing off a substantial change, run `npm run check`.
   CI also runs `npm run audit`;
   when changing dependencies, run the audit and update `package.json` and `package-lock.json` together.
5. Report commands run and results, or why a check could not run.
   Do not delete tests, disable lint/type checks, or weaken configuration merely to pass checks.

## Enforced Rule Table

| Rule                          | Forbidden Pattern                                                                   | Approved Solution                                                                                                | Enforcing Mechanism                                                                            |
| :---------------------------- | :---------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------- |
| `no-duplicate-guid-regex`     | Duplicate GUID regex literals outside the shared guard                              | Import `isGuid` or `isNullableGuid` from `@/shared/lib/guards`                                                   | `npm run lint:guardrails` (`scripts/check-guardrails.mjs`), `scripts/check-guardrails.test.ts` |
| `no-raw-bff-fetch`            | Raw `fetch()` inside `src/app/api/**` routes or `src/features/**/server/**` proxies | Use `createBffProxy` or `forwardBffRequest` from `@/shared/server/bff-proxy`                                     | `npm run lint:guardrails` (`scripts/check-guardrails.mjs`), `scripts/check-guardrails.test.ts` |
| `no-raw-storage`              | Direct `localStorage` / `sessionStorage` calls in feature stores or components      | Use `readScopedStorage` or `writeScopedStorage` from `@/shared/lib/storage` with `{ namespace, userId }` scoping | `npm run lint:guardrails` (`scripts/check-guardrails.mjs`), `scripts/check-guardrails.test.ts` |
| `no-raw-dialog-open`          | Native `<dialog open>` elements in feature markup                                   | Use accessible `Dialog` and `ConfirmDialog` primitives from `@/shared/components/ui/dialog`                      | `npm run lint:guardrails` (`scripts/check-guardrails.mjs`), `scripts/check-guardrails.test.ts` |
| `no-browser-dialogs`          | `window.alert` / `window.confirm` calls                                             | Use `ConfirmDialog` from `@/shared/components/ui/dialog`                                                         | `npm run lint:guardrails` (`scripts/check-guardrails.mjs`), `scripts/check-guardrails.test.ts` |
| `no-duplicate-auth-refresh`   | Duplicate `navigator.locks` / `refreshSession` coordination                         | Use `fetchWithAuthRefresh` / `refreshSessionLocked` from `@/shared/api/http`                                     | `npm run lint:guardrails` (`scripts/check-guardrails.mjs`), `scripts/check-guardrails.test.ts` |
| `no-double-cast`              | `as unknown as Type` double casting                                                 | Validate inputs with runtime guards from `@/shared/lib/guards`                                                   | `npm run lint:guardrails` (`scripts/check-guardrails.mjs`), `scripts/check-guardrails.test.ts` |
| `no-ts-suppress`              | Unjustified `@ts-ignore` / `@ts-expect-error` comments                              | Fix the underlying TypeScript types                                                                              | `npm run lint:guardrails` (`scripts/check-guardrails.mjs`), `scripts/check-guardrails.test.ts` |
| `no-unjustified-lint-disable` | Bare `eslint-disable` or `oxlint-disable` without `-- <reason>`                     | Include an explicit `-- <reason>` on the suppression line                                                        | `npm run lint:guardrails` (`scripts/check-guardrails.mjs`), `scripts/check-guardrails.test.ts` |
| `no-new-legacy-proxy`         | Feature server proxies omitting `@/shared/server/bff-proxy`                         | Route through `createBffProxy` or `forwardBffRequest`                                                            | `npm run lint:guardrails` (`scripts/check-guardrails.mjs`), `scripts/check-guardrails.test.ts` |
| `oxlint-rules`                | Hook violations, unsafe `any`, banned `@ts-` directives                             | Adhere to strict TypeScript and React 19 rules                                                                   | `npm run lint` (`oxlint src`), `.oxlintrc.json`                                                |
| `type-correctness`            | Type errors, missing props, unhandled promises, invalid contracts                   | Fix types strictly; never bypass with `any`                                                                      | `npm run typecheck` (`next typegen && tsc --noEmit`), `tsconfig.json`                          |
| `contract-integrity`          | Drift between backend OpenAPI spec and generated frontend types                     | Run `npm run contract:sync` or `npm run contract:generate`                                                       | `npm run contract:check` (`scripts/sync-openapi-types.mjs check`)                              |
| `code-formatting`             | Tab characters, inconsistent quotes, trailing spaces, CRLF line endings             | Follow EditorConfig and Prettier specifications                                                                  | `npm run format:check` (`prettier --check .`), `.editorconfig`, `.prettierrc.json`             |
| `behavior-verification`       | Regressions in unit, HTTP, proxy, UI accessibility, or guardrail logic              | Run automated test suites across Node and jsdom                                                                  | `npm test` (`vitest run`), `vitest.config.ts`                                                  |
| `production-build`            | Broken production build or standalone package generation failures                   | Resolve Next.js compilation, prerender, or packaging errors                                                      | `npm run build` (`next build && node scripts/prepare-standalone.mjs`), `next.config.ts`        |

## Standard commands

```sh
npm ci
npm run dev
npm run format:check
npm run contract:sync
npm run contract:generate
npm run contract:check
npm run lint
npm run typecheck
npm test
npm run check
```

Run commands from the frontend repository root.
`npm run check` covers formatting, contract drift detection, lint, type checking, tests, and a production build.
For documentation-only changes, checking Markdown and the diff is sufficient;
an application build is unnecessary.
