# Authentication frontend contract

The current frontend registration flow is available at `/register`. It does not create a session; after valid registration input or password-recovery input, the browser shows a six-digit verification screen for the supplied email. Verification and resend actions validate locally and do not make requests until a backend contract exists.

## Registration

The browser submits `POST /api/auth/register` to Next.js. The route handler uses the server-only `API_BASE_URL` and forwards the request to `POST /api/v1/auth/register`.

Request body:

```json
{
  "displayName": "Nguyen Van A",
  "email": "learner@example.com",
  "password": "at-least-eight-characters"
}
```

`displayName` and `email` are trimmed. Passwords are sent unchanged. The browser-only `confirmPassword` and required terms-consent fields are never forwarded.

| Backend result                                       | Next.js result                                           | Frontend behavior                   |
| ---------------------------------------------------- | -------------------------------------------------------- | ----------------------------------- |
| `202 Accepted`                                       | `202` with no body                                       | Show the email-verification message |
| `400 ValidationProblemDetails`                       | `400 application/problem+json` with safe property errors | Show field errors                   |
| `409 Conflict` for an existing email                 | `409 application/problem+json`                           | Show the duplicate-email error      |
| Unexpected response, timeout, or unavailable service | `502 application/problem+json`                           | Show a generic service error        |

## Login and password recovery UI

`/login` provides the login, inline password-recovery, and email-verification interfaces. After valid recovery input or an accepted registration request, the browser shows a six-digit verification screen for the supplied email. Verification and resend actions validate locally and do not make requests until a backend contract exists.

The backend must implement a contract before registration is linked from the homepage or before login, sessions, password recovery, and Google sign-in perform server requests.
