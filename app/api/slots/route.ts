import { route, STAFF } from '@/lib/api';
import { listSlots } from '@/lib/service';
export const GET = route(STAFF, async ({ user, req }) => {
  const u = req.nextUrl.searchParams;
  return listSlots(user.clinicId!, u.get('doctorId') ?? '', u.get('date') ?? '');
});
