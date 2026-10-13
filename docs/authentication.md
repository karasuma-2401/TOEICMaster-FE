# Authentication frontend contract

The browser calls same-origin Next.js routes. The route handlers use server-side `API_BASE_URL` to call the backend's `/api/auth/*` endpoints. Backend auth routes are **not** under `/api/v1`.

## Registration

`POST /api/auth/register` forwards trimmed `displayName` and `email` and the unchanged password to backend `POST /api/auth/register`. It returns `202` with no body, `400` with safe field errors, `409` for a duplicate email, or a generic `502` for unexpected failures. `confirmPassword` and terms consent remain browser-only. The existing verification screen appears after `202`; the backend does not yet send or verify a code.

## Login and Google sign-in

`POST /api/auth/login` accepts `{ "email": string, "password": string, "rememberMe": boolean }`. `POST /api/auth/google` accepts `{ "credential": string, "rememberMe": boolean }`. The Google credential comes from the Google Identity Services popup callback and is sent unchanged through Next.js to the backend. Google sign-in on `/register` uses `rememberMe=false` and requires the existing terms checkbox.

Both routes return `200 { "user": { "id": string, "displayName": string, "email": string } }` on success. Access and refresh tokens are never returned to browser JavaScript. Validation failures return `400` property errors, login credential failures `401`, and unsafe Google account linking `409`. Unexpected upstream responses return a generic `502`.

## Session and logout

Next.js encrypts the backend token pair, expiry times, user, and remember-me choice into one `HttpOnly`, `SameSite=Lax`, path `/` cookie. The cookie is `Secure` in production. With `rememberMe=false`, it is a browser-session cookie while the backend refresh session remains valid for one day. With `rememberMe=true`, its maximum age is capped by the backend's refresh expiry (up to 30 days). Configure `AUTH_SESSION_SECRET` as one 32-byte base64url key shared by all frontend instances; rotate it only when invalidating existing browser sessions is acceptable.

`GET /api/auth/session` returns one of `{ "status": "guest" }`, `{ "status": "refresh_required" }`, or `{ "status": "authenticated", "user": ... }`. It never returns tokens. The home-page account control calls `POST /api/auth/refresh` when needed. This rotates the backend refresh token and replaces the encrypted cookie. `POST /api/auth/logout` revokes the backend refresh token and clears the cookie after a `204`; if revocation fails, it reports an error so the user can retry.

The browser POST handlers require a same-origin `Origin` header. Auth responses use `Cache-Control: no-store`. Password recovery, verification, and account linking have no backend endpoints yet; their existing UI remains unchanged.

## Configuration

Set `API_BASE_URL` and `AUTH_SESSION_SECRET` in frontend runtime environment. Set `GOOGLE_CLIENT_ID` to the same Google Web Client ID as the backend and authorize the frontend origin in Google Cloud. The ID is passed from dynamically rendered auth pages to the browser. If it is missing, the Google control shows an unavailable message. For Docker Compose, supply these values through `.env.local` with `docker compose --env-file .env.local ...`.
