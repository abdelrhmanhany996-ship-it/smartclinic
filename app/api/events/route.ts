import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { sseResponse } from '@/lib/events';
export const dynamic = 'force-dynamic';
export async function GET(req: NextRequest) {
  const s = await getSession();
  if (!s?.clinicId) return new Response('Unauthorized', { status: 401 });
  const clinicId = s.clinicId;
  return sseResponse(req, (e) => e.clinicId === clinicId);
}
