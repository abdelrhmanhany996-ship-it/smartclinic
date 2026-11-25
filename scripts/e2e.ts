/**
 * End-to-end test of the full patient journey against a running server.
 *   npm run db:reset && npm run build && npm start   (other terminal)
 *   BASE_URL=http://localhost:3000 npm run test:e2e
 */
import './env';
import { q, pool } from '../lib/db';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
let pass = 0, fail = 0;
const ok = (c: any, m: string) => { if (c) { pass++; console.log('  ✓', m); } else { fail++; console.log('  ✗ FAIL:', m); } };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

class Client {
  cookie = '';
  async req(path: string, body?: any, method?: string) {
    const r = await fetch(BASE + path, { method: method ?? (body ? 'POST' : 'GET'), headers: { 'Content-Type': 'application/json', cookie: this.cookie }, body: body ? JSON.stringify(body) : undefined, redirect: 'manual' });
    const sc = r.headers.get('set-cookie'); if (sc) this.cookie = sc.split(';')[0];
    let j: any = null; try { j = await r.json(); } catch {}
    return { status: r.status, j };
  }
  async login(email: string, password: string) { const r = await this.req('/api/auth/login', { email, password }); if (r.status !== 200) throw new Error('login failed ' + email); return this; }
}
const track = async (token: string) => (await fetch(`${BASE}/api/track/${token}`)).json();
const notes = async (token: string) => (await track(token)).notifications.map((n: any) => n.kind) as string[];

