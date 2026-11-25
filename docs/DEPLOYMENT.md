# Deployment

## Requirements
Node 20+, PostgreSQL 14+ (Supabase, Neon, RDS, self-hosted), HTTPS (required for PWA install & push).
Hosting must allow **long-lived HTTP responses** (SSE) and a long-running Node process — use a container/VM (Fly.io, Railway, Render, VPS, Docker). Serverless platforms with short function timeouts will fall back to the 15–30 s polling safety net.

## Environment variables
| Var | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `PGSSL` | `require` for managed Postgres |
| `AUTH_SECRET` | ≥32 random chars, signs sessions |
| `APP_URL` | public https URL used in patient links |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` / `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Web Push (`npx web-push generate-vapid-keys`) |
| `INSECURE_COOKIES` | only for plain-http staging |

## Steps
```bash
npm ci && npm run build
npm run db:migrate          # idempotent; tracks applied files in _migrations
npm run db:seed             # OPTIONAL demo data (skip in production; create the first super admin by SQL below)
npm start                   # PORT=3000
```
First super admin (production): `insert into users(role,email,password_hash,name) values('super_admin','you@co.com','<bcrypt hash>','Owner');` (hash: `node -e "console.log(require('bcryptjs').hashSync('pw',10))"`). Then create clinics from `/admin`.

Reverse proxy: disable response buffering for `/api/events` and `/api/track/*/events` (nginx: `proxy_buffering off;` — the app also sends `X-Accel-Buffering: no`).

## Docker
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
ENV NODE_ENV=production
EXPOSE 3000
CMD ["sh","-c","npm run db:migrate && npm start"]
```

## Production checklist
- Rotate `AUTH_SECRET`; never run `db:seed` (demo token & passwords are public).
- Backups for Postgres; scale web instances horizontally (LISTEN/NOTIFY syncs them).
- Defense in depth: consider Postgres RLS keyed on `clinic_id` if exposing the DB to other clients.
- WhatsApp/Telegram messages are opened pre-filled for manual Send (no Business API needed).

## Adding migrations
Add `db/migrations/002_xxx.sql`; `npm run db:migrate` applies new files in order.
