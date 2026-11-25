import { NextRequest, NextResponse } from 'next/server';
import { q1 } from '@/lib/db';
export const dynamic = 'force-dynamic';
export async function GET(_: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const c = /^[A-Za-z0-9_-]{16,64}$/.test(token) ? await q1<any>('select c.name, c.brand_color from appointments a join clinics c on c.id=a.clinic_id where a.token=$1', [token]) : null;
  return NextResponse.json({
    name: c ? `${c.name} — SmartClinic` : 'SmartClinic', short_name: c ? c.name.slice(0, 12) : 'SmartClinic',
    description: 'Track your clinic queue live', id: `/t/${token}`, start_url: `/t/${token}`, scope: `/t/${token}`, display: 'standalone', orientation: 'portrait',
    background_color: '#ffffff', theme_color: c?.brand_color ?? '#087E83',
    icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' }, { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' }, { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }],
  }, { headers: { 'Content-Type': 'application/manifest+json', 'Cache-Control': 'no-store' } });
}
