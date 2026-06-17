# Varnarc Portal

Node.js (Express + EJS) customer portal for Varnarc financial services: recharges, bill payments, money transfer, and related flows. It acts as a **Backend-for-Frontend (BFF)** in front of the **deployed Marg API** (Cloud Run) for menu data, authentication, recharges, and payments. It does **not** require a local `marg_api` unless you opt in for debugging.

A separate, modern **React + Vite** single-page app (in `frontend/`) consumes the portal's payment BFF endpoints and is intended for the newer payment/transaction experience.

---

## Technical Specification

### 1. Overview

| Aspect | Detail |
|--------|--------|
| Type | Server-rendered web portal (EJS) + BFF API, with an optional React SPA |
| Primary language | JavaScript (Node.js, CommonJS for the server; ESM for the React app) |
| Server framework | Express 4 |
| View engine | EJS 2.6 with `express-ejs-layouts` |
| SPA framework | React 19 + React Router 7, built with Vite 8, styled with Tailwind CSS 4 |
| Upstream | Marg API (Google Cloud Run, `asia-south1`) |
| Auth | Firebase phone-OTP (client) → Marg API verification → signed HttpOnly session cookie |
| Payments | Cashfree checkout (via Marg API order/verify endpoints) |
| Default server port | `4000` (`bin/www`, override with `PORT`) |
| Default SPA dev port | `5173` (Vite) |
| Node version | 18+ recommended |

### 2. Architecture

```
Browser ── HTML (EJS pages) ──────────────┐
Browser ── React SPA (frontend/, :5173) ──┤
                                           ▼
                          Varnarc Portal (Express, :4000)
                          - Server-rendered pages (views/)
                          - BFF/proxy API routes (routes/)
                          - In-process landing cache (lib/)
                          - Session cookie mint/verify (utils/, middleware/)
                                           │
                                           ▼ HTTP (api/http-client.js)
                          Marg API (Cloud Run, https://marg-api-…run.app)
                          - menu/sections/items, FAQs, banners
                          - user register/verify (Firebase)
                          - recharge operator/plans
                          - payment create-order/verify/history/refund
```

The portal is a thin orchestration + presentation layer. Business data and persistence live in the Marg API; the portal aggregates, caches, proxies (to avoid browser CORS), and renders.

### 3. Tech Stack

**Server (`package.json`)**
- `express ~4.16` — HTTP framework
- `ejs ~2.6` + `express-ejs-layouts ^2.5` — server-side templating
- `cookie-parser ~1.4` — reads the session cookie
- `morgan ~1.9` — request logging (`dev` format)
- `http-errors ~1.6` — typed HTTP errors for the error handler
- `debug ~2.6` — namespaced debug logging
- `nodemon ^2.0` (dev) — auto-reload
- Node built-ins `http`/`https`/`crypto` — upstream calls and HMAC session signing (no axios/node-fetch on the server)

**Frontend SPA (`frontend/package.json`)**
- `react ^19` / `react-dom ^19`
- `react-router-dom ^7`
- `axios ^1.16` — API client
- `vite ^8` + `@vitejs/plugin-react ^6` — dev server / bundler
- `tailwindcss ^4` + `@tailwindcss/vite` — styling
- `eslint ^10` — linting
- Cashfree checkout SDK (loaded for hosted checkout)

### 4. Entry Points & Boot Sequence

1. `bin/www` — reads `PORT` (default `4000`), creates the HTTP server, binds listeners (`error`, `listening`).
2. `app.js` — Express application:
   - `lib/load-dotenv()` loads `.env` first.
   - Configures EJS views, layouts, JSON/urlencoded body parsing, cookies, static `public/`.
   - Injects per-request `res.locals` helpers (`serviceSectionUrl`, `slugifyMenu`) and `authConfig` (Firebase web config + Marg API base URL) for templates.
   - Mounts routers (all under `/`): `index`, `non-authenticated`, `auth`, `public-api`, `recharges`, `payments`.
   - 404 + centralized error handler rendering `error-404` / `error-400` / `error-500` (error detail only in development).

