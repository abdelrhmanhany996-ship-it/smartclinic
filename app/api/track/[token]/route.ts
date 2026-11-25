import { NextRequest, NextResponse } from 'next/server';
import { HttpError, trackView } from '@/lib/service';
export const dynamic = 'force-dynamic';
export async function GET(_: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try { return NextResponse.json(await trackView((await params).token), { headers: { 'Cache-Control': 'no-store' } }); }
  catch (e) { if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status }); console.error(e); return NextResponse.json({ error: 'Server error' }, { status: 500 }); }
}
