import { route, STAFF } from '@/lib/api';
import { appointmentShare } from '@/lib/service';
export const GET = route<{ id: string }>(STAFF, async ({ user, req, params }) => {
  const l = req.nextUrl.searchParams.get('lang');
  return appointmentShare(user.clinicId!, params.id, l === 'ar' ? 'ar' : l === 'en' ? 'en' : undefined);
});
