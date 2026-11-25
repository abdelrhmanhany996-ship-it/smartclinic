import crypto from 'crypto';
import type { PoolClient } from 'pg';
import { q, q1, tx } from './db';
import { emit } from './events';
import { pushToAppointment } from './push';
import { computeQueue, DEFAULT_SETTINGS, durationFor, LIVE, QItem, Status } from './queue';
import { addDays, clinicNow, fromMin, isDate, toMin } from './time';
import { effectiveWindow } from './schedule';
import { notifText } from './notiftext';
import { confirmationMessage, normalizePhone, telegramUrl, whatsappUrl, Lang } from './messages';
import type { Session } from './auth';
import { patientRecord } from './records';

export class HttpError extends Error { constructor(public status: number, msg: string) { super(msg); } }
const bad = (m: string, s = 400) => new HttpError(s, m);

export async function getClinic(clinicId: string) {
  const c = await q1<any>('select * from clinics where id=$1', [clinicId]);
  if (!c) throw bad('Clinic not found', 404);
  c.settings = { ...DEFAULT_SETTINGS, ...(c.settings || {}) };
  const stored: any[] = Array.isArray(c.settings.visit_types) ? c.settings.visit_types : [];
  c.settings.visit_types = [...DEFAULT_SETTINGS.visit_types, ...stored.filter((v) => !DEFAULT_SETTINGS.visit_types.some((d) => d.key === v.key))];
  return c;
}
export async function audit(s: Pick<Session, 'uid'> & { clinicId: string | null }, action: string, entity: string, entityId: string | null, meta: object = {}, c?: PoolClient) {
  await (c ?? { query: (a: string, b: any[]) => q(a, b) } as any).query(
    'insert into audit_logs(clinic_id,user_id,action,entity,entity_id,meta) values($1,$2,$3,$4,$5,$6)', [s.clinicId, s.uid, action, entity, entityId, meta]);
}
const newToken = () => crypto.randomBytes(18).toString('base64url');
export const trackLink = (token: string) => `${(process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '')}/t/${token}`;

/* ---------- slots ---------- */
export async function listSlots(clinicId: string, doctorId: string, date: string) {
  if (!isDate(date)) throw bad('Invalid date');
  const clinic = await getClinic(clinicId);
  const d = await q1<any>('select * from doctors where id=$1 and clinic_id=$2 and active', [doctorId, clinicId]);
  if (!d) throw bad('Doctor not found', 404);
  const win = effectiveWindow(clinic, d, date);
  if (!win.open) return { slots: [], dayOff: true, reason: win.reason, window: null as null | { from: string; to: string } };
  const booked = await q<any>(
    `select to_char(appt_time,'HH24:MI') t, count(*)::int n from appointments
      where doctor_id=$1 and appt_date=$2 and status in ('booked','checked_in','in_consultation','completed','skipped') group by 1`, [doctorId, date]);
  const cap = clinic.settings.slot_capacity ?? 1;
  const now = clinicNow(clinic.timezone);
  const step = d.avg_duration_min;
  const slots: { time: string; available: boolean; reason?: string }[] = [];
  const bs = d.break_start ? toMin(d.break_start) : null, be = d.break_end ? toMin(d.break_end) : null;
  for (let m = win.start; m + step <= win.end; m += step) {
    const time = fromMin(m);
    const n = booked.find((b) => b.t === time)?.n ?? 0;
    let reason: string | undefined;
    if (bs != null && be != null && m < be && m + step > bs) reason = 'break';
    else if (date < now.date || (date === now.date && m < now.min - 5)) reason = 'past';
    else if (n >= cap) reason = 'booked';
    slots.push({ time, available: !reason, reason });
  }
  return { slots, dayOff: false, reason: undefined as string | undefined, window: { from: fromMin(win.start), to: fromMin(win.end) } as null | { from: string; to: string } };
}

