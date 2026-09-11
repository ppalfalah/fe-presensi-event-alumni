# E2E — Phase 1

Exactly one Chromium smoke test checks the real public landing page: HTTP 200,
root URL and the heading “Menjaga Silaturahmi, Menjaga Keberkahan.” No API mocks,
login, storage state, CRUD or spreadsheet scenarios are implemented. Public event
data is requested by the app, but the smoke does not certify API/data correctness.

## Run locally

Prerequisites: Node **22+** (CI uses 22; setup verified on 24), npm, installed
frontend dependencies, and the existing Laravel/PHP 8.2+ backend for public events.
Run commands from `fe-presensi-event-alumni` unless noted otherwise.

```sh
npm ci
npx playwright install chromium
```

On Linux CI, browser system libraries may also require
`npx playwright install --with-deps chromium`. No Firefox/WebKit needed.

Copy `.env.e2e.example` to `.env.e2e` if it does not already exist (PowerShell:
`Copy-Item .env.e2e.example .env.e2e`). Do not overwrite a configured file.
The local file is ignored; only the example is committed. Set:

```env
E2E_TARGET=local
E2E_BASE_URL=http://localhost:3000
E2E_API_URL=http://localhost:8000
```

URLs are origins without `/api`. Credential fields are intentionally blank and
unused in Phase 1. Do not copy production accounts. Config uses Node's native
`loadEnvFile`, not dotenv; process environment variables take precedence. CI may
provide all three required variables without a file. Missing/invalid values fail
with an explanatory error; there is no production fallback.

In a separate backend terminal, using the existing **local** configuration:

```sh
cd presensi-event-backend
php artisan serve --host=localhost --port=8000
```

Do not run migrations/reset/seed as part of this smoke. Read-only public requests
may use the existing local development server for Phase 1 only. Backend is not
started/stopped by Playwright. The landing shell also renders when API is unavailable;
that is not evidence of a healthy backend.

Stop your frontend dev server before running E2E. Playwright starts/stops a fresh
`next dev --webpack` on `E2E_BASE_URL`, overriding **both** public API environment
variables and `BACKEND_URL` for its child process. Existing `.env*` files remain
untouched. `reuseExistingServer: false` prevents reusing a server built with unknown
API settings. Do not run another Next dev/build in this checkout simultaneously.

```sh
npm run test:e2e
npm run test:e2e:ui
npm run test:e2e:headed
npm run test:e2e:report
```

On PowerShell with restrictive execution policy, use `npm.cmd` / `npx.cmd`.
Local runs use zero retries, CI one; one worker. Failure traces, screenshots and
videos are retained in ignored artifacts. Treat reports/traces as sensitive once
authenticated tests exist; never commit them.

## Safety and isolation

- The shared config guard recognizes `local`, `staging`, `production`.
- **All production execution is blocked**, including smoke; no bypass flag.
  `ppalfalah.id` and every subdomain are blocked regardless of target label.
- `local` requires HTTP loopback origins for both servers. `staging` requires
  explicit HTTPS origins and manually managed servers (no local webServer).
  Before using staging, verify its deployed frontend API URL and DB are isolated;
  a target label cannot prove database isolation or detect an arbitrary production
  hostname. Do not point staging at production or use tunnels to production.
- No destructive tests on any environment in Phase 1. Future destructive specs
  must retain this config guard and require verified dedicated fixtures/DB.

## Current architecture audit / next phases

- FE: Next 16.1.6 App Router, React 19.2.3, TypeScript, Tailwind 4, TanStack Query 5,
  Axios plus `fetchAPI`; npm lockfile v3, deploy workflow uses `npm ci`, Node 22,
  lint/build. No previous E2E suite or FE test script found. Next requires Node
  >=20.9; this E2E convention recommends 22+ for native env-file support.
- Public `/` includes PWA support and `GET /api/events/public`. Separate UI routes
  `/admin/login`, `/alumni/login`, `/alumni/register`; admin page posts
  `/api/auth/login` with role `admin`. Alumni registration creates pending users
  without login tokens; Google OAuth and password-reset flows also exist.
- Auth: Sanctum Bearer tokens, not cookie auth (`withCredentials: false` in FE).
  Admin uses `access_token`, alumni `alumni_token`, in localStorage and
  sessionStorage; role-aware reads and heartbeat/logout are already implemented.
  Later fixtures must follow actual page flows, not the legacy `useAuth` hook's
  `/login` alias. Do not assume sessionStorage is captured by storageState.
- BE: Laravel 12, PHP ^8.2, Sanctum 4, Socialite, L5-Swagger. Admin routes use
  `auth:sanctum` + `is_admin`; admin-account management requires `is_super_admin`.
  Inactive admins are blocked too. Alumni status is pending/active/inactive/rejected.
  Existing event/category, QR, registration, attendance, domicile, broadcast,
  reporting and engagement controllers remain untouched. Presensi uses `hadir`,
  registration uses `attended`. CORS allows configured local origins, including
  ports 3000; supports_credentials on BE does not change FE Bearer behavior.
- DB: current local connection is MySQL on 127.0.0.1:3306; examples also use MySQL.
  PHPUnit uses SQLite `:memory:`, RefreshDatabase and in-process Sanctum helpers.
  These cannot seed/isolate a separately running E2E backend, nor prove MySQL
  strict-mode compatibility. Existing backend feature/unit tests and deployment
  workflow are unchanged.
- Default `DatabaseSeeder` runs CategorySeeder + environment-configured AdminSeeder.
  Optional DummyDataSeeder covers alumni, events, attendance and domicile, but is
  not a deterministic E2E fixture contract. No existing account credentials were
  copied and no seeder was run.

**Phase 2:** audit/map the black-box spreadsheet; it has not been read or converted.
**Phase 3:** provision a dedicated local MySQL schema (e.g. `presensi_event_e2e`) and
least-privileged DB user, separate Laravel `.env.e2e` selected with `--env=e2e`,
separate backend port/origin, cache/session/storage isolation, safe mail/WhatsApp
and queue configuration. Ensure cached config cannot select the developer DB.
Only then add explicit guarded seed/reset/cleanup commands, deterministic accounts
(including approval states/admin levels), region/event/QR fixtures and controlled
dates. No such provisioning is performed here. Auth fixture design follows that
planning; do not proceed automatically.
