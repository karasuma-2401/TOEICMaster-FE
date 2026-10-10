# Authentication frontend contract

The current frontend registration flow is available at `/register`. It does not create a session; after a successful registration request it asks the learner to verify their email.

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

`/login` provides the login and inline password-recovery interfaces. They validate fields in the browser and allow the learner to navigate between login, recovery, and registration. No credentials or recovery email addresses are sent or stored, and no authentication, Google sign-in, persistent-login, or recovery-email claim is made until a backend contract exists.

The backend must implement a contract before registration is linked from the homepage or before login, sessions, password recovery, and Google sign-in perform server requests.