### 5. Directory Layout

| Path | Responsibility |
|------|----------------|
| `app.js`, `bin/www` | Express app + HTTP server bootstrap |
| `routes/` | HTTP route handlers (pages, auth, BFF/proxy APIs) |
| `api/` | Marg API HTTP clients (one module per resource) |
| `api/services/` | Domain clients: payments, mobile/DTH operators & plans |
| `api/http-client.js` | Promise-based `http(s)` GET/POST/text helpers with timeouts |
| `api/config.js` | Resolves the Marg API base URL (`MARG_API_BASE_URL` / local / prod) |
| `lib/` | Hub navigation, menu-section trees, landing bundle cache, URL helpers |
| `middleware/` | `requireVarnarcSession` / `optionalVarnarcSession` guards |
| `utils/session-token.js` | HMAC-SHA256 signed session token mint/verify |
| `views/` | EJS templates (~200): landing, dashboard, services hub/leaf, policy, errors |
| `public/` | Static assets (CSS, JS, images, vendor editors) |
| `scripts/` | Generators for service leaf pages and hub menu icons |
| `docs/` | Reference docs (e.g. API pricing) |
| `frontend/` | React + Vite SPA (payments/transactions experience) |
| `design-reference/` | Static HTML theme reference (Cuba admin theme) |

### 6. Routing

#### 6.1 Page routes (server-rendered EJS)
- `GET /` — landing page (fetches the cached landing bundle).
- `GET /dashboardNew` — dashboard (optional session).
- `GET /services/:section/index` — section hub index (public; builds hub navigation from the menu tree).
- `GET /services/*` — service leaf pages (**session required** via `requireVarnarcSession`); path-traversal-guarded file resolution under `views/pages/services/`.
- `GET /pages/privacy-policy`, `/pages/term-conditions`, `/pages/refund-policy` — policy pages.
- Legacy redirects: `prepaid_meter → piped_gas`, `BillPayments/subscription → Recharge/subscription`.
- Bulk theme/demo routes registered from `PageData` / `withOutLayoutPageData` tables (Cuba theme pages, with and without layout).

#### 6.2 Auth routes (`routes/auth.js`)
- `GET /login` → 302 redirect to `/signin` (preserving query).
- `GET /signin` — renders sign-in; if a valid session cookie exists, redirects to the requested page (safe-redirect validated).
- `POST /api/auth/firebase/verify-phone` — accepts a Firebase `idToken`, calls Marg `POST /api/user/register`, then mints a signed `varnarc_session` HttpOnly cookie.
- `GET /api/auth/session` — returns the current authenticated user (or `authenticated:false`).
- `POST /api/auth/logout` — clears the session cookie.

#### 6.3 Recharge BFF (`routes/recharges.js`) — Bearer (Firebase ID token) required
- `POST /api/recharges/mobile/detect-operator`
- `POST /api/recharges/mobile/plans`
- `GET  /api/recharges/dth/operators`
- `POST /api/recharges/dth/plans`

#### 6.4 Payment BFF (`routes/payments.js`) — Bearer (Firebase ID token) required
- `POST /api/payments/create-order`
- `POST /api/payments/verify`
- `GET  /api/payments/history` (page/limit/status/search/menu_item_slug)
- `GET  /api/payments/status/:order_id`
- `POST /api/payments/refund`

These forward to Marg `*/api/payment/*` with the `Authorization: Bearer <idToken>` header.

#### 6.5 Public proxy (`routes/public-api.js`)
- `GET /api/company-info` — same-origin proxy for Marg company info (avoids CORS).
- `GET /api/proxy/svg?url=…` — allow-listed SVG icon proxy (`lib/allowed-asset-url.js`), cached 5 min.