/** Free-typed time: inside working hours, not in the break, not in the past, and the exact minute not already full. */
async function assertTimeFree(clinic: any, doc: any, date: string, time: string, excludeId: string) {
  if (!isDate(date) || !/^\d{2}:\d{2}$/.test(time)) throw bad('Invalid date/time');
  const m = toMin(time);
  const win = effectiveWindow(clinic, doc, date);
  if (!win.open) throw bad(win.reason === 'holiday' ? 'The clinic is closed on this date (holiday)' : win.reason === 'clinic_closed' ? 'The clinic is closed on this day' : 'Doctor is off on this day', 409);
  if (m < win.start || m >= win.end) throw bad(`Outside working hours (${fromMin(win.start)}–${fromMin(win.end)})`, 409);
  if (doc.break_start && doc.break_end && m >= toMin(doc.break_start) && m < toMin(doc.break_end)) throw bad('Doctor is on break at this time', 409);
  const now = clinicNow(clinic.timezone);
  if (date < now.date || (date === now.date && m < now.min - 5)) throw bad('This time has passed', 409);
  const n = await q1<any>(`select count(*)::int n from appointments where doctor_id=$1 and appt_date=$2 and appt_time=$3 and id<>$4 and status in ('booked','checked_in','in_consultation','completed','skipped')`, [doc.id, date, time, excludeId]);
  if (n.n >= (clinic.settings.slot_capacity ?? 1)) throw bad('This time is already booked', 409);
}

/** Add-patient flow: book the visit; when no time is given, take the first free slot of that day. */
export async function registerVisit(s: Session, input: Omit<NewAppt, 'time'> & { time?: string | null }) {
  let time = input.time;
  if (!time) {
    const { slots } = await listSlots(s.clinicId!, input.doctorId, input.date);
    time = slots.find((x) => x.available)?.time;
    if (!time) throw bad('No free time on this date. Pick another date.', 409);
  }
  return createAppointment(s, { ...input, time });
}

/* ---------- queue snapshot ---------- */
export async function queueSnapshot(clinicId: string, doctorId: string, date: string) {
  const clinic = await getClinic(clinicId);
  const doc = await q1<any>('select * from doctors where id=$1 and clinic_id=$2', [doctorId, clinicId]);
  if (!doc) throw bad('Doctor not found', 404);
  const rows = await q<any>(
    `select a.*, to_char(a.appt_time,'HH24:MI') t, p.full_name, p.phone from appointments a join patients p on p.id=a.patient_id
      where a.clinic_id=$1 and a.doctor_id=$2 and a.appt_date=$3 order by a.sort_key, a.ticket_seq`, [clinicId, doctorId, date]);
  const now = clinicNow(clinic.timezone);
  const avg = await effectiveAvg(doc, date);
  const vt = clinic.settings.visit_types;
  const items: QItem[] = rows.map((r) => ({ id: r.id, status: r.status, sortKey: r.sort_key, scheduledMin: toMin(r.t), durationMin: durationFor(avg, r.visit_type, vt), startedAtMs: r.started_at ? new Date(r.started_at).getTime() : null }));
  const live = date === now.date;
  const est = live ? computeQueue(items, now.min, now.ms) : new Map();
  const list = rows.map((r) => {
    const e = est.get(r.id);
    const scheduledMin = toMin(r.t);
    return {
      id: r.id, ticket: r.ticket_code, patient: r.full_name, phone: r.phone, patientId: r.patient_id, time: r.t, status: r.status as Status,
      visitType: r.visit_type, reason: r.reason, channel: r.channel, token: r.token, checkedInAt: r.checked_in_at, startedAt: r.started_at, endedAt: r.ended_at,
      ahead: e?.ahead ?? null, estTime: live && LIVE.includes(r.status) ? fromMin(e?.estStartMin ?? scheduledMin) : null, estMin: live && LIVE.includes(r.status) ? (e?.estStartMin ?? scheduledMin) : null, delayMin: e?.delayMin ?? 0,
      durationMin: durationFor(avg, r.visit_type, vt),
    };
  });
  const delay = Math.max(0, ...list.map((l) => l.delayMin));
  return { doctor: { id: doc.id, name: doc.name, code: doc.code, avgDuration: doc.avg_duration_min, effectiveAvg: avg }, date, now: fromMin(now.min), delayMin: delay, items: list, serverTime: Date.now() };
}

