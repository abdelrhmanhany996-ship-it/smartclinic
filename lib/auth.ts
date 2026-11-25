import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { q1 } from './db';
import { signSession, verifyToken, homeFor, Role, Session } from './jwt';
export { signSession, verifyToken, homeFor };
export type { Role, Session };

const COOKIE = 'sc_session';

export async function getSession(): Promise<Session | null> {
  return verifyToken((await cookies()).get(COOKIE)?.value);
}
export async function setSessionCookie(s: Session) {
  (await cookies()).set(COOKIE, await signSession(s), {
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' && !process.env.INSECURE_COOKIES, path: '/', maxAge: 60 * 60 * 12,
  });
}
export async function clearSession() { (await cookies()).delete(COOKIE); }

export async function login(email: string, password: string): Promise<Session | null> {
  const u = await q1<any>(
    `select u.*, c.status as clinic_status, d.id as doctor_id from users u
       left join clinics c on c.id = u.clinic_id left join doctors d on d.user_id = u.id
      where lower(u.email) = lower($1)`, [email]);
  const hash = u?.password_hash ?? '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvali';
  const ok = await bcrypt.compare(password, hash);
  if (!u || !ok || !u.active || u.clinic_status === 'suspended') return null;
  return { uid: u.id, role: u.role, clinicId: u.clinic_id, name: u.name, doctorId: u.doctor_id };
}
export const hash = (p: string) => bcrypt.hashSync(p, 10);
