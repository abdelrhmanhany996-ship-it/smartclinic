import { NextRequest, NextResponse } from 'next/server';
import { q } from '@/lib/db';
export async function POST(_: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  await q(`update notifications set read_at=now() where read_at is null and appointment_id=(select id from appointments where token=$1)`, [token]);
  return NextResponse.json({ ok: true });
}