/** Blend configured average with today's actual average (needs >=3 completed visits). */
async function effectiveAvg(doc: any, date: string) {
  const r = await q1<any>(
    `select count(*)::int n, avg(extract(epoch from (ended_at-started_at))/60) m from appointments
      where doctor_id=$1 and appt_date=$2 and status='completed' and started_at is not null and ended_at > started_at`, [doc.id, date]);
  if (r && r.n >= 3 && r.m) return Math.max(3, Math.round((doc.avg_duration_min + Number(r.m)) / 2));
  return doc.avg_duration_min;
}

/* ---------- notify engine ---------- */
async function notifyPatient(clinic: any, a: any, kind: string, data: Record<string, any>) {
  const lang: Lang = clinic.settings.language === 'ar' ? 'ar' : 'en';
  const en = notifText(kind, data, 'en');
  await q('insert into notifications(clinic_id,appointment_id,audience,kind,title,body,data) values($1,$2,$3,$4,$5,$6,$7)', [clinic.id, a.id, 'patient', kind, en.title, en.body, data]);
  const txt = notifText(kind, data, lang);
  pushToAppointment(a.id, { ...txt, url: `/t/${a.token}`, tag: kind }).catch(() => {});
}
export async function notifyStaff(clinicId: string, kind: string, data: Record<string, any>, appointmentId: string | null = null) {
  const en = notifText(kind, data, 'en');
  await q('insert into notifications(clinic_id,appointment_id,audience,kind,title,body,data) values($1,$2,$3,$4,$5,$6,$7)', [clinicId, appointmentId, 'staff', kind, en.title, en.body, data]);
}

/** Recalculate the doctor's queue, fire due notifications, broadcast realtime refresh. */
export async function afterChange(clinicId: string, doctorId: string, dates: string[], cause: string) {
  const clinic = await getClinic(clinicId);
  const today = clinicNow(clinic.timezone).date;
  const th = Number(clinic.settings.notify_ahead_threshold ?? 1);
  const dth = Number(clinic.settings.delay_notify_minutes ?? 10);
  let maxDelay = 0; const touched: string[] = [];
  for (const date of [...new Set(dates)]) {
    if (date !== today) continue;
    const snap = await queueSnapshot(clinicId, doctorId, date);
    for (const it of snap.items) {
      if (!LIVE.includes(it.status)) continue;
      const row = await q1<any>('select * from appointments where id=$1', [it.id]);
      const fresh = { ...row, token: it.token };
      if (it.status === 'in_consultation') {
        if (!row.notified_turn) { await q('update appointments set notified_turn=true, notified_upcoming=true where id=$1', [it.id]); await notifyPatient(clinic, fresh, 'your_turn', { ticket: it.ticket }); touched.push(it.id); }
        continue;
      }
      maxDelay = Math.max(maxDelay, it.delayMin);
      const est = it.estMin!; // numeric minutes: estimates past midnight must not wrap around
      const prev = row.notified_est ?? toMin(it.time);
      if (Math.abs(est - prev) >= dth) {
        const later = est > prev;
        await q('update appointments set notified_est=$2 where id=$1', [it.id, est]);
        await notifyPatient(clinic, fresh, later ? 'delay' : 'earlier', { ticket: it.ticket, time: it.estTime, delay: it.delayMin, original: it.time });
        touched.push(it.id);
      }
      if ((it.ahead ?? 99) <= th && !row.notified_upcoming) {
        await q('update appointments set notified_upcoming=true where id=$1', [it.id]);
        await notifyPatient(clinic, fresh, 'upcoming', { ticket: it.ticket, ahead: it.ahead, time: it.estTime });
        touched.push(it.id);
      }
    }
  }
  await emit({ clinicId, doctorId, date: dates[0], type: cause, appointmentIds: touched });
  return maxDelay;
}

