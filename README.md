# Varnarc Portal

Node.js (Express + EJS) customer portal for Varnarc financial services: recharges, bill payments, money transfer, and related flows. Integrates with the Marg API for authenticated operations.

## Requirements

- Node.js 18+ (recommended)
- Marg API running locally or in production (see `MARG_API_BASE_URL`)

## Setup

```bash
npm install
cp .env.example .env
# Edit .env — set MARG_API_BASE_URL for your Marg API host
npm start
```

The app listens on port **4000** by default (`bin/www`).

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Run production server |
| `npm run dev` | Run with nodemon |
| `npm run generate:service-pages` | Regenerate service leaf pages from menu config |

## Environment

| Variable | Description |
|----------|-------------|
| `MARG_API_BASE_URL` | Marg API base URL (default `http://localhost:3002` in development) |
| `NODE_ENV` | Set to `production` for production Marg API routing |
| `MARG_HTTP_TIMEOUT_MS` | Optional upstream HTTP timeout |

Firebase and other auth values are configured in the server environment / deployment platform (not committed).

## Project layout

- `app.js`, `bin/www` — Express application entry
- `routes/` — HTTP routes (pages, auth proxy, recharges API)
- `views/` — EJS templates (landing, services hub, leaf pages)
- `public/` — Static assets (CSS, JS, images)
- `api/` — Marg API HTTP clients
- `lib/` — Hub navigation, service URL helpers

## Deployment notes

1. Set `NODE_ENV=production` and `MARG_API_BASE_URL` to your production Marg API URL.
2. Run `npm install --production` on the host.
3. Use a process manager (PM2, systemd, or your PaaS) to run `node ./bin/www`.
4. Put HTTPS in front of the app (reverse proxy). Session cookies should be `secure` in production.

## Related repositories

- Marg API backend (separate service) — required for live menu items, auth, and recharge APIs.