### 7. Authentication & Session Model

- **Client OTP**: Firebase phone authentication runs in the browser using `authConfig` injected into templates; it yields a Firebase ID token.
- **Server verification**: the ID token is sent to `POST /api/auth/firebase/verify-phone`, which validates it through the Marg API (`/api/user/register`) and returns the user.
- **Session token** (`utils/session-token.js`): a custom compact token `base64url(payload).base64url(HMAC-SHA256)` signed with `APP_SESSION_SECRET`. Payload carries `uid`, `phoneNumber`, `iat`, `exp`. TTL is **7 days**. Verification is timing-safe and checks expiry.
- **Cookie**: `varnarc_session`, `HttpOnly`, `SameSite=Lax`, `Secure` in production, `maxAge = 7d`.
- **Guards** (`middleware/require-session.js`):
  - `requireVarnarcSession` — redirects anonymous users to `/`; attaches `req.varnarcUser`.
  - `optionalVarnarcSession` — attaches the user if present, otherwise continues.
- **BFF endpoints** authenticate per request using the `Authorization: Bearer <Firebase ID token>` header (not the session cookie), and forward the token upstream.
- In non-production, a missing `APP_SESSION_SECRET` falls back to an insecure dev secret (with a warning); in production it throws.

### 8. Upstream Integration (Marg API)

- **Base URL resolution** (`api/config.js`): `MARG_API_BASE_URL` env wins; else `USE_LOCAL_MARG_API=1` → `http://localhost:3002`; else production Cloud Run URL.
- **HTTP client** (`api/http-client.js`): hand-rolled Promise wrappers over Node `http`/`https` with `postJsonHttps`, `fetchJsonHttps`, `fetchTextHttps`. Default timeout **120s** (recharge detect+plans can be slow), configurable via `MARG_HTTP_TIMEOUT_MS`. Non-2xx responses reject with the upstream message.
- **Resource clients** (`api/*.js`): sections, categories, menu items, popular services, FAQs, web components, web banners; `api/services/*` for payments and recharge operators/plans.

### 9. Landing Bundle & Caching

`lib/landing-bundle.js` aggregates sections, popular services, FAQs, web components, banners, and per-section menu items into a single bundle, then builds the menu-section tree and static service-leaf URL map.

- **In-process cache** with TTL `LANDING_BUNDLE_CACHE_TTL_MS` (default **5 min**, `0` disables).
- **Single-flight**: concurrent requests share one in-flight fetch.
- **Stale-on-error**: if a refresh fails but cached data exists, the stale bundle is served.
- Purpose: avoid Marg API rate limits (≈100 req / 15 min per IP on Cloud Run).

### 10. Frontend SPA (`frontend/`)

- React 19 + React Router 7 SPA; routes: `/login`, `/register`, `/dashboard`, `/payment`, `/payment/success`, `/payment/failed`, `/history`. Protected routes wrapped in `ProtectedRoute`; global `AuthProvider` + `ToastProvider`.
- **API client** (`src/api/client.js`): axios instance. When `VITE_USE_PORTAL_BFF=true`, calls go to `/api/payments` (same-origin, proxied to the portal); otherwise directly to `VITE_MARG_API_URL` (`/api/payment`). Injects `Authorization: Bearer <token>` from `localStorage` (`varnarc_auth_token`).
- **Dev proxy** (`vite.config.js`): `/api` → `VITE_PORTAL_URL` (default `http://localhost:4000`).
- **Checkout**: `useCashfreeCheckout` hook drives the Cashfree SDK (`VITE_CASHFREE_MODE` toggles sandbox/production).

### 11. Error Handling

- Centralized Express error handler renders status-specific pages: `error-404` (404), `error-500` (≥500), `error-400` (otherwise).
- Error detail/message is exposed only when `env === development`.
- Auth/recharge/payment handlers map upstream failures to user-friendly messages and appropriate status codes (e.g. unreachable Marg API → `502` with remediation hint).