/* ---------- booking ---------- */
export interface NewAppt { fullName: string; phone: string; date: string; time: string; doctorId: string; visitType: string; channel: 'whatsapp' | 'telegram' | 'link'; patientId?: string; birthDate?: string | null; gender?: 'male' | 'female' | null; reason?: string | null; allergies?: string | null; chronic?: string | null; bloodType?: string | null; notes?: string | null }

export async function createAppointment(s: Session, input: NewAppt) {
  const clinicId = s.clinicId!;
  const clinic = await getClinic(clinicId);
  const doc = await q1<any>('select * from doctors where id=$1 and clinic_id=$2 and active', [input.doctorId, clinicId]);
  if (!doc) throw bad('Doctor not found', 404);
  if (!isDate(input.date) || !/^\d{2}:\d{2}$/.test(input.time)) throw bad('Invalid date/time');
  const phone = normalizePhone(input.phone, clinic.settings.country_code);
  if (phone.length < 8 || phone.length > 15) throw bad('Invalid phone number');
  // any minute is allowed (typed time) as long as it is inside working hours, not on break, not past, and not already full
  await assertTimeFree(clinic, doc, input.date, input.time, '00000000-0000-0000-0000-000000000000');

  const appt = await tx(async (c) => {
    await c.query('select pg_advisory_xact_lock(hashtext($1))', [input.doctorId + input.date]);
    const clash = await c.query(`select count(*)::int n from appointments where doctor_id=$1 and appt_date=$2 and appt_time=$3 and status in ('booked','checked_in','in_consultation','completed','skipped')`, [input.doctorId, input.date, input.time]);
    if (clash.rows[0].n >= (clinic.settings.slot_capacity ?? 1)) throw bad('This slot is already booked', 409);
    const p = await c.query(
      `insert into patients(clinic_id,full_name,phone,channel,birth_date,gender,allergies,chronic_conditions,blood_type,notes) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       on conflict (clinic_id,phone) do update set full_name=excluded.full_name, channel=excluded.channel,
         birth_date=coalesce(excluded.birth_date, patients.birth_date), gender=coalesce(excluded.gender, patients.gender),
         allergies=coalesce(excluded.allergies, patients.allergies), chronic_conditions=coalesce(excluded.chronic_conditions, patients.chronic_conditions),
         blood_type=coalesce(excluded.blood_type, patients.blood_type), notes=coalesce(excluded.notes, patients.notes) returning id`,
      [clinicId, input.fullName.trim(), phone, input.channel, input.birthDate || null, input.gender || null, input.allergies || null, input.chronic || null, input.bloodType || null, input.notes || null]);
    const seq = (await c.query('select coalesce(max(ticket_seq),100)+1 n from appointments where doctor_id=$1 and appt_date=$2', [input.doctorId, input.date])).rows[0].n;
    const sortKey = new Date(`${input.date}T${input.time}:00Z`).getTime() / 60000 + seq / 1000;
    const r = await c.query(
      `insert into appointments(clinic_id,doctor_id,patient_id,appt_date,appt_time,visit_type,channel,ticket_seq,ticket_code,token,sort_key,notified_est,created_by,reason)
       values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) returning *`,
      [clinicId, input.doctorId, p.rows[0].id, input.date, input.time, input.visitType, input.channel, seq, `${doc.code}-${seq}`, newToken(), sortKey, toMin(input.time), s.uid, input.reason?.trim() || null]);
    await audit(s, 'appointment.create', 'appointment', r.rows[0].id, { ticket: r.rows[0].ticket_code }, c);
    return r.rows[0];
  });
  await notifyPatient(clinic, appt, 'confirmed', { ticket: appt.ticket_code, time: input.time, date: input.date });
  await notifyStaff(clinicId, 'booked', { patient: input.fullName, ticket: appt.ticket_code, time: input.time }, appt.id);
  await afterChange(clinicId, input.doctorId, [input.date], 'booked');
  return appointmentShare(clinicId, appt.id);
}

