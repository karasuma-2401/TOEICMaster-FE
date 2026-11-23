# TOEICMaster Frontend

Frontend for the TOEIC learning and exam preparation application.

**Tech stack:** React 19, Next.js 16 (App Router), TypeScript, TailwindCSS 4, shadcn/ui (Radix UI), and Recharts.
Uses npm, Oxlint, Prettier, and Vitest.

The application runs on Next.js.
Vite appears in dependencies because Vitest uses it to run tests, not as the project's frontend runner.

## Prerequisites

- Git.
- Node.js 24 LTS, minimum 24.21.0, and npm 11.
  The team's standard version is in `.nvmrc`; CI reads the same file.
- TOEICMaster backend running at `http://localhost:5287`.

Check installed versions:

```sh
node --version
npm --version
git --version
```

If your machine is still using Node.js 24.14.1 from a previous setup, update to 24.21.0 or a newer patch release in the 24.x line before running.
With nvm on macOS/Linux, run `nvm install` and `nvm use`; with nvm-windows, run `nvm install 24.21.0` then `nvm use 24.21.0`.
You can install from [Node.js](https://nodejs.org/en/download) if you do not use nvm.

## Local machine setup (recommended for development)

Run the frontend with `npm run dev` so the UI automatically updates as you edit code.
Docker is not required for the frontend; the backend along with Redis, MinIO, and Mailpit can still be run with Docker according to the backend repository's README.

1. Clone the frontend repository and open a terminal in the repository directory:

   ```sh
   git clone <FRONTEND_REPO_URL> toeicmaster-fe
   cd toeicmaster-fe
   ```

   Replace `<FRONTEND_REPO_URL>` with the team's GitHub URL.

2. Create the configuration file:

   Windows PowerShell:

   ```powershell
   Copy-Item .env.example .env.local
   ```

   macOS/Linux:

   ```sh
   cp .env.example .env.local
   ```

   Default values:

   ```dotenv
   API_BASE_URL=http://localhost:5287
   GOOGLE_CLIENT_ID=<same Google Web Client ID configured in the backend>
   AUTH_SESSION_SECRET=<32 random bytes encoded as base64url>
   ```

   If the backend uses a different address, update this value and restart the frontend.
   This variable is only used on the Next.js server.
   Generate `AUTH_SESSION_SECRET` with `node -e 'console.log(require("node:crypto").randomBytes(32).toString("base64url"))'`.
   Keep this value secret and use the same value across frontend instances.
   `GOOGLE_CLIENT_ID` is a public ID, must match the backend, and requires Google's authorized JavaScript origin to be configured for the frontend address.

3. Install dependencies and run:

   ```sh
   npm ci
   npm run dev
   ```

4. Open `http://localhost:3000`.
   When the backend is running, the page will display a successful connection status.

Each team member creates `.env.local` locally on their machine; this file is ignored by Git.
Do not put database or SMTP credentials into the frontend.

## Running daily

After the initial setup, open a terminal in the frontend repository and run:

```sh
npm run dev
```

If you previously ran the frontend with Docker, stop the container to free port `3000` first:

```sh
docker compose stop frontend
npm run dev
```

The `stop frontend` command only stops the frontend in this repository; services from the backend repository keep running.

## Running with Docker (optional)

Docker packages the application together with Node.js and its libraries for a consistent runtime environment.
This configuration is used to verify builds, support CI, and prepare for future deployment.
Docker is not required for frontend development.

The current container runs a production build and does not auto-reload when code changes.
After editing code, re-run `docker compose up -d --build` to rebuild and update the container; if using the shared network, re-run the command with both Compose files below.

Requires Docker Desktop running Linux containers or Docker Engine with Compose v2.

If the backend is running on the host machine:

```sh
docker compose --env-file .env.local up -d --build
```

Open `http://localhost:3000`.
The frontend container calls the backend via `host.docker.internal:5287`.

If both repositories run in Docker, use the shared network so behavior is identical on Windows/macOS/Linux:

```sh
docker network create toeicmaster-local
docker compose --env-file .env.local -f docker-compose.yml -f docker-compose.shared.yml up -d --build
```

Run the backend with the backend repository's `docker-compose.shared.yml` override.
The network only needs to be created once; if it already exists, skip the create command.

View logs and stop the frontend:

```sh
docker compose logs -f frontend
docker compose down
```

## Common commands

| Command          | Purpose                                                   |
| ---------------- | --------------------------------------------------------- |
| `npm run dev`    | Run the development server with auto-reload on code edits |
| `npm run check`  | Check formatting, lint, TypeScript, tests, and build      |
| `npm run format` | Format code                                               |
| `npm test`       | Run tests                                                 |
| `npm run audit`  | Audit dependencies                                        |
| `npm run build`  | Build standalone output                                   |
| `npm start`      | Run the built app; reads `.env.local` if present          |

## Structure

For new features, see the [feature development guide](docs/feature-development.md) for file placement, an existing code path, and verification steps.
The [authentication contract](docs/authentication.md) describes session and registration behavior.
The **User story** template in `.github/ISSUE_TEMPLATE/` captures acceptance criteria and implementation context for AI.

```text
src/
  app/                Routes, layouts, and Next.js route handlers
  features/           Feature-based code
  shared/             HTTP client and shared code
scripts/              Prepare standalone output
.github/              CI, image publishing, and Issue templates
```

Connection status calls `/api/system/ping` on Next.js, which then calls `/api/v1/system/ping` on the backend.

## Troubleshooting

- **Cannot connect to the service:** verify that the backend is running, `API_BASE_URL` is set correctly, and port 5287 is reachable.
- **Port 3000 is in use:** if the frontend container is running, run `docker compose stop frontend` before running `npm run dev`; if another application is using the port, stop that application or run `npm run dev -- --port 3001`.
- **npm ci reports dependency mismatch:** verify the correct Node/npm versions and pull the latest `package-lock.json`; do not delete the lock file to bypass the error.

## CI and team collaboration

Workflows are adapted from [UGTM](https://github.com/karasuma-2401/UGTM/tree/772b2157457bd9d4aabc316c770dfbd90ee79549) and run CI on PRs/pushes to `dev` or `main`.
Publishing the image to GHCR only runs after CI succeeds on pushes from this repository itself.

Feature/fix branches open PRs into `dev`; releases go through PRs from `dev` into `main`.
When creating the GitHub repository, push workflows to the default branch `main` and allow Actions to publish packages using `GITHUB_TOKEN`.
Azure deployment will be configured when the VPS is ready.

GitHub Actions are pinned by commit SHA and use Node 24 for JavaScript actions.
When updating dependencies, commit both `package.json` and `package-lock.json`, and run `npm run check` and `npm run audit`.
Learning flows and browser E2E tests will be added according to the backlog.

<details>
<summary>Reference UGTM configuration license (MIT)</summary>

```text
MIT License

Copyright (c) 2026 Win Transparent Pear

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

</details>
