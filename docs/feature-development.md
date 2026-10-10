# Implementing a frontend feature

This guide maps an issue to frontend code and tests. See the [README](../README.md) for Node/npm and backend setup. `AGENTS.md` contains the required rules. Do not invent a screen or business model from a feature name; start with confirmed acceptance criteria and API contracts.

## File map

- Routes, layouts, and server rendering: `src/app/`; see `page.tsx` and `layout.tsx`.
- Feature UI, state, and logic: `src/features/<feature>/`; see `features/system/components/connection-status.tsx`.
- Feature API calls: `src/features/<feature>/api.ts`; see `features/system/api.ts`.
- Shared HTTP helpers: `src/shared/api/`; see `client.ts`.
- Proxy/BFF using server configuration: `src/app/api/<feature>/.../route.ts`; see `app/api/system/ping/route.ts`.
- Logic and route-handler tests: `*.test.ts` next to code; see `features/system/api.test.ts` and `app/api/system/ping/route.test.ts`.

Prefer Server Components for server-rendered screens. Add `"use client"` at the smallest boundary requiring interaction, state, or browser APIs. The current connection-status feature uses a client component calling a same-origin route; that is an example, not a rule for every data flow. Keep server-to-server API calls and secrets on the server. For asynchronous data, handle loading, error, and empty states where relevant, and use semantic, accessible HTML.

## Existing end-to-end code path

`ConnectionStatus` calls `ping(signal)` → `getJson` calls same-origin `/api/system/ping` → the Next.js route handler calls backend `/api/v1/system/ping` using `API_BASE_URL` → the UI shows ready/error and offers retry. The route handler validates the URL and upstream response, times out after five seconds, and returns a generic 502 on failure. The component aborts the request on unmount; tests cover the contract, errors, and cancellation.

For a new API: confirm the backend contract first; put the typed API function under the feature; validate network JSON before using it when its shape controls important behavior. Add a route handler when server-side processing, a same-origin proxy, or secret handling is needed. Never expose `API_BASE_URL` or credentials through `NEXT_PUBLIC_*`.

## Tests and local environment

- Vitest currently runs in Node and includes `src/**/*.test.ts`; use it for API helpers, parsers, and route handlers. Mock `fetch`/environment as in the ping tests and clean up mocks after each test.
- Test success, unexpected data, HTTP/upstream errors, and cancellation when relevant. Assert observable outputs and boundary calls, not just implementation details.
- DOM/browser testing is not configured yet. When a feature needs browser-level verification, add suitable tooling and tests with that feature; `*.test.tsx` will not automatically run under the current setup.
- `npm test` and `npm run check` do not need a live backend; current tests mock `fetch`. For the live UI, copy `.env.example` to `.env.local`, start the backend as its README describes, then run `npm ci` and `npm run dev`. `/api/health` checks only Next.js; the connection status shown on the page checks the backend.

```sh
npm ci
npm run check
```

`npm run check` covers formatting, Oxlint, type checking, Vitest, and a production build. For documentation-only changes, checking Markdown and the diff is sufficient. For new APIs, consult `TOEICMaster-BE/docs/api-contract.md` when that repository is in the workspace; when cloned alone, use the backend's Development OpenAPI document and the issue's contract description.

## Before handing off

Match the UI and API behavior to each acceptance criterion. Report loading/error/empty states, routes and requests checked, screenshots for UI changes where useful, commands run, and anything not verified. If design or business rules are missing, state assumptions before expanding scope.
