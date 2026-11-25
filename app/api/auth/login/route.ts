import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { homeFor, login, setSessionCookie } from '@/lib/auth';
import { audit } from '@/lib/service';

const hits = new Map<string, { n: number; t: number }>();
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'local';
  const h = hits.get(ip); const now = Date.now();
  if (h && now - h.t < 60_000 && h.n >= 10) return NextResponse.json({ error: 'Too many attempts. Try again in a minute.' }, { status: 429 });
  hits.set(ip, h && now - h.t < 60_000 ? { n: h.n + 1, t: h.t } : { n: 1, t: now });
  const body = z.object({ email: z.string().email(), password: z.string().min(1) }).safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: 'Enter a valid email and password' }, { status: 422 });
  const s = await login(body.data.email, body.data.password);
  if (!s) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  await setSessionCookie(s);
  await audit({ uid: s.uid, clinicId: s.clinicId }, 'auth.login', 'user', s.uid);
  return NextResponse.json({ ok: true, home: homeFor(s.role), role: s.role });
}
