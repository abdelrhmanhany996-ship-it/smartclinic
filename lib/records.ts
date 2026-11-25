import { q, q1 } from './db';
import { emit } from './events';
import { pushToAppointment } from './push';
import { notifText } from './notiftext';
import { getClinic, audit, HttpError } from './service';
import type { Session } from './auth';
import type { Lang } from './messages';

export interface RxItem { name: string; dose?: string; frequency?: string; duration?: string; notes?: string }
export interface RxInput { appointmentId?: string | null; diagnosis?: string | null; items: RxItem[]; advice?: string | null; followUpDate?: string | null; send: boolean }

const RX_COLS = `p.id, p.patient_id "patientId", p.appointment_id "appointmentId", p.diagnosis, p.items, p.advice, to_char(p.follow_up_date,'YYYY-MM-DD') "followUpDate",
  p.sent_at "sentAt", p.created_at "createdAt", d.name "doctorName", d.name_ar "doctorNameAr", d.specialty, d.specialty_ar "specialtyAr"`;

export async function listPrescriptions(clinicId: string, patientId: string, onlySent = false) {
  return q(`select ${RX_COLS} from prescriptions p join doctors d on d.id=p.doctor_id
    where p.clinic_id=$1 and p.patient_id=$2 ${onlySent ? 'and p.sent_at is not null' : ''} order by p.created_at desc limit 100`, [clinicId, patientId]);
}

export async function createPrescription(s: Session, patientId: string, input: RxInput) {
  if (s.role !== 'doctor' || !s.doctorId) throw new HttpError(403, 'Only doctors can write prescriptions');
  const clinicId = s.clinicId!;
  const patient = await q1<any>('select id, full_name from patients where id=$1 and clinic_id=$2', [patientId, clinicId]);
  if (!patient) throw new HttpError(404, 'Patient not found');
  if (input.appointmentId) {
    const a = await q1('select 1 from appointments where id=$1 and clinic_id=$2 and patient_id=$3', [input.appointmentId, clinicId, patientId]);
    if (!a) throw new HttpError(404, 'Appointment not found');
  }
  const items = input.items.filter((i) => i.name?.trim());
  if (!items.length && !input.diagnosis?.trim() && !input.advice?.trim()) throw new HttpError(422, 'Prescription is empty');
  const r = await q1<any>(
    `insert into prescriptions(clinic_id,patient_id,doctor_id,appointment_id,diagnosis,items,advice,follow_up_date,sent_at)
     values($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id`,
    [clinicId, patientId, s.doctorId, input.appointmentId ?? null, input.diagnosis || null, JSON.stringify(items), input.advice || null, input.followUpDate || null, input.send ? new Date() : null]);
  await audit(s, 'prescription.create', 'prescription', r.id, { patientId, sent: input.send, items: items.length });
  if (input.send) await notifyPrescription(clinicId, patientId, s.doctorId, input.appointmentId ?? null, r.id);
  return { id: r.id };
}

/** Tell the patient's tracking app: in-app notification + push to every device linked to any of their appointments. */
export async function sendPrescription(s: Session, id: string) {
  const rx = await q1<any>('select id, patient_id, doctor_id, appointment_id from prescriptions where id=$1 and clinic_id=$2', [id, s.clinicId]);
  if (!rx) throw new HttpError(404, 'Prescription not found');
  await q('update prescriptions set sent_at=now() where id=$1', [id]);
  await audit(s, 'prescription.send', 'prescription', id);
  await notifyPrescription(s.clinicId!, rx.patient_id, rx.doctor_id, rx.appointment_id, id);
}

async function notifyPrescription(clinicId: string, patientId: string, doctorId: string, appointmentId: string | null, rxId: string) {
  const clinic = await getClinic(clinicId);
  const lang: Lang = clinic.settings.language === 'ar' ? 'ar' : 'en';
  const doc = await q1<any>('select name from doctors where id=$1', [doctorId]);
  const appts = await q<any>('select id, token from appointments where patient_id=$1 and clinic_id=$2 order by appt_date desc, appt_time desc limit 20', [patientId, clinicId]);
  const target = appts.find((a) => a.id === appointmentId) ?? appts[0];
  const data = { doctor: doc?.name, rxId };
  if (target) {
    const en = notifText('prescription', data, 'en');
    await q('insert into notifications(clinic_id,appointment_id,audience,kind,title,body,data) values($1,$2,$3,$4,$5,$6,$7)', [clinicId, target.id, 'patient', 'prescription', en.title, en.body, data]);
  }
  const txt = notifText('prescription', data, lang);
  await Promise.all(appts.map((a) => pushToAppointment(a.id, { ...txt, url: `/t/${a.token}`, tag: 'prescription' }).catch(() => {})));
  await emit({ clinicId, type: 'prescription' }); // content-free refresh ping (no doctorId → every open tracker of this clinic refetches)
}

/** Everything the patient may see about themselves, resolved from any of their private links. */
export async function patientRecord(clinicId: string, patientId: string, today: string, currentAppointmentId: string) {
  const prescriptions = await listPrescriptions(clinicId, patientId, true);
  const appts = await q<any>(
    `select a.id, a.ticket_code ticket, a.status, a.visit_type "visitType", to_char(a.appt_date,'YYYY-MM-DD') date, to_char(a.appt_time,'HH24:MI') time, a.token, d.name "doctorName", d.name_ar "doctorNameAr"
       from appointments a join doctors d on d.id=a.doctor_id where a.clinic_id=$1 and a.patient_id=$2 order by a.appt_date desc, a.appt_time desc limit 80`, [clinicId, patientId]);
  const live = ['booked', 'checked_in', 'in_consultation', 'skipped'];
  const upcoming = appts.filter((a) => a.date >= today && live.includes(a.status)).reverse().map((a) => ({ ...a, current: a.id === currentAppointmentId }));
  const past = appts.filter((a) => !(a.date >= today && live.includes(a.status))).map((a) => ({ ...a, token: undefined }));
  const followUps = prescriptions.filter((r: any) => r.followUpDate && r.followUpDate >= today).map((r: any) => ({ date: r.followUpDate, doctorName: r.doctorName, doctorNameAr: r.doctorNameAr, rxId: r.id })).reverse();
  const profile = await q1<any>(`select full_name "fullName", to_char(birth_date,'YYYY-MM-DD') "birthDate", gender, allergies, chronic_conditions "chronic", blood_type "bloodType" from patients where id=$1`, [patientId]);
  return { profile, prescriptions, upcoming, past, followUps };
}
