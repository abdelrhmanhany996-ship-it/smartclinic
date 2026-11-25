import { route, STAFF } from '@/lib/api';
import { reports } from '@/lib/service';
export const GET = route(STAFF, async ({ user, req }) => {
  const days = Math.min(90, Math.max(1, Number(req.nextUrl.searchParams.get('days') ?? 7)));
  const doc = user.role === 'doctor' ? user.doctorId : req.nextUrl.searchParams.get('doctorId');
  return reports(user.clinicId!, days, doc);
});
