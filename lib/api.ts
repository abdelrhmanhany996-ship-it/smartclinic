import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { getSession, Role, Session } from './auth';
import { HttpError } from './service';
import { q1 } from './db';

type Ctx<P> = { user: Session; req: NextRequest; params: P };
/** Auth + role guard + uniform error handling. Every staff handler gets a verified session; clinic scoping comes from user.clinicId only. */
export function route<P = Record<string, string>>(roles: Role[] | null, fn: (c: Ctx<P>) => Promise<unknown>) {
  return async (req: NextRequest, { params }: { params: Promise<P> }) => {
    try {
      const user = await getSession();
      if (roles) {
        if (!user) throw new HttpError(401, 'Unauthorized');
        if (!roles.includes(user.role)) throw new HttpError(403, 'Forbidden');
        if (user.role !== 'super_admin' && !user.clinicId) throw new HttpError(403, 'No clinic');
        // revoke access immediately for disabled users / suspended clinics (cookie may still be valid)
        const live = await q1<any>(`select u.active, c.status from users u left join clinics c on c.id=u.clinic_id where u.id=$1`, [user.uid]);
        if (!live?.active || live.status === 'suspended') throw new HttpError(401, 'Account disabled');
      }
      const out = await fn({ user: user as Session, req, params: await params });
      return out instanceof Response ? out : NextResponse.json(out ?? { ok: true });
    } catch (e: any) {
      if (e instanceof ZodError) return NextResponse.json({ error: e.issues[0]?.path.join('.') + ': ' + e.issues[0]?.message }, { status: 422 });
      if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status });
      if (e?.code === '23505') return NextResponse.json({ error: 'Already exists' }, { status: 409 });
      console.error(e);
      return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
  };
}
export const STAFF: Role[] = ['receptionist', 'doctor'];
export const RECEPTION: Role[] = ['receptionist'];