async function main() {
  console.log('SmartClinic E2E →', BASE);
  const rec = await new Client().login('reception@nilecare.demo', 'Demo@123');
  const doc = await new Client().login('sara@nilecare.demo', 'Demo@123');
  const { j: cl } = await rec.req('/api/clinic');
  const sara = cl.doctors.find((d: any) => d.code.trim() === 'A');
  const today = cl.today;

  console.log('\n[1] Receptionist books an appointment');
  const slots = (await rec.req(`/api/slots?doctorId=${sara.id}&date=${today}`)).j.slots.filter((s: any) => s.available);
  ok(slots.length > 0, `available slots found (${slots.length})`);
  const slot = slots[slots.length - 1];
  const bk = await rec.req('/api/appointments', { fullName: 'Test Patient Ahmed', phone: '0100 555 7777', date: today, time: slot.time, doctorId: sara.id, visitType: 'consultation', channel: 'whatsapp' });
  ok(bk.status === 200 && /^A-\d+$/.test(bk.j.ticket), `queue number generated: ${bk.j.ticket}`);
  const token = bk.j.token;
  ok(token.length >= 24 && bk.j.link.endsWith('/t/' + token), 'unique secure tracking link generated');
  ok(bk.j.whatsappUrl.startsWith('https://wa.me/201005557777?text='), 'WhatsApp deep link targets patient number');
  const msg = decodeURIComponent(bk.j.whatsappUrl.split('text=')[1]);
  ok(['Nile Care Clinic', 'Dr. Sara Mahmoud', bk.j.ticket, bk.j.link].every((x) => msg.includes(x)), 'message has clinic, doctor, queue number and link');
  ok(bk.j.telegramUrl.startsWith('https://t.me/share/url?url='), 'Telegram share link generated');
  const dup = await rec.req('/api/appointments', { fullName: 'Someone Else', phone: '01001111111', date: today, time: slot.time, doctorId: sara.id, visitType: 'consultation', channel: 'link' });
  ok(dup.status === 409, 'double-booking the same slot is rejected');

  console.log('\n[2] Patient opens private link (no login)');
  const v1 = await track(token);
  ok(v1.appointment.ticket === bk.j.ticket && v1.appointment.status === 'booked', 'tracking page shows confirmed appointment');
  ok(v1.appointment.time === slot.time && v1.queue.estimatedTime, 'original time and estimated time both present');
  const leak = ['Sara Mostafa', 'Omar Khaled', 'Lina Fouad', 'Nour Zaki', 'Youssef Adel', 'Mariam Tarek', 'Karim Nabil', '010'];
  ok(!leak.some((n) => JSON.stringify(v1).includes(n)), "no other patient's personal data in patient payload");
  ok((await fetch(`${BASE}/api/track/not-a-real-token-123456789`)).status === 404, 'invalid token → 404');
  let ahead = v1.queue.ahead; console.log('     patients ahead:', ahead);
  ok(ahead >= 2, 'patient has people ahead of them');
  ok((await notes(token)).includes('confirmed'), 'confirmation notification stored');

  console.log('\n[3] Realtime: SSE stream open on patient link');
  const ac = new AbortController(); let refreshes = 0;
  fetch(`${BASE}/api/track/${token}/events`, { signal: ac.signal }).then(async (r) => { const rd = r.body!.getReader(); const dec = new TextDecoder(); for (;;) { const { value, done } = await rd.read(); if (done) break; refreshes += (dec.decode(value).match(/event: refresh/g) ?? []).length; } }).catch(() => {});
  await sleep(500);

  console.log('\n[4] Start Visit updates patient queue live');
  const queue = async () => (await rec.req(`/api/queue?doctorId=${sara.id}&date=${today}`)).j;
  let qs = await queue();
  const cur = qs.items.find((i: any) => i.status === 'in_consultation');
  if (cur) ok((await rec.req(`/api/appointments/${cur.id}/action`, { action: 'end' })).status === 200, `ended consultation ${cur.ticket}`);
  qs = await queue();
  const nextW = qs.items.filter((i: any) => ['booked', 'checked_in'].includes(i.status)).sort((a: any, b: any) => a.ahead - b.ahead)[0];
  const before = (await track(token)).queue.ahead;
  const r0 = refreshes;
  ok((await rec.req(`/api/appointments/${nextW.id}/action`, { action: 'start' })).status === 200, `Start Visit → ${nextW.ticket}`);
  await sleep(600);
  const after = (await track(token)).queue.ahead;
  ok(after === before - 1, `patients ahead decreased ${before} → ${after}`);
  ok(refreshes > r0, 'SSE pushed refresh to patient without polling');
  ok((await track(token)).queue.nowServing === nextW.ticket, 'patient sees "now serving" ticket');
  const second = await rec.req(`/api/appointments/${qs.items.find((i: any) => ['booked', 'checked_in'].includes(i.status) && i.id !== nextW.id).id}/action`, { action: 'start' });
  ok(second.status === 409, 'cannot start a second consultation while doctor is busy');

  console.log('\n[5] Smart delay management');
  const t0 = (await track(token)).queue.estimatedTime;
  ok((await doc.req(`/api/doctors/${sara.id}`, { avg: 45 }, 'PATCH')).status === 200, 'doctor sets avg consultation to 45 min (consultations run long)');
  await sleep(500);
  const v2 = await track(token);
  const mins = (h: string) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3));
  ok(mins(v2.queue.estimatedTime) !== mins(t0), `estimate recalculated ${t0} → ${v2.queue.estimatedTime}`);
  ok(v2.queue.delayMin >= 10, `delay shown: +${v2.queue.delayMin} min; original booked time kept: ${v2.appointment.time}`);
  ok(v2.appointment.time === slot.time, 'original booking time unchanged');
  ok((await notes(token)).includes('delay'), 'delay notification sent to patient');
  await doc.req(`/api/doctors/${sara.id}`, { avg: 15 }, 'PATCH');

  console.log('\n[6] Upcoming-turn notification (configurable threshold)');
  for (let i = 0; i < 20; i++) {
    const t = await track(token); if (t.queue.ahead <= 1) break;
    qs = await queue(); const c = qs.items.find((x: any) => x.status === 'in_consultation'); if (c) await doc.req(`/api/appointments/${c.id}/action`, { action: 'end' });
    qs = await queue(); const n = qs.items.filter((x: any) => ['booked', 'checked_in'].includes(x.status)).sort((a: any, b: any) => a.ahead - b.ahead)[0];
    if (n.id === (await q('select id from appointments where token=$1', [token]))[0].id) break;
    await rec.req(`/api/appointments/${n.id}/action`, { action: 'start' });
  }
  const v3 = await track(token);
  ok(v3.queue.ahead === 1, 'exactly one patient ahead');
  ok((await notes(token)).includes('upcoming'), '"Your turn is approaching" notification sent');
  const cnt = async () => (await notes(token)).filter((k) => k === 'upcoming').length;
  ok((await cnt()) === 1, 'upcoming notification sent only once');
  // threshold is configurable
  ok((await rec.req('/api/clinic', { settings: { notify_ahead_threshold: 3 } }, 'PATCH')).status === 200, 'clinic changes notification threshold to 3');
  await rec.req('/api/clinic', { settings: { notify_ahead_threshold: 1 } }, 'PATCH');

  console.log('\n[7] Doctor/receptionist permissions');
  ok((await doc.req(`/api/appointments/${nextW.id}/action`, { action: 'cancel' })).status === 403, 'doctor cannot cancel appointments');
  ok((await doc.req('/api/appointments', { fullName: 'X Y', phone: '01000000000', date: today, time: '10:00', doctorId: sara.id, visitType: 'consultation', channel: 'link' })).status === 403, 'doctor cannot create bookings');

  console.log('\n[8] Your turn → complete');
  qs = await queue(); const c2 = qs.items.find((x: any) => x.status === 'in_consultation'); if (c2) await doc.req(`/api/appointments/${c2.id}/action`, { action: 'end' });
  const me = (await q('select id from appointments where token=$1', [token]))[0].id;
  ok((await doc.req(`/api/appointments/${me}/action`, { action: 'start' })).status === 200, 'doctor starts consultation for test patient');
  await sleep(300);
  const v4 = await track(token);
  ok(v4.appointment.status === 'in_consultation' && (await notes(token)).includes('your_turn'), 'patient status "in consultation" + "your turn" notification');
  ok((await doc.req(`/api/appointments/${me}/action`, { action: 'end' })).status === 200, 'doctor ends consultation');
  const v5 = await track(token);
  ok(v5.appointment.status === 'completed' && (await notes(token)).includes('completed'), 'appointment completed, patient notified');
  ac.abort();

  console.log('\n[9] Other receptionist actions');
  let day = today, s2: any[] = [];
  for (let i = 1; i < 10 && s2.length < 8; i++) { day = new Date(Date.now() + i * 86400000).toISOString().slice(0, 10); s2 = (await rec.req(`/api/slots?doctorId=${sara.id}&date=${day}`)).j.slots.filter((s: any) => s.available); }
  const mk = async (n: string, ph: string, i: number) => (await rec.req('/api/appointments', { fullName: n, phone: ph, date: day, time: s2[i].time, doctorId: sara.id, visitType: 'follow_up', channel: 'telegram' })).j;
  const a1 = await mk('Cancel Me', '01012345671', s2.length - 1), a2 = await mk('No Show', '01012345672', s2.length - 2), a3 = await mk('Skip Me', '01012345673', s2.length - 3), a4 = await mk('Move Me', '01012345674', s2.length - 4);
  ok((await rec.req(`/api/appointments/${a1.id}/action`, { action: 'cancel' })).status === 200 && (await track(a1.token)).appointment.status === 'cancelled', 'cancel → patient sees cancelled');
  ok((await rec.req(`/api/appointments/${a2.id}/action`, { action: 'no_show' })).status === 200, 'mark no-show');
  ok((await rec.req(`/api/appointments/${a3.id}/action`, { action: 'check_in' })).status === 200 && (await rec.req(`/api/appointments/${a3.id}/action`, { action: 'skip' })).status === 200 && (await rec.req(`/api/appointments/${a3.id}/action`, { action: 'recall' })).status === 200, 'check-in → skip → recall');
  const rs = await rec.req(`/api/appointments/${a4.id}/action`, { action: 'reschedule', date: day, time: s2[0].time }); const t4 = await track(a4.token);
  ok(rs.status === 200 && t4.appointment.time === s2[0].time && (await rec.req(`/api/appointments/${a4.id}/share`)).j.token === a4.token, 'reschedule keeps the same private link, new time + ticket');
  ok((await rec.req(`/api/appointments/${a1.id}/action`, { action: 'start' })).status === 409, 'illegal transition rejected');

  console.log('\n[10] Multi-clinic isolation');
  const other = await new Client().login('reception@alnoor.demo', 'Demo@123');
  const list = await other.req(`/api/appointments?date=${today}`);
  ok(list.j.every((a: any) => !['Ahmed', 'Sara M', 'Omar'].some((n) => a.patient.includes(n))) && list.j.length > 0, "clinic B only sees its own appointments");
  ok((await other.req(`/api/appointments/${me}/action`, { action: 'cancel' })).status === 404, "clinic B cannot act on clinic A's appointment");
  ok((await other.req(`/api/queue?doctorId=${sara.id}&date=${today}`)).status === 404, "clinic B cannot read clinic A's doctor queue");
  ok((await other.req(`/api/appointments/${me}/share`)).status === 404, "clinic B cannot get clinic A's tracking link");
  ok((await other.req('/api/patients')).j.every((p: any) => !p.fullName.includes('Ahmed')), 'patient directories are separate');
  ok((await other.req(`/api/doctors/${sara.id}`, { avg: 5 }, 'PATCH')).status === 404, "clinic B cannot edit clinic A's doctor");
  ok((await other.req('/api/admin/clinics')).status === 403, 'receptionist cannot access super admin API');
  ok((await new Client().req('/api/appointments?date=' + today)).status === 401, 'unauthenticated API access rejected');

  console.log('\n[11] Super admin');
  const adm = await new Client().login('admin@smartclinic.app', 'Admin@123');
  const cls = await adm.req('/api/admin/clinics'); ok(cls.j.length >= 2, 'lists all clinics');
  const slug = 'e2e-' + Date.now().toString(36);
  const nc = await adm.req('/api/admin/clinics', { name: 'E2E Clinic', slug, plan: 'starter', ownerName: 'Owner', ownerEmail: slug + '@e2e.test', ownerPassword: 'Passw0rd!x', language: 'en' });
  ok(nc.status === 200, 'creates a new clinic with receptionist account');
  const newRec = await new Client().login(slug + '@e2e.test', 'Passw0rd!x'); ok((await newRec.req('/api/appointments?date=' + today)).j.length === 0, 'new clinic starts empty (isolated)');
  await adm.req(`/api/admin/clinics/${nc.j.id}`, { status: 'suspended' }, 'PATCH');
  ok((await newRec.req('/api/clinic')).status === 401, 'suspended clinic loses access immediately');
  ok((await new Client().req('/api/auth/login', { email: slug + '@e2e.test', password: 'Passw0rd!x' })).status === 401, 'suspended clinic cannot log in');
  const al = (await q('select count(*)::int n from audit_logs where clinic_id is not null'))[0].n; ok(al > 5, `audit log recorded actions (${al} entries)`);

  console.log(`\n${fail ? '✗' : '✓'} ${pass} passed, ${fail} failed`);
  await pool.end(); process.exit(fail ? 1 : 0);
}
main().catch(async (e) => { console.error(e); await pool.end(); process.exit(1); });
