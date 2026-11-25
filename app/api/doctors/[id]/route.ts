import { z } from 'zod';
import { route, STAFF } from '@/lib/api';
import { afterChange, audit, HttpError } from '@/lib/service';
import { q, q1 } from '@/lib/db';
import { clinicNow } from '@/lib/time';
import { getClinic } from '@/lib/service';

const hhmm = z.string().regex(/^\d{2}:\d{2}$/);
export const PATCH = route<{ id: string }>(STAFF, async ({ user, req, params }) => {
  if (user.role === 'doctor' && user.doctorId !== params.id) throw new HttpError(403, 'Forbidden');
  const b = z.object({ avg: z.number().int().min(3).max(180), start: hhmm, end: hhmm, breakStart: hhmm.nullable(), breakEnd: hhmm.nullable(), workDays: z.array(z.number().int().min(0).max(6)), active: z.boolean(), specialty: z.string().nullable(), name: z.string().min(2) }).partial().parse(await req.json());
  if (b.start && b.end && b.start >= b.end) throw new HttpError(422, 'End time must be after start time');
  const d = await q1<any>('select id from doctors where id=$1 and clinic_id=$2', [params.id, user.clinicId]);
  if (!d) throw new HttpError(404, 'Doctor not found');
  if (user.role === 'doctor') delete b.active, delete b.name;
  await q(`update doctors set avg_duration_min=coalesce($3,avg_duration_min), work_start=coalesce($4,work_start), work_end=coalesce($5,work_end),
    break_start=case when $11 then $6 else break_start end, break_end=case when $11 then $7 else break_end end, work_days=coalesce($8,work_days), active=coalesce($9,active), specialty=coalesce($10,specialty), name=coalesce($12,name) where id=$1 and clinic_id=$2`,
    [params.id, user.clinicId, b.avg, b.start, b.end, b.breakStart ?? null, b.breakEnd ?? null, b.workDays, b.active, b.specialty, 'breakStart' in b || 'breakEnd' in b, b.name]);
  await audit(user, 'doctor.update', 'doctor', params.id, b);
  const c = await getClinic(user.clinicId!);
  await afterChange(user.clinicId!, params.id, [clinicNow(c.timezone).date], 'doctor_updated'); // recalculates estimates with new avg duration
  return { ok: true };
});
