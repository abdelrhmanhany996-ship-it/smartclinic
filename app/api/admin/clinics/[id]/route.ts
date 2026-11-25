import { z } from 'zod';
import { route } from '@/lib/api';
import { q } from '@/lib/db';
import { audit } from '@/lib/service';
export const PATCH = route<{ id: string }>(['super_admin'], async ({ user, req, params }) => {
  const b = z.object({ status: z.enum(['active', 'suspended']), plan: z.enum(['trial', 'starter', 'pro', 'enterprise']), subStatus: z.enum(['active', 'past_due', 'cancelled', 'trialing']), maxDoctors: z.number().int().min(1).max(500), price: z.number().min(0), periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).partial().parse(await req.json());
  if (b.status) await q('update clinics set status=$2 where id=$1', [params.id, b.status]);
  await q(`update subscriptions set plan=coalesce($2,plan), status=coalesce($3,status), max_doctors=coalesce($4,max_doctors), price_monthly=coalesce($5,price_monthly), current_period_end=coalesce($6::date,current_period_end) where clinic_id=$1`, [params.id, b.plan, b.subStatus, b.maxDoctors, b.price, b.periodEnd]);
  await audit({ uid: user.uid, clinicId: null }, 'clinic.update', 'clinic', params.id, b);
  return { ok: true };
});
