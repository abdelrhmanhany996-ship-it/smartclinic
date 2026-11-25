import { z } from 'zod';
import { route, STAFF } from '@/lib/api';
import { Action, doAction } from '@/lib/service';
export const POST = route<{ id: string }>(STAFF, async ({ user, req, params }) => {
  const b = z.object({ action: z.enum(['check_in', 'start', 'end', 'skip', 'recall', 'cancel', 'no_show', 'reschedule']), date: z.string().optional(), time: z.string().optional(), doctorId: z.string().uuid().optional() }).parse(await req.json());
  return doAction(user, params.id, b.action as Action, b);
});
