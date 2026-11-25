import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { q, q1 } from '@/lib/db';
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const b = z.object({ endpoint: z.string().url(), keys: z.object({ p256dh: z.string(), auth: z.string() }) }).safeParse(await req.json().catch(() => null));
  const a = await q1<any>('select id from appointments where token=$1', [token]);
  if (!a || !b.success) return NextResponse.json({ error: 'Invalid' }, { status: 400 });
  await q('insert into push_subscriptions(appointment_id,endpoint,p256dh,auth) values($1,$2,$3,$4) on conflict (endpoint) do update set appointment_id=$1, p256dh=$3, auth=$4', [a.id, b.data.endpoint, b.data.keys.p256dh, b.data.keys.auth]);
  return NextResponse.json({ ok: true });
}