export async function appointmentShare(clinicId: string, id: string, lang?: Lang) {
  const clinic = await getClinic(clinicId);
  const r = await q1<any>(
    `select a.*, to_char(a.appt_time,'HH24:MI') t, p.full_name, p.phone, d.name dname, d.name_ar dname_ar from appointments a
       join patients p on p.id=a.patient_id join doctors d on d.id=a.doctor_id where a.id=$1 and a.clinic_id=$2`, [id, clinicId]);
  if (!r) throw bad('Appointment not found', 404);
  const l: Lang = lang ?? (clinic.settings.language === 'ar' ? 'ar' : 'en');
  const link = trackLink(r.token);
  const text = confirmationMessage({ clinic: l === 'ar' && clinic.name_ar ? clinic.name_ar : clinic.name, doctor: l === 'ar' && r.dname_ar ? r.dname_ar : r.dname, date: String(r.appt_date), time: r.t, ticket: r.ticket_code, link, patient: r.full_name, lang: l });
  return { id: r.id, patientId: r.patient_id, ticket: r.ticket_code, token: r.token, link, message: text, whatsappUrl: whatsappUrl(r.phone, text), telegramUrl: telegramUrl(link, text), time: r.t, date: r.appt_date, patient: r.full_name, phone: r.phone, doctor: r.dname, lang: l };
}

/* ---------- actions ---------- */
const TRANSITIONS: Record<string, Status[]> = {
  check_in: ['booked', 'skipped'],
  start: ['booked', 'checked_in', 'skipped'],
  end: ['in_consultation'],
  skip: ['booked', 'checked_in'],
  recall: ['skipped'],
  cancel: ['booked', 'checked_in', 'skipped'],
  no_show: ['booked', 'checked_in', 'skipped'],
  reschedule: ['booked', 'checked_in', 'skipped', 'cancelled', 'no_show'],
};
export type Action = keyof typeof TRANSITIONS;

