import { z } from 'zod';
import { route, RECEPTION } from '@/lib/api';
import { q, q1 } from '@/lib/db';
import { audit, HttpError } from '@/lib/service';
export const GET = route<{ id: string }>(RECEPTION, async ({ user, params }) => {
  const p = await q1('select id, full_name "fullName", phone, channel, notes from patients where id=$1 and clinic_id=$2', [params.id, user.clinicId]);
  if (!p) throw new HttpError(404, 'Patient not found');
  const visits = await q(`select a.id, a.ticket_code ticket, a.status, a.visit_type "visitType", to_char(a.appt_date,'YYYY-MM-DD') date, to_char(a.appt_time,'HH24:MI') time, d.name doctor
    from appointments a join doctors d on d.id=a.doctor_id where a.patient_id=$1 and a.clinic_id=$2 order by a.appt_date desc, a.appt_time desc limit 50`, [params.id, user.clinicId]);
  return { patient: p, visits };
});
export const PATCH = route<{ id: string }>(RECEPTION, async ({ user, req, params }) => {
  const b = z.object({ fullName: z.string().min(2).max(80), notes: z.string().max(1000).nullable(), channel: z.enum(['whatsapp', 'telegram', 'link']) }).partial().parse(await req.json());
  await q('update patients set full_name=coalesce($3,full_name), notes=case when $5 then $4 else notes end, channel=coalesce($6,channel) where id=$1 and clinic_id=$2', [params.id, user.clinicId, b.fullName, b.notes ?? null, 'notes' in b, b.channel]);
  await audit(user, 'patient.update', 'patient', params.id);
  return { ok: true };
});
