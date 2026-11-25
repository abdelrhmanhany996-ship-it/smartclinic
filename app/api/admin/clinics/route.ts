import { z } from 'zod';
import { route } from '@/lib/api';
import { q, tx } from '@/lib/db';
import { audit } from '@/lib/service';
import { hash } from '@/lib/auth';
import { DEFAULT_SETTINGS } from '@/lib/queue';

export const GET = route(['super_admin'], async () => q(`select c.id, c.slug, c.name, c.name_ar "nameAr", c.status, c.brand_color "brandColor", c.created_at "createdAt", c.phone, c.address,
  s.plan, s.status "subStatus", s.max_doctors "maxDoctors", s.price_monthly::float "price", s.current_period_end::text "periodEnd",
  (select count(*)::int from doctors d where d.clinic_id=c.id) doctors, (select count(*)::int from users u where u.clinic_id=c.id) users,
  (select count(*)::int from appointments a where a.clinic_id=c.id) appointments from clinics c left join subscriptions s on s.clinic_id=c.id order by c.created_at desc`));
export const POST = route(['super_admin'], async ({ user, req }) => {
  const b = z.object({ name: z.string().min(2), slug: z.string().regex(/^[a-z0-9-]{2,40}$/), plan: z.enum(['trial', 'starter', 'pro', 'enterprise']).default('trial'), ownerName: z.string().min(2), ownerEmail: z.string().email(), ownerPassword: z.string().min(8), language: z.enum(['en', 'ar']).default('en') }).parse(await req.json());
  const price = { trial: 0, starter: 500, pro: 1200, enterprise: 3000 }[b.plan], max = { trial: 2, starter: 3, pro: 10, enterprise: 100 }[b.plan];
  const id = await tx(async (c) => {
    const cl = (await c.query('insert into clinics(slug,name,settings) values($1,$2,$3) returning id', [b.slug, b.name, { ...DEFAULT_SETTINGS, language: b.language }])).rows[0].id;
    await c.query(`insert into subscriptions(clinic_id,plan,status,max_doctors,price_monthly) values($1,$2,$3,$4,$5)`, [cl, b.plan, b.plan === 'trial' ? 'trialing' : 'active', max, price]);
    await c.query(`insert into users(clinic_id,role,email,password_hash,name) values($1,'receptionist',$2,$3,$4)`, [cl, b.ownerEmail, hash(b.ownerPassword), b.ownerName]);
    return cl;
  });
  await audit({ uid: user.uid, clinicId: null }, 'clinic.create', 'clinic', id, { slug: b.slug });
  return { id };
});