export async function doAction(s: Session, id: string, action: Action, p: { date?: string; time?: string; doctorId?: string } = {}) {
  const clinicId = s.clinicId!;
  const a = await q1<any>(
    `select a.*, to_char(a.appt_time,'HH24:MI') t, to_char(a.appt_date,'YYYY-MM-DD') d, pt.full_name from appointments a join patients pt on pt.id=a.patient_id where a.id=$1 and a.clinic_id=$2`, [id, clinicId]);
  if (!a) throw bad('Appointment not found', 404);
  if (s.role === 'doctor' && !['start', 'end', 'cancel', 'reschedule', 'no_show'].includes(action)) throw bad('Not allowed', 403);
  if (s.role === 'doctor' && a.doctor_id !== s.doctorId) throw bad('Not your patient', 403);
  if (!TRANSITIONS[action]?.includes(a.status)) throw bad(`Cannot ${action.replace('_', ' ')} an appointment that is ${a.status.replace('_', ' ')}`, 409);
  const clinic = await getClinic(clinicId);
  const dates = [a.d];
  let doctorId = a.doctor_id;
  const info = { patient: a.full_name, ticket: a.ticket_code, time: a.t };

  if (action === 'check_in') await q(`update appointments set status='checked_in', checked_in_at=coalesce(checked_in_at, now()) where id=$1`, [id]);
  else if (action === 'start') {
    const busy = await q1<any>(`select ticket_code from appointments where doctor_id=$1 and appt_date=$2 and status='in_consultation'`, [a.doctor_id, a.d]);
    if (busy) throw bad(`Doctor is still with ${busy.ticket_code}. End that visit first.`, 409);
    await q(`update appointments set status='in_consultation', started_at=now(), checked_in_at=coalesce(checked_in_at, now()) where id=$1`, [id]);
  } else if (action === 'end') {
    await q(`update appointments set status='completed', ended_at=now() where id=$1`, [id]);
    await notifyPatient(clinic, a, 'completed', { ticket: a.ticket_code });
    await notifyStaff(clinicId, 'staff_completed', info, id);
  } else if (action === 'skip') {
    await q(`update appointments set status='skipped' where id=$1`, [id]);
    await notifyPatient(clinic, a, 'skipped', { ticket: a.ticket_code });
  } else if (action === 'recall') {
    const mx = await q1<any>(`select coalesce(max(sort_key),0)+0.5 k from appointments where doctor_id=$1 and appt_date=$2 and status in ('booked','checked_in')`, [a.doctor_id, a.d]);
    await q(`update appointments set status='checked_in', checked_in_at=now(), sort_key=$2 where id=$1`, [id, Math.max(Number(mx.k), a.sort_key)]);
  } else if (action === 'cancel') {
    await q(`update appointments set status='cancelled' where id=$1`, [id]);
    await notifyPatient(clinic, a, 'cancelled', { ticket: a.ticket_code });
    await notifyStaff(clinicId, 'staff_cancelled', info, id);
  } else if (action === 'no_show') {
    await q(`update appointments set status='no_show' where id=$1`, [id]);
    await notifyPatient(clinic, a, 'no_show', { ticket: a.ticket_code });
    await notifyStaff(clinicId, 'staff_no_show', info, id);
  } else if (action === 'reschedule') {
    const date = p.date ?? a.d, time = p.time ?? a.t, newDoc = s.role === 'doctor' ? a.doctor_id : p.doctorId ?? a.doctor_id;
    if (!isDate(date) || !/^\d{2}:\d{2}$/.test(time)) throw bad('Invalid date/time');
    const doc = await q1<any>('select * from doctors where id=$1 and clinic_id=$2 and active', [newDoc, clinicId]);
    if (!doc) throw bad('Doctor not found', 404);
    await assertTimeFree(clinic, doc, date, time, id);
    const ticket = await tx(async (c) => {
      await c.query('select pg_advisory_xact_lock(hashtext($1))', [newDoc + date]);
      const seq = (await c.query('select coalesce(max(ticket_seq),100)+1 n from appointments where doctor_id=$1 and appt_date=$2', [newDoc, date])).rows[0].n;
      const code = `${doc.code}-${seq}`;
      const sortKey = new Date(`${date}T${time}:00Z`).getTime() / 60000 + seq / 1000;
      await c.query(`update appointments set doctor_id=$2, appt_date=$3, appt_time=$4, ticket_seq=$5, ticket_code=$6, sort_key=$7, status='booked', checked_in_at=null, started_at=null, ended_at=null, notified_upcoming=false, notified_turn=false, notified_est=$8 where id=$1`,
        [id, newDoc, date, time, seq, code, sortKey, toMin(time)]);
      return code;
    });
    dates.push(date);
    if (newDoc !== a.doctor_id) await afterChange(clinicId, a.doctor_id, [a.d], 'rescheduled');
    doctorId = newDoc;
    await notifyPatient(clinic, a, 'rescheduled', { ticket, date, time });
  }
  await audit(s, `appointment.${action}`, 'appointment', id, { from: a.status, ticket: a.ticket_code, ...p });
  const delay = await afterChange(clinicId, doctorId, dates, action);
  if (['end', 'skip', 'start'].includes(action) && delay >= Number(clinic.settings.delay_notify_minutes ?? 10)) {
    const d = await q1<any>('select name from doctors where id=$1', [doctorId]);
    const recent = await q1<any>(`select 1 from notifications where clinic_id=$1 and audience='staff' and kind='delay_alert' and created_at > now() - interval '20 minutes' and data->>'doctor'=$2`, [clinicId, d.name]);
    if (!recent) await notifyStaff(clinicId, 'delay_alert', { doctor: d.name, delay }, null);
  }
  return { ok: true };
}

