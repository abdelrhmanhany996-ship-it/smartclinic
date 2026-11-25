import { z } from 'zod';
import { route, STAFF } from '@/lib/api';
import { updateVisitDetails } from '@/lib/service';
export const PATCH = route<{ id: string }>(STAFF, async ({ user, req, params }) => {
  const b = z.object({ visitType: z.string().min(1).max(30).optional(), reason: z.string().max(1000).nullable().optional() }).parse(await req.json());
  return updateVisitDetails(user, params.id, b);
});
