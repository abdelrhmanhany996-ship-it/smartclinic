import { z } from 'zod';
import { route, RECEPTION, STAFF } from '@/lib/api';
import { audit, getClinic } from '@/lib/service';
import { q } from '@/lib/db';
import { clinicNow } from '@/lib/time';

export const GET = route(STAFF, async ({ user }) => {
  const c = await getClinic(user.clinicId!);
  const doctors = await q('select id,name,name_ar,specialty,specialty_ar,code,avg_duration_min,work_start,work_end,break_start,break_end,work_days,active from doctors where clinic_id=$1 order by code', [user.clinicId]);
  return { clinic: c, doctors, today: clinicNow(c.timezone).date, subscription: user.role === 'receptionist' ? await q('select plan,status,max_doctors,current_period_end from subscriptions where clinic_id=$1', [user.clinicId]).then((r) => r[0]) : undefined };
});
const hhmm = z.string().regex(/^\d{2}:\d{2}$/);
const schema = z.object({
  name: z.string().min(2).max(80), nameAr: z.string().max(80).nullish(), tagline: z.string().max(120).nullish(),
  address: z.string().max(200).nullish(), phone: z.string().max(30).nullish(), email: z.string().email().nullish().or(z.literal('')),
  brandColor: z.string().regex(/^#[0-9a-fA-F]{6}$/), timezone: z.string().min(3).max(60),
  settings: z.object({
    notify_ahead_threshold: z.number().int().min(1).max(10), delay_notify_minutes: z.number().int().min(5).max(120),
    country_code: z.string().regex(/^\d{1,4}$/), slot_capacity: z.number().int().min(1).max(5), language: z.enum(['en', 'ar']),
    schedule: z.array(z.object({ open: z.boolean(), from: hhmm, to: hhmm })).length(7).nullable(),
    holidays: z.array(z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), note: z.string().max(80).optional() })).max(366),
  }).partial(),
}).partial();
export const PATCH = route(RECEPTION, async ({ user, req }) => {
  const b = schema.parse(await req.json());
  if (b.settings?.schedule && b.settings.schedule.some((d) => d.open && d.from >= d.to)) throw new (await import('@/lib/service')).HttpError(422, 'Opening time must be before closing time');
  const cur = await getClinic(user.clinicId!);
  try { if (b.timezone) new Intl.DateTimeFormat('en', { timeZone: b.timezone }); } catch { throw new (await import('@/lib/service')).HttpError(422, 'Invalid timezone'); }
  await q(`update clinics set name=coalesce($2,name), name_ar=coalesce($3,name_ar), tagline=coalesce($4,tagline), address=coalesce($5,address), phone=coalesce($6,phone), email=coalesce($7,email), brand_color=coalesce($8,brand_color), timezone=coalesce($9,timezone), settings=$10 where id=$1`,
    [user.clinicId, b.name, b.nameAr, b.tagline, b.address, b.phone, b.email, b.brandColor, b.timezone, { ...cur.settings, ...(b.settings ?? {}) }]);
  await audit(user, 'clinic.update', 'clinic', user.clinicId, { fields: Object.keys(b) });
  return { ok: true };
});
