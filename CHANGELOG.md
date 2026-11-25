# SmartClinic — Changelog

Live: https://smartclinic-abdelrhman-se.vercel.app · Repo: abdelrhmanhany996-ship-it/smartclinic

## 1. First release
- **Stack:** Next.js 15, TypeScript, Tailwind 4, PostgreSQL, signed-cookie auth (bcrypt + JWT), Web Push, PWA, Electron shell.
- **Roles:** Super Admin, Receptionist, Doctor — role guards on every API route; disabled users / suspended clinics lose access immediately.
- **Multi-clinic:** every query is scoped by the session's clinic; cross-clinic IDs return 404 (verified by tests).
- **Reception:** Overview, Calendar, New Appointment (slots → patient → confirm), Live Queue, Patients, Notifications, Reports, Settings; actions Check-in / Start / End / Skip / Recall / Reschedule / Cancel / No-show.
- **Booking confirmation:** queue number + private link, Send WhatsApp / Send Telegram / Copy link with a pre-written message.
- **Patient app** `/t/<token>` (no login): booked time vs estimated time, patients ahead, now serving, delay banner, "turn approaching" (clinic-configurable threshold), "your turn", completed; notifications centre; clinic address / call / directions; never shows other patients' data.
- **Queue engine** (`lib/queue.ts`): one queue per doctor per day, delays propagate, learns from today's real consultation times.
- **Doctor dashboard:** today's list, current / next patient, start / end, working hours and average duration, statistics.
- **Super Admin:** clinics, accounts, subscriptions, platform stats.
- **UI:** light / dark, Arabic RTL / English LTR, responsive; design tokens from the reference.
- **PWA:** manifest, service worker, offline page, icons, install prompt (Android) and instructions (iOS).
- **Docs / tooling:** README, `docs/DEPLOYMENT.md`, migrations, seed with fictional data, end-to-end test (`npm run test:e2e`).

## 2. Deployment
- Code pushed to GitHub; Vercel project linked (auto-deploy on push to `main`).
- Supabase (PostgreSQL) connected; migrations and first Super Admin are created during the build.
- `apphosting.yaml` added for Firebase App Hosting (Firebase project `smartclinic-eg-2026` created; not deployed — needs Blaze billing + GitHub link from the console).
- Vercel deployment protection removed so patients can open links; `APP_URL` set to the real domain.
- Demo data enabled (`SEED_DEMO=1`); the public demo Super Admin is never created in production.

## 3. PWA improvements
- Per-appointment manifest for patients (opens straight on their own queue, clinic name/colour).
- Staff "Add to Home Screen" button in the sidebar; manifest shortcuts.

## 4. Medical records & prescriptions
- Migration `002`: patient profile (birth date, gender, allergies, chronic conditions, blood type) and `prescriptions`.
- Doctor: **Patients** page with search; patient file (medical profile, allergy alert, visit history, prescription history).
- **Prescription:** diagnosis, medicines (name, dose, frequency, duration, instructions), advice, follow-up date; **voice dictation** (Web Speech API, Arabic / English).
- **Save & send + print** (A5 print layout) and **Save & send** — sends to the patient's app with an in-app notification and push.
- Patient app tab **My record**: all prescriptions, upcoming appointments and follow-ups, previous visits, own medical details, print.
- Medical data is doctor-only (reception sees demographics and visits); audit log entries for views, creates and sends.

## 5. Add patient
- **Add patient** button for reception and doctor; saving also books the visit and opens WhatsApp / Telegram with the message containing the patient's app link (copy link if "link only").
- Visit section: exam date, optional time (first free slot if empty), visit type chips (visit, follow-up, X-ray, lab test) and a details box.
- Migration `003`: `appointments.reason`. New visit types: X-ray, Lab test.
- "Save changes" renamed **Save** everywhere.
- Add and Edit use one shared patient-data form (name, phone, birth date, gender, contact method, blood type, allergies, chronic conditions, notes).

## 6. Doctor actions
- Next to each patient: **Postpone** (type the new date and time, or pick a free slot) and **Cancel booking**.
- Doctors may book into their own queue only, and cancel / postpone / no-show their own patients.
- Typed times accepted on any minute; clear message with the working hours when outside them; day-off / holiday messages.

## 7. Clinic schedule (Settings → Working days & hours)
- Open / closed per weekday with from–to hours; intersects with each doctor's own hours.
- **Holidays:** dated closures with an optional reason; booking and postponing are blocked (existing appointments are not auto-cancelled).
- Closed days shown in the calendar.

## 8. Send after save
- After saving patient edits or postponing, a dialog offers **WhatsApp / Telegram / Copy link** (or "Not now").
- **WhatsApp button** on the patient file (opens the chat; carries the app link when there is an active booking) and in the reception patient dialog.
- Emoji removed from WhatsApp / Telegram messages (WhatsApp's redirect corrupts them).

## 9. Fixes
- Supabase `EMAXCONNSESSION` (pool of 15): 2 connections per serverless instance, transaction pooler URL (`DATABASE_POOL_URL`, port 6543), no per-instance LISTEN; realtime falls back to 5-second polling on Vercel; function region moved to Dublin.
- "Already exists" when saving a patient: phones compared in normalised form, clash names the other patient; migration `004` stores all phones in international format; seed normalised.
- Error screen with auto-reload for stale tabs after a deploy.
- Login rate limit counts failed attempts only.
- Reports query alias bug; audit-log metadata bug; manifest duplicated on patient pages.

## 10. Tests
`npm run db:reset && npm run build && npm start`, then `npm run test:e2e` — 93 checks: booking → link → patient view → start → live update → delay → notifications → completion; permissions; clinic isolation; prescriptions; schedule and holidays.

## Security notes
- Rotate the Supabase database password and your Super Admin password (both were shared in chat).
- Demo accounts use the public password `Demo@123`; remove demo data before real use.
- Patient links are secret 144-bit tokens; anyone with the link sees that patient's record.
