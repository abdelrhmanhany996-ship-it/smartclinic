import { route, RECEPTION } from '@/lib/api';
import { q } from '@/lib/db';
export const GET = route(RECEPTION, async ({ user }) => q(`select l.id, l.action, l.entity, l.meta, l.created_at "createdAt", u.name "user" from audit_logs l left join users u on u.id=l.user_id where l.clinic_id=$1 order by l.id desc limit 100`, [user.clinicId]));