/** Edit visit type / details of a live appointment (reception, or the doctor who owns it). */
export async function updateVisitDetails(s: Session, id: string, d: { visitType?: string; reason?: string | null }) {
  const a = await q1<any>(`select a.*, to_char(a.appt_date,'YYYY-MM-DD') dd from appointments a where a.id=$1 and a.clinic_id=$2`, [id, s.clinicId]);
  if (!a) throw bad('Appointment not found', 404);
  if (s.role === 'doctor' && a.doctor_id !== s.doctorId) throw bad('Not your patient', 403);
  if (!['booked', 'checked_in', 'in_consultation', 'skipped'].includes(a.status)) throw bad('This appointment can no longer be edited', 409);
  await q(`update appointments set visit_type=coalesce($2,visit_type), reason=case when $4 then $3 else reason end where id=$1`, [id, d.visitType ?? null, d.reason ?? null, d.reason !== undefined]);
  await audit(s, 'appointment.update', 'appointment', id, { visitType: d.visitType, reason: d.reason !== undefined });
  await afterChange(s.clinicId!, a.doctor_id, [a.dd], 'updated'); // visit type changes the expected duration
  return { ok: true };
}

/* ---------- patient tracking view (privacy-safe) ---------- */
export async function trackView(token: string) {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) throw bad('Not found', 404);
  const a = await q1<any>('select id, clinic_id, doctor_id, patient_id, to_char(appt_date,\'YYYY-MM-DD\') d from appointments where token=$1', [token]);
  if (!a) throw bad('Not found', 404);
  const clinic = await getClinic(a.clinic_id);
  const snap = await queueSnapshot(a.clinic_id, a.doctor_id, a.d);
  const me = snap.items.find((i) => i.id === a.id)!;
  const doc = await q1<any>('select name,name_ar,specialty,specialty_ar from doctors where id=$1', [a.doctor_id]);
  const serving = snap.items.find((i) => i.status === 'in_consultation');
  const notes = await q<any>(`select id,kind,data,created_at,read_at from notifications where appointment_id=$1 and audience='patient' order by id desc limit 50`, [a.id]);
  const live = LIVE.includes(me.status);
  return {
    clinic: { name: clinic.name, nameAr: clinic.name_ar, address: clinic.address, phone: clinic.phone, brandColor: clinic.brand_color, tagline: clinic.tagline, threshold: clinic.settings.notify_ahead_threshold, language: clinic.settings.language },
    appointment: { ticket: me.ticket, patient: me.patient, date: a.d, time: me.time, status: me.status, visitType: me.visitType, reason: (await q1<any>('select reason from appointments where id=$1', [a.id]))?.reason ?? null, doctor: { name: doc.name, nameAr: doc.name_ar, specialty: doc.specialty, specialtyAr: doc.specialty_ar } },
    queue: {
      ahead: live ? me.ahead : null, estimatedTime: me.estTime, now: snap.now, delayMin: me.delayMin, nowServing: serving?.ticket ?? null,
      totalWaiting: snap.items.filter((i) => i.status === 'booked' || i.status === 'checked_in').length, isToday: snap.date === clinicNow(clinic.timezone).date,
    },
    record: await patientRecord(a.clinic_id, a.patient_id, clinicNow(clinic.timezone).date, a.id),
    notifications: notes, serverTime: Date.now(), pushKey: process.env.VAPID_PUBLIC_KEY || null,
  };
}

