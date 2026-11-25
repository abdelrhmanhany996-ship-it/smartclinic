import './env';
import crypto from 'crypto';
import { pool, q1 } from '../lib/db';
import { hash } from '../lib/auth';
import { DEFAULT_SETTINGS } from '../lib/queue';
import { clinicNow, fromMin, addDays, toMin } from '../lib/time';

let seed = 42; const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const tok = () => crypto.randomBytes(18).toString('base64url');
const ADMIN = 'Admin@123', DEMO = 'Demo@123';

async function user(clinicId: string | null, role: string, email: string, name: string, pw: string) {
  return (await pool.query('insert into users(clinic_id,role,email,password_hash,name) values($1,$2,$3,$4,$5) returning id', [clinicId, role, email, hash(pw), name])).rows[0].id as string;
}
async function doctor(clinicId: string, o: any) {
  const uid = await user(clinicId, 'doctor', o.email, o.name, DEMO);
  return (await pool.query(
    `insert into doctors(clinic_id,user_id,name,name_ar,specialty,specialty_ar,code,avg_duration_min,work_start,work_end,break_start,break_end)
     values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) returning id`,
    [clinicId, uid, o.name, o.nameAr, o.spec, o.specAr, o.code, o.avg, o.start, o.end, o.bs ?? null, o.be ?? null])).rows[0].id as string;
}
async function patient(clinicId: string, name: string, phone: string, channel = 'whatsapp') {
  return (await pool.query('insert into patients(clinic_id,full_name,phone,channel) values($1,$2,$3,$4) on conflict (clinic_id,phone) do update set full_name=excluded.full_name returning id', [clinicId, name, phone, channel])).rows[0].id as string;
}
const counters = new Map<string, number>();
async function appt(clinicId: string, doc: { id: string; code: string }, pid: string, date: string, min: number, status: string, o: any = {}) {
  const k = doc.id + date; const seq = (counters.get(k) ?? 100) + 1; counters.set(k, seq);
  const time = fromMin(min);
  const at = (m: number) => new Date(new Date(`${date}T00:00:00Z`).getTime() + m * 60000 - 2 * 3600000).toISOString(); // Cairo ≈ UTC+2 (approximate; history only)
  const ci = o.ci ?? (['checked_in', 'in_consultation', 'completed'].includes(status) ? o.nowCi ?? at(min - 10) : null);
  const st = o.st ?? (['in_consultation', 'completed'].includes(status) ? at(min + (o.late ?? 0)) : null);
  const en = o.en ?? (status === 'completed' ? at(min + (o.late ?? 0) + (o.dur ?? 15)) : null);
  const r = await pool.query(
    `insert into appointments(clinic_id,doctor_id,patient_id,appt_date,appt_time,visit_type,channel,ticket_seq,ticket_code,token,status,sort_key,checked_in_at,started_at,ended_at,notified_est,notified_upcoming,notified_turn)
     values($1,$2,$3,$4,$5,$6,'whatsapp',$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$16) returning id,token`,
    [clinicId, doc.id, pid, date, time, o.vt ?? 'consultation', seq, `${doc.code}-${seq}`, o.token ?? tok(), status, new Date(`${date}T${time}:00Z`).getTime() / 60000 + seq / 1000, ci, st, en, min, status !== 'booked']);
  return r.rows[0];
}

