import { SignJWT, jwtVerify } from 'jose';
export type Role = 'super_admin' | 'receptionist' | 'doctor';
export interface Session { uid: string; role: Role; clinicId: string | null; name: string; doctorId?: string | null }
const key = () => new TextEncoder().encode(process.env.AUTH_SECRET || 'dev-insecure-secret-change-me-please-32chars');
export const signSession = (s: Session) => new SignJWT({ ...s }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('12h').sign(key());
export async function verifyToken(t?: string | null): Promise<Session | null> {
  if (!t) return null;
  try { return (await jwtVerify(t, key())).payload as unknown as Session; } catch { return null; }
}
export const homeFor = (r: Role) => (r === 'super_admin' ? '/admin' : r === 'doctor' ? '/doctor' : '/app/overview');
