# AI guidance — TOEICMaster Frontend

This file applies to the entire frontend repository, including when cloned alone. Read `README.md` and the actual configuration files before working. If this guidance differs from the manifests or CI, follow the manifests and CI, then update this file. In the two-repository workspace, also read `../AGENTS.md`.

For feature work, read `docs/feature-development.md` for an implementation map, existing examples, local setup, and testing guidance. The backend API contract is in `../TOEICMaster-BE/docs/api-contract.md` when both repositories are present. When cloned alone, use the running backend's OpenAPI document and the contract in the issue.

## Stack and versions

- Node.js `24.21.0` in `.nvmrc` (`package.json` requires `>=24.21.0 <25`), npm 11; install from `package-lock.json` with `npm ci`.
- Next.js `16.4.0` (App Router, Turbopack, standalone output); React and React DOM `19.3.0`.
- TypeScript `^5` with `strict: true`; Tailwind CSS `^4`. For version ranges, use `package-lock.json` to find the exact installed version.
- Oxlint `1.87.0`, Prettier `3.9.9`, Vitest `5.0.3`. Vite is a Vitest dependency, not the frontend runtime.
- Version sources of truth: `.nvmrc`, `package.json`, `package-lock.json`, `next.config.ts`, and `tsconfig.json`.

## Structure and code style

- `src/app/`: Next.js routes, layouts, and route handlers. `src/features/<feature>/`: feature UI, logic, and API functions. `src/shared/`: genuinely shared code, currently including the HTTP client.
- Prefer React Server Components. Add `"use client"` only where state, effects, event handlers, or browser APIs are needed. Never put secrets or `API_BASE_URL` in the client bundle. The browser calls same-origin routes; server route handlers call the backend.
- Keep strict TypeScript types. Treat HTTP data as `unknown` and validate it at the boundary; do not use `any` to bypass errors. Use the `@/*` alias for internal imports when appropriate. Follow existing naming.
- Use Tailwind CSS 4 for styling. Keep semantic HTML, accessible labels, visible focus states, and responsive layouts. Add a UI library or state manager only for a demonstrated need.
- `.editorconfig`: UTF-8, LF, two-space indentation, and a final newline. Prettier: double quotes, semicolons, trailing commas. Format affected files; avoid unrelated mass formatting.
- Place Vitest tests next to code as `*.test.ts`. The current configuration uses Node and includes only `src/**/*.test.ts`. Mock HTTP/environment boundaries and test behavior, errors, and cancellation where relevant. For DOM/browser tests, deliberately add suitable tooling; the current setup does not include jsdom.

## Rules for AI changes

1. Check `git status` and read related code and tests; preserve existing changes. Make a focused, complete change. Do not change lockfiles, configuration, CI, or dependencies outside the task's scope.
2. Preserve the backend contract. If routes, schemas, statuses, or errors change, update tests and coordinate with the backend repository when available. Never hard-code the backend URL in a client component.
3. Use `.env.example` as a template; keep `.env.local` local. Never commit credentials or place secrets in `NEXT_PUBLIC_` variables. Handle upstream errors without exposing internal details.
4. Run relevant tests, lint, and type checks after code changes. Before handing off a substantial change, run `npm run check`. CI also runs `npm run audit`; when changing dependencies, run the audit and update `package.json` and `package-lock.json` together.
5. Report commands run and results, or why a check could not run. Do not delete tests, disable lint/type checks, or weaken configuration merely to pass checks.

## Standard commands

```sh
npm ci
npm run dev
npm run format:check
npm run lint
npm run typecheck
npm test
npm run check
```

Run commands from the frontend repository root. `npm run check` covers formatting, lint, type checking, tests, and a production build. For documentation-only changes, checking Markdown and the diff is sufficient; an application build is unnecessary.
