import { z } from 'zod';
import { route, STAFF } from '@/lib/api';
import { q, q1 } from '@/lib/db';
import { audit, getClinic, HttpError } from '@/lib/service';
import { listPrescriptions } from '@/lib/records';
import { normalizePhone } from '@/lib/messages';

export const GET = route<{ id: string }>(STAFF, async ({ user, params }) => {
  const p = await q1<any>(`select id, full_name "fullName", phone, channel, notes, gender, to_char(birth_date,'YYYY-MM-DD') "birthDate", allergies, chronic_conditions chronic, blood_type "bloodType" from patients where id=$1 and clinic_id=$2`, [params.id, user.clinicId]);
  if (!p) throw new HttpError(404, 'Patient not found');
  const visits = await q(`select a.id, a.ticket_code ticket, a.status, a.visit_type "visitType", to_char(a.appt_date,'YYYY-MM-DD') date, to_char(a.appt_time,'HH24:MI') time, d.name doctor
    from appointments a join doctors d on d.id=a.doctor_id where a.patient_id=$1 and a.clinic_id=$2 order by a.appt_date desc, a.appt_time desc limit 100`, [params.id, user.clinicId]);
  // medical content is for doctors only; reception sees demographics + visits
  if (user.role === 'doctor') { await audit(user, 'patient.view', 'patient', params.id); return { patient: p, visits, prescriptions: await listPrescriptions(user.clinicId!, params.id) }; }
  return { patient: { ...p, allergies: undefined, chronic: undefined, bloodType: undefined }, visits };
});
export const PATCH = route<{ id: string }>(STAFF, async ({ user, req, params }) => {
  const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
  const b = z.object({ fullName: z.string().trim().min(2).max(80), phone: z.string().min(7).max(20), notes: z.string().max(2000).nullable(), channel: z.enum(['whatsapp', 'telegram', 'link']), birthDate: date.nullable(), gender: z.enum(['male', 'female']).nullable(),
    allergies: z.string().max(500).nullable(), chronic: z.string().max(500).nullable(), bloodType: z.string().max(5).nullable() }).partial().parse(await req.json());
  if (user.role !== 'doctor') { delete b.allergies; delete b.chronic; delete b.bloodType; }
  let phone: string | undefined;
  if (b.phone) {
    const cc = (await getClinic(user.clinicId!)).settings.country_code;
    phone = normalizePhone(b.phone, cc); if (phone.length < 8) throw new HttpError(422, 'Invalid phone number');
    const cur = await q1<any>('select phone from patients where id=$1 and clinic_id=$2', [params.id, user.clinicId]);
    if (cur && normalizePhone(cur.phone, cc) === phone) phone = undefined; // same number written in another format → not a change
    else {
      const other = await q1<any>('select full_name from patients where clinic_id=$1 and phone=$2 and id<>$3', [user.clinicId, phone, params.id]);
      if (other) throw new HttpError(409, `This phone number already belongs to another patient: ${other.full_name}`);
    }
  }
  const has = (k: string) => k in b;
  const r = await q(`update patients set full_name=coalesce($3,full_name), phone=coalesce($4,phone), notes=case when $5 then $6 else notes end, channel=coalesce($7,channel),
      birth_date=case when $8 then $9::date else birth_date end, gender=case when $10 then $11 else gender end,
      allergies=case when $12 then $13 else allergies end, chronic_conditions=case when $14 then $15 else chronic_conditions end, blood_type=case when $16 then $17 else blood_type end
      where id=$1 and clinic_id=$2 returning id`,
    [params.id, user.clinicId, b.fullName, phone, has('notes'), b.notes ?? null, b.channel, has('birthDate'), b.birthDate ?? null, has('gender'), b.gender ?? null, has('allergies'), b.allergies ?? null, has('chronic'), b.chronic ?? null, has('bloodType'), b.bloodType ?? null]);
  if (!r.length) throw new HttpError(404, 'Patient not found');
  await audit(user, 'patient.update', 'patient', params.id, { fields: Object.keys(b) });
  return { ok: true };
});
