import { z } from 'zod';
import { route } from '@/lib/api';
import { q } from '@/lib/db';
import { audit, HttpError } from '@/lib/service';
import { hash } from '@/lib/auth';
export const PATCH = route<{ id: string }>(['super_admin'], async ({ user, req, params }) => {
  const b = z.object({ active: z.boolean(), password: z.string().min(8) }).partial().parse(await req.json());
  if (params.id === user.uid && b.active === false) throw new HttpError(409, 'You cannot disable your own account');
  await q('update users set active=coalesce($2,active), password_hash=coalesce($3,password_hash) where id=$1', [params.id, b.active, b.password ? hash(b.password) : null]);
  await audit({ uid: user.uid, clinicId: null }, 'user.update', 'user', params.id, { active: b.active, password: b.password ? 'reset' : undefined });
  return { ok: true };
});