/* ---------- overview / reports ---------- */
export async function overview(clinicId: string, date?: string) {
  const clinic = await getClinic(clinicId);
  const day = date ?? clinicNow(clinic.timezone).date;
  const c = await q<any>(`select status, count(*)::int n from appointments where clinic_id=$1 and appt_date=$2 group by 1`, [clinicId, day]);
  const n = (s: string[]) => c.filter((x) => s.includes(x.status)).reduce((t, x) => t + x.n, 0);
  const docs = await q<any>('select id,name,name_ar,code,specialty from doctors where clinic_id=$1 and active order by code', [clinicId]);
  const queues = await Promise.all(docs.map(async (d) => { const s = await queueSnapshot(clinicId, d.id, day); return { doctor: d, delayMin: s.delayMin, current: s.items.find((i) => i.status === 'in_consultation') ?? null, next: s.items.find((i) => i.ahead === 0) ?? null, waiting: s.items.filter((i) => ['booked', 'checked_in'].includes(i.status)).length }; }));
  return { date: day, total: n(['booked', 'checked_in', 'in_consultation', 'completed', 'skipped', 'no_show', 'cancelled']) - n(['cancelled']), waiting: n(['booked', 'checked_in', 'skipped']), inConsultation: n(['in_consultation']), completed: n(['completed']), noShow: n(['no_show']), cancelled: n(['cancelled']), queues };
}

export async function reports(clinicId: string, days: number, doctorId?: string | null) {
  const clinic = await getClinic(clinicId);
  const today = clinicNow(clinic.timezone).date;
  const from = addDays(today, -(days - 1));
  const p: any[] = [clinicId, from, today]; let f = '';
  if (doctorId) { p.push(doctorId); f = ' and a.doctor_id=$4'; }
  const base = `from appointments a where a.clinic_id=$1 and a.appt_date between $2 and $3${f}`;
  const [tot] = await q<any>(`select count(*)::int total, count(*) filter (where status='completed')::int completed, count(*) filter (where status='no_show')::int no_show, count(*) filter (where status='cancelled')::int cancelled,
      coalesce(round(avg(extract(epoch from (started_at-checked_in_at))/60) filter (where started_at is not null and checked_in_at is not null and started_at>=checked_in_at)::numeric,1),0)::float avg_wait,
      coalesce(round(avg(extract(epoch from (ended_at-started_at))/60) filter (where ended_at>started_at)::numeric,1),0)::float avg_consult ${base}`, p);
  const daily = await q<any>(`select to_char(appt_date,'YYYY-MM-DD') date, count(*) filter (where status<>'cancelled')::int total, count(*) filter (where status='completed')::int completed, count(*) filter (where status='no_show')::int no_show ${base} group by 1 order by 1`, p);
  const byDoctor = await q<any>(`select d.id, d.name, count(*) filter (where a.status<>'cancelled')::int total, count(*) filter (where a.status='completed')::int completed,
      coalesce(round(avg(extract(epoch from (a.started_at-a.checked_in_at))/60) filter (where a.started_at>=a.checked_in_at)::numeric,1),0)::float avg_wait,
      coalesce(round(avg(extract(epoch from (a.ended_at-a.started_at))/60) filter (where a.ended_at>a.started_at)::numeric,1),0)::float avg_consult
      from appointments a join doctors d on d.id=a.doctor_id where a.clinic_id=$1 and a.appt_date between $2 and $3${f} group by d.id order by total desc`, p);
  const byHour = await q<any>(`select extract(hour from appt_time)::int as hour, count(*)::int as n ${base} and a.status<>'cancelled' group by 1 order by 1`, p);
  const byType = await q<any>(`select visit_type, count(*)::int as n ${base} and a.status<>'cancelled' group by 1 order by 2 desc`, p);
  return { from, to: today, days, totals: { ...tot, noShowRate: tot.total ? Math.round((tot.no_show / tot.total) * 1000) / 10 : 0 }, daily, byDoctor, byHour, byType };
}
