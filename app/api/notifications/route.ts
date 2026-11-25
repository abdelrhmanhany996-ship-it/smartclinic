import { route, STAFF } from '@/lib/api';
import { q } from '@/lib/db';
export const GET = route(STAFF, async ({ user }) => {
  const rows = await q(`select id, kind, data, read_at "readAt", created_at "createdAt" from notifications where clinic_id=$1 and audience='staff' order by id desc limit 100`, [user.clinicId]);
  return { items: rows, unread: rows.filter((r: any) => !r.readAt).length };
});
export const POST = route(STAFF, async ({ user }) => { await q(`update notifications set read_at=now() where clinic_id=$1 and audience='staff' and read_at is null`, [user.clinicId]); return { ok: true }; });
