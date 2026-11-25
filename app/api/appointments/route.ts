import { z } from 'zod';
import { route, STAFF } from '@/lib/api';
import { HttpError, registerVisit } from '@/lib/service';
import { q } from '@/lib/db';

export const GET = route(STAFF, async ({ user, req }) => {
  const u = req.nextUrl.searchParams;
  const from = u.get('from') ?? u.get('date'), to = u.get('to') ?? from;
  const p: any[] = [user.clinicId, from, to]; let f = '';
  const doctor = user.role === 'doctor' ? user.doctorId : u.get('doctorId');
  if (doctor) { p.push(doctor); f += ` and a.doctor_id=$${p.length}`; }
  if (u.get('status')) { p.push(u.get('status')); f += ` and a.status=$${p.length}`; }
  if (u.get('q')) { p.push(`%${u.get('q')}%`); f += ` and (pt.full_name ilike $${p.length} or pt.phone like $${p.length} or a.ticket_code ilike $${p.length})`; }
  return q(`select a.id, a.ticket_code ticket, a.status, a.visit_type "visitType", to_char(a.appt_date,'YYYY-MM-DD') date, to_char(a.appt_time,'HH24:MI') time, a.doctor_id "doctorId", d.name doctor, d.code,
      pt.full_name patient, pt.phone, pt.id "patientId", a.token, a.channel from appointments a join patients pt on pt.id=a.patient_id join doctors d on d.id=a.doctor_id
      where a.clinic_id=$1 and a.appt_date between $2 and $3${f} order by a.appt_date, a.appt_time, a.ticket_seq limit 500`, p);
});
export const POST = route(STAFF, async ({ user, req }) => {
  const b = z.object({ fullName: z.string().trim().min(2).max(80), phone: z.string().min(7).max(20), date: z.string(), time: z.string().nullish(), doctorId: z.string().uuid(), visitType: z.string().min(1).max(30),
    channel: z.enum(['whatsapp', 'telegram', 'link']), birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish(), gender: z.enum(['male', 'female']).nullish(), reason: z.string().max(1000).nullish(),
    allergies: z.string().max(500).nullish(), chronic: z.string().max(500).nullish(), bloodType: z.string().max(5).nullish(), notes: z.string().max(2000).nullish() }).parse(await req.json());
  if (user.role !== 'doctor') { b.allergies = b.chronic = b.bloodType = null; } // medical fields are doctor-only
  if (user.role === 'doctor' && b.doctorId !== user.doctorId) throw new HttpError(403, 'Doctors can only book into their own queue');
  return registerVisit(user, b);
});
