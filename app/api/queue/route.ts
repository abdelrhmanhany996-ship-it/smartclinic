import { route, STAFF } from '@/lib/api';
import { queueSnapshot, getClinic, HttpError } from '@/lib/service';
import { clinicNow } from '@/lib/time';
export const GET = route(STAFF, async ({ user, req }) => {
  const u = req.nextUrl.searchParams;
  const doctorId = user.role === 'doctor' ? user.doctorId : u.get('doctorId');
  if (!doctorId) throw new HttpError(400, 'doctorId required');
  const date = u.get('date') ?? clinicNow((await getClinic(user.clinicId!)).timezone).date;
  return queueSnapshot(user.clinicId!, doctorId, date);
});
