import { route } from '@/lib/api';
import { q1 } from '@/lib/db';
export const GET = route(['super_admin'], async () => q1(`select (select count(*)::int from clinics) clinics, (select count(*)::int from clinics where status='active') active_clinics,
  (select count(*)::int from users where role<>'super_admin') users, (select count(*)::int from doctors) doctors,
  (select count(*)::int from appointments where appt_date=current_date) appointments_today, (select count(*)::int from appointments) appointments_total,
  (select coalesce(sum(price_monthly),0)::float from subscriptions where status in ('active')) mrr`));
