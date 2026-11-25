import { NextRequest, NextResponse } from 'next/server';
import { homeFor, verifyToken } from '@/lib/jwt';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const s = await verifyToken(req.cookies.get('sc_session')?.value);
  const area = pathname.startsWith('/admin') ? 'super_admin' : pathname.startsWith('/doctor') ? 'doctor' : pathname.startsWith('/app') ? 'receptionist' : null;
  if (area) {
    if (!s) return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(pathname)}`, req.url));
    if (s.role !== area) return NextResponse.redirect(new URL(homeFor(s.role), req.url));
  }
  if (pathname === '/login' && s) return NextResponse.redirect(new URL(homeFor(s.role), req.url));
  return NextResponse.next();
}
export const config = { matcher: ['/admin/:path*', '/doctor/:path*', '/app/:path*', '/login'] };