async function main() {
  const exists = await q1('select 1 from clinics limit 1');
  if (exists) { console.log('Database already seeded (run `npm run db:reset` to start over).'); await pool.end(); return; }
  // never create the public demo super admin if a real one already exists (production)
  if (!(await q1("select 1 from users where role='super_admin'"))) await user(null, 'super_admin', 'admin@smartclinic.app', 'Platform Owner', ADMIN);

  const c1 = (await pool.query(
    `insert into clinics(slug,name,name_ar,address,phone,email,brand_color,settings) values('nile-care','Nile Care Clinic','عيادة نايل كير','12 Corniche El Nile, Maadi, Cairo','+20 2 2735 1100','hello@nilecare.demo','#087E83',$1) returning id`,
    [{ ...DEFAULT_SETTINGS, language: 'en' }])).rows[0].id as string;
  const c2 = (await pool.query(
    `insert into clinics(slug,name,name_ar,address,phone,email,brand_color,settings) values('al-noor-dental','Al-Noor Dental Center','مركز النور لطب الأسنان','45 Makram Ebeid St, Nasr City, Cairo','+20 2 2402 7788','info@alnoor.demo','#1D5FA8',$1) returning id`,
    [{ ...DEFAULT_SETTINGS, language: 'ar', notify_ahead_threshold: 2 }])).rows[0].id as string;
  await pool.query(`insert into subscriptions(clinic_id,plan,status,max_doctors,price_monthly,current_period_end) values($1,'pro','active',10,1200,current_date+21),($2,'starter','trialing',3,0,current_date+9)`, [c1, c2]);

  await user(c1, 'receptionist', 'reception@nilecare.demo', 'Mona Hassan', DEMO);
  await user(c2, 'receptionist', 'reception@alnoor.demo', 'Hadeer Ali', DEMO);
  const dA = { id: await doctor(c1, { email: 'sara@nilecare.demo', name: 'Dr. Sara Mahmoud', nameAr: 'د. سارة محمود', spec: 'Internal Medicine', specAr: 'الباطنة', code: 'A', avg: 15, start: '09:00', end: '21:00', bs: '14:00', be: '14:30' }), code: 'A' };
  const dB = { id: await doctor(c1, { email: 'omar@nilecare.demo', name: 'Dr. Omar Fathy', nameAr: 'د. عمر فتحي', spec: 'Pediatrics', specAr: 'الأطفال', code: 'B', avg: 20, start: '10:00', end: '20:00' }), code: 'B' };
  const dC = { id: await doctor(c2, { email: 'laila@alnoor.demo', name: 'Dr. Laila Samir', nameAr: 'د. ليلى سمير', spec: 'Orthodontics', specAr: 'تقويم الأسنان', code: 'A', avg: 30, start: '10:00', end: '20:00' }), code: 'A' };

  const now = clinicNow('Africa/Cairo');
  const base = Math.min(Math.max(Math.floor(now.min / 15) * 15, 600), 1140);
  const nowIso = new Date().toISOString();
  const names = ['Sara Mostafa', 'Omar Khaled', 'Lina Fouad', 'Nour Zaki', 'Youssef Adel', 'Mariam Tarek', 'Karim Nabil', 'Hana Gamal', 'Ali Ramadan', 'Dina Salah', 'Tamer Wagdy', 'Reem Ashraf'];
  const P: string[] = []; for (let i = 0; i < names.length; i++) P.push(await patient(c1, names[i], '010' + String(10000000 + i * 7919).slice(0, 8)));
  const ahmed = await patient(c1, 'Ahmed Hassan', '01001234567');

  // Demo journey, Dr. Sara: A-101 done, A-102 in consultation, 4 waiting ahead of Ahmed (A-105)
  await appt(c1, dA, P[0], now.date, base - 30, 'completed', { dur: 14 });
  await appt(c1, dA, P[1], now.date, base - 15, 'in_consultation', { st: nowIso, nowCi: nowIso });
  await appt(c1, dA, P[2], now.date, base, 'checked_in', { nowCi: nowIso });
  await appt(c1, dA, P[3], now.date, base + 15, 'checked_in', { nowCi: nowIso });
  const A105 = await appt(c1, dA, ahmed, now.date, base + 60, 'booked', { token: 'demo-ahmed-A105-track-link-xyz' });
  await appt(c1, dA, P[4], now.date, base + 30, 'booked');
  await appt(c1, dA, P[5], now.date, base + 45, 'booked');
  await appt(c1, dA, P[6], now.date, base + 75, 'booked', { vt: 'follow_up' });
  await appt(c1, dA, P[7], now.date, base + 90, 'booked', { vt: 'checkup' });
  await appt(c1, dB, P[8], now.date, Math.max(600, base - 20), 'completed', { dur: 20 });
  await appt(c1, dB, P[9], now.date, Math.max(600, base), 'checked_in', { nowCi: nowIso });
  await appt(c1, dB, P[10], now.date, base + 20, 'booked');
  await appt(c1, dB, P[11], now.date, base + 40, 'booked', { vt: 'follow_up' });
  await pool.query(`insert into notifications(clinic_id,appointment_id,audience,kind,title,body,data) values($1,$2,'patient','confirmed','Appointment confirmed','Your queue number is A-105',$3)`, [c1, A105.id, { ticket: 'A-105', time: fromMin(base + 60), date: now.date }]);

  // History for reports (last 14 days, deterministic)
  for (let d = 1; d <= 14; d++) {
    const date = addDays(now.date, -d); const dow = new Date(date + 'T12:00:00Z').getUTCDay(); if (dow === 5) continue;
    for (const doc of [dA, dB]) {
      const avg = doc === dA ? 15 : 20, n = 8 + Math.floor(rnd() * 8); let t = 600;
      for (let i = 0; i < n; i++) {
        const r = rnd(); const pid = P[Math.floor(rnd() * P.length)];
        const status = r < 0.08 ? 'no_show' : r < 0.14 ? 'cancelled' : 'completed';
        const late = Math.floor(rnd() * 25), dur = avg + Math.floor(rnd() * 10) - 3;
        await appt(c1, doc, pid, date, t, status, { late, dur, vt: rnd() < 0.3 ? 'follow_up' : 'consultation' });
        t += avg;
      }
    }
  }
  // Clinic 2 (Arabic) small queue
  const Q = ['Mahmoud Saeed', 'Salma Ibrahim', 'Khaled Younes', 'Nada Mourad'];
  const bT = Math.min(Math.max(Math.floor(now.min / 30) * 30, 600), 1080);
  for (let i = 0; i < Q.length; i++) {
    const pid = await patient(c2, Q[i], '011' + String(20000000 + i * 1013).slice(0, 8));
    await appt(c2, dC, pid, now.date, bT + (i - 1) * 30, i === 0 ? 'completed' : i === 1 ? 'in_consultation' : 'booked', i === 1 ? { st: nowIso, nowCi: nowIso } : {});
  }
  console.log(`Seeded. Demo logins (password ${DEMO}; super admin ${ADMIN}):
  admin@smartclinic.app | reception@nilecare.demo | sara@nilecare.demo | omar@nilecare.demo | reception@alnoor.demo | laila@alnoor.demo
  Patient demo link: /t/demo-ahmed-A105-track-link-xyz`);
  await pool.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
