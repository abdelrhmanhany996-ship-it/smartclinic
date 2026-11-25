# SmartClinic — Less Waiting. Better Care.

Real-time clinic appointments & live patient queue. Reception, doctors and patients share one synchronized, multi-tenant platform.
Next.js 15 · TypeScript · Tailwind 4 · PostgreSQL · SSE realtime (Postgres LISTEN/NOTIFY) · Web Push · PWA · Electron.

## Quick start
```bash
npm install
cp .env.example .env.local        # set DATABASE_URL, AUTH_SECRET (openssl rand -base64 48), APP_URL
npm run db:reset                  # migrations + fictional demo data
npm run dev                       # http://localhost:3000
```
Demo logins (password `Demo@123`): `reception@nilecare.demo`, `sara@nilecare.demo` (doctor), `omar@nilecare.demo`, `reception@alnoor.demo` (clinic B, Arabic); super admin `admin@smartclinic.app` / `Admin@123`.
Patient demo link: `/t/demo-ahmed-A105-track-link-xyz` (seed only — real links are random 144-bit tokens).

## Test the full journey
```bash
npm run db:reset && npm run build && npm start &
npm run test:e2e        # book → link → patient view → start visit → live update → delay → notify → complete (+ isolation, RBAC)
```

## Architecture
| Concern | Implementation |
|---|---|
| Auth / RBAC | bcrypt + signed JWT httpOnly cookie; roles `super_admin`, `receptionist`, `doctor`; middleware + per-route guards; disabled users/suspended clinics lose access instantly |
| Tenant isolation | every staff query is scoped by `clinic_id` from the session (never from request input); cross-clinic ids return 404; verified in e2e |
| Queue engine | `lib/queue.ts` (pure): one queue per doctor/day; est. start = max(doctor free, booked time); overruns propagate; learned avg blends today's real durations |
| Realtime | every action → `afterChange()` → `pg_notify` → SSE (`/api/events`, `/api/track/:token/events`) → clients refetch. Multi-instance safe. Polling fallback |
| Notifications | in-app (banner + list) always; Web Push when VAPID keys set. Kinds: confirmed, upcoming (configurable threshold), delay/earlier (configurable min shift), your_turn, completed… sent once per condition |
| Private links | `/t/<token>`; patient API returns only own data + counts + "now serving" ticket |
| Audit | `audit_logs` for bookings, actions, settings, admin changes |
| i18n / theme | EN LTR / AR RTL (logical CSS), light/dark via cookie, no flash |
| PWA | per-appointment manifest (`/t/:token/manifest.webmanifest`), service worker (offline shell + push), install prompt (Android) / instructions (iOS) |
| Desktop | `desktop/` Electron shell loading your hosted URL |

Structure: `db/migrations`, `lib/` (service, queue, auth, events), `app/api`, `app/{app,doctor,admin,t,login}`, `components/`, `scripts/` (migrate, seed, e2e), `desktop/`.

## Supabase
SmartClinic talks to plain PostgreSQL. To use Supabase: create a project, set `DATABASE_URL` to its connection string (use the pooler **session** mode or direct connection — LISTEN/NOTIFY needs a non-transaction pooler) and `PGSSL=require`, then `npm run db:migrate && npm run db:seed`. Auth is handled by the app (JWT) so no Supabase Auth setup is required; Supabase Realtime isn't needed because realtime uses LISTEN/NOTIFY + SSE.

## Windows .exe
Set `desktop/config.json` `url` to your deployed HTTPS URL, then on Windows: `npm run desktop:build` → `dist/SmartClinic Setup.exe`. Try locally: `SMARTCLINIC_URL=http://localhost:3000 npm run desktop`.

## Deployment
See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).
