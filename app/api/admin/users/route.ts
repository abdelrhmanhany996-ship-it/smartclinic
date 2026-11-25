import { z } from 'zod';
import { route } from '@/lib/api';
import { q } from '@/lib/db';
import { audit } from '@/lib/service';
import { hash } from '@/lib/auth';
export const GET = route(['super_admin'], async () => q(`select u.id, u.name, u.email, u.role, u.active, u.created_at "createdAt", c.name clinic from users u left join clinics c on c.id=u.clinic_id order by u.role, c.name, u.name`));
export const POST = route(['super_admin'], async ({ user, req }) => {
  const b = z.object({ clinicId: z.string().uuid(), name: z.string().min(2), email: z.string().email(), password: z.string().min(8), role: z.literal('receptionist') }).parse(await req.json());
  const r = await q(`insert into users(clinic_id,role,email,password_hash,name) values($1,$2,$3,$4,$5) returning id`, [b.clinicId, b.role, b.email, hash(b.password), b.name]);
  await audit({ uid: user.uid, clinicId: null }, 'user.create', 'user', r[0].id, { email: b.email });
  return { id: r[0].id };
});
