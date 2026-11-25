import { z } from 'zod';
import { route, STAFF } from '@/lib/api';
import { q, q1 } from '@/lib/db';
import { audit, getClinic, HttpError } from '@/lib/service';
import { normalizePhone } from '@/lib/messages';

export const GET = route(STAFF, async ({ user, req }) => {
  const s = req.nextUrl.searchParams.get('q');
  const p: any[] = [user.clinicId]; let f = '';
  if (s) { p.push(`%${s}%`); f = ' and (p.full_name ilike $2 or p.phone like $2)'; }
  return q(`select p.id, p.full_name "fullName", p.phone, p.channel, p.gender, to_char(p.birth_date,'YYYY-MM-DD') "birthDate", p.allergies, p.created_at "createdAt", count(a.id)::int visits,
      count(a.id) filter (where a.status='completed')::int completed, count(a.id) filter (where a.status='no_show')::int "noShows",
      max(a.appt_date)::text "lastVisit" from patients p left join appointments a on a.patient_id=p.id where p.clinic_id=$1${f}
      group by p.id order by p.full_name limit 300`, p);
});

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const patientSchema = z.object({
  fullName: z.string().trim().min(2).max(80), phone: z.string().min(7).max(20), channel: z.enum(['whatsapp', 'telegram', 'link']).default('whatsapp'),
  birthDate: date.nullish(), gender: z.enum(['male', 'female']).nullish(), allergies: z.string().max(500).nullish(), chronic: z.string().max(500).nullish(), bloodType: z.string().max(5).nullish(), notes: z.string().max(2000).nullish(),
});
export const POST = route(STAFF, async ({ user, req }) => {
  const b = patientSchema.parse(await req.json());
  const clinic = await getClinic(user.clinicId!);
  const phone = normalizePhone(b.phone, clinic.settings.country_code);
  if (phone.length < 8 || phone.length > 15) throw new HttpError(422, 'Invalid phone number');
  if (await q1('select 1 from patients where clinic_id=$1 and phone=$2', [user.clinicId, phone])) throw new HttpError(409, 'A patient with this phone number already exists');
  const r = await q1<any>(`insert into patients(clinic_id,full_name,phone,channel,birth_date,gender,allergies,chronic_conditions,blood_type,notes) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning id`,
    [user.clinicId, b.fullName, phone, b.channel, b.birthDate || null, b.gender || null, b.allergies || null, b.chronic || null, b.bloodType || null, b.notes || null]);
  await audit(user, 'patient.create', 'patient', r.id);
  return { id: r.id };
});
