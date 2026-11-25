import { NextRequest } from 'next/server';
import { q1 } from '@/lib/db';
import { sseResponse } from '@/lib/events';
export const dynamic = 'force-dynamic';
export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const a = /^[A-Za-z0-9_-]{16,64}$/.test(token) ? await q1<any>('select clinic_id, doctor_id from appointments where token=$1', [token]) : null;
  if (!a) return new Response('Not found', { status: 404 });
  // the stream carries only a content-free "refresh" ping for this appointment's doctor queue
  return sseResponse(req, (e) => e.clinicId === a.clinic_id && (!e.doctorId || e.doctorId === a.doctor_id));
}
