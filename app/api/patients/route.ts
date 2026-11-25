import { route, RECEPTION } from '@/lib/api';
import { q } from '@/lib/db';
export const GET = route(RECEPTION, async ({ user, req }) => {
  const s = req.nextUrl.searchParams.get('q');
  const p: any[] = [user.clinicId]; let f = '';
  if (s) { p.push(`%${s}%`); f = ' and (p.full_name ilike $2 or p.phone like $2)'; }
  return q(`select p.id, p.full_name "fullName", p.phone, p.channel, p.created_at "createdAt", count(a.id)::int visits,
      count(a.id) filter (where a.status='completed')::int completed, count(a.id) filter (where a.status='no_show')::int "noShows",
      max(a.appt_date)::text "lastVisit" from patients p left join appointments a on a.patient_id=p.id where p.clinic_id=$1${f}
      group by p.id order by p.full_name limit 300`, p);
});