### 12. Build & Tooling

- Server: no build step; run directly with Node (`node ./bin/www`) or `nodemon` in dev.
- SPA: Vite (`vite build` → static assets in `frontend/dist`, `vite preview` to serve the build).
- Generators (`scripts/`): `generate-service-pages.js` regenerates service leaf EJS pages from the menu config; `generate-hub-menu-icons.js` generates hub menu icons.

### 13. Security Notes

- Session tokens are HMAC-signed and verified with constant-time comparison; cookies are `HttpOnly`/`SameSite=Lax`/`Secure` (prod).
- The SVG proxy enforces an allow-list of hosts to prevent SSRF/open-proxy abuse.
- Service-page file resolution normalizes paths and rejects `..` traversal, constraining reads to `views/pages/services/`.
- Open-redirect protection on `signin` (`safeRedirectPath`).
- Secrets (`APP_SESSION_SECRET`, Firebase server values) are environment-provided, not committed; put HTTPS in front in production.

---

## Requirements

- Node.js 18+ (recommended)
- Network access to the Marg API URL in `.env` (default: production Cloud Run)

## Setup

```bash
npm install
cp .env.example .env
# .env already points at the cloud API — no local marg_api needed
npm start
```

The app listens on port **4000** by default (`bin/www`).

### Optional: React SPA

```bash
cd frontend
npm install
cp .env.example .env
npm run dev   # Vite dev server on http://localhost:5173, proxies /api → :4000
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Run production server |
| `npm run dev` | Run with nodemon |
| `npm run generate:service-pages` | Regenerate service leaf pages from menu config |
| `cd frontend && npm run dev` | Run the React SPA dev server (Vite) |
| `cd frontend && npm run build` | Build the SPA for production |

## Environment

### Server (`.env`)

| Variable | Description |
|----------|-------------|
| `MARG_API_BASE_URL` | API base URL (default: production Cloud Run URL) |
| `USE_LOCAL_MARG_API` | Set to `1` to use `http://localhost:3002` instead of `MARG_API_BASE_URL` |
| `NODE_ENV` | Set to `production` for secure session cookies and to require `APP_SESSION_SECRET` |
| `APP_SESSION_SECRET` | HMAC secret for session tokens (required in production) |
| `MARG_HTTP_TIMEOUT_MS` | Optional upstream HTTP timeout (default 120000) |
| `LANDING_BUNDLE_CACHE_TTL_MS` | Landing bundle cache TTL in ms (default 300000; `0` disables) |
| `PORT` | Server port (default 4000) |
| `FIREBASE_WEB_*` | Firebase web client config injected into templates |

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_USE_PORTAL_BFF` | `true` to route API calls through the portal BFF (`/api/payments`) |
| `VITE_MARG_API_URL` | Direct Marg API URL when not using the BFF |
| `VITE_PORTAL_URL` | Portal URL the Vite dev server proxies `/api` to (default `http://localhost:4000`) |
| `VITE_CASHFREE_MODE` | `sandbox` or `production` checkout mode |
| `VITE_PORTAL_SIGNIN_URL` | Portal sign-in page (Firebase OTP) |

Firebase and other auth values are configured in the server environment / deployment platform (not committed).

## Deployment notes

1. Set `MARG_API_BASE_URL` to your production API URL (`.env.example` has the default).
2. Set `NODE_ENV=production` and `APP_SESSION_SECRET` on the host.
3. Run `npm install --production` on the host.
4. Use a process manager (PM2, systemd, or your PaaS) to run `node ./bin/www`.
5. Put HTTPS in front of the app (reverse proxy). Session cookies should be `secure` in production.
6. If serving the React SPA, run `cd frontend && npm run build` and host `frontend/dist` (or wire it behind the same reverse proxy).

## Related repositories

- Marg API backend (separate service) — required for live menu items, auth, recharge, and payment APIs.
