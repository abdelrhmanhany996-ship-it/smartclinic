import { z } from 'zod';
import { route, RECEPTION } from '@/lib/api';
import { audit, HttpError } from '@/lib/service';
import { q, q1, tx } from '@/lib/db';
import { hash } from '@/lib/auth';

export const POST = route(RECEPTION, async ({ user, req }) => {
  const b = z.object({ name: z.string().min(2), nameAr: z.string().nullish(), specialty: z.string().nullish(), specialtyAr: z.string().nullish(), avg: z.number().int().min(3).max(180).default(15),
    start: z.string().regex(/^\d{2}:\d{2}$/).default('09:00'), end: z.string().regex(/^\d{2}:\d{2}$/).default('17:00'), email: z.string().email().optional(), password: z.string().min(8).optional() }).parse(await req.json());
  const sub = await q1<any>('select max_doctors from subscriptions where clinic_id=$1', [user.clinicId]);
  const n = await q1<any>('select count(*)::int n from doctors where clinic_id=$1 and active', [user.clinicId]);
  if (sub && n.n >= sub.max_doctors) throw new HttpError(402, `Your plan allows ${sub.max_doctors} doctors. Upgrade to add more.`);
  const used = (await q<any>('select code from doctors where clinic_id=$1', [user.clinicId])).map((r) => r.code.trim());
  const code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').find((c) => !used.includes(c));
  if (!code) throw new HttpError(409, 'No more doctor codes available');
  const id = await tx(async (c) => {
    let uid: string | null = null;
    if (b.email && b.password) uid = (await c.query(`insert into users(clinic_id,role,email,password_hash,name) values($1,'doctor',$2,$3,$4) returning id`, [user.clinicId, b.email, hash(b.password), b.name])).rows[0].id;
    return (await c.query(`insert into doctors(clinic_id,user_id,name,name_ar,specialty,specialty_ar,code,avg_duration_min,work_start,work_end) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning id`,
      [user.clinicId, uid, b.name, b.nameAr, b.specialty, b.specialtyAr, code, b.avg, b.start, b.end])).rows[0].id;
  });
  await audit(user, 'doctor.create', 'doctor', id, { name: b.name });
  return { id, code };
});
