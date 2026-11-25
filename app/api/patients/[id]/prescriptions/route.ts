import { z } from 'zod';
import { route } from '@/lib/api';
import { createPrescription, listPrescriptions } from '@/lib/records';

export const GET = route<{ id: string }>(['doctor'], async ({ user, params }) => listPrescriptions(user.clinicId!, params.id));
export const POST = route<{ id: string }>(['doctor'], async ({ user, req, params }) => {
  const b = z.object({
    appointmentId: z.string().uuid().nullish(), diagnosis: z.string().max(2000).nullish(), advice: z.string().max(5000).nullish(),
    followUpDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish().or(z.literal('')), send: z.boolean(),
    items: z.array(z.object({ name: z.string().max(120), dose: z.string().max(60).optional(), frequency: z.string().max(80).optional(), duration: z.string().max(60).optional(), notes: z.string().max(300).optional() })).max(30),
  }).parse(await req.json());
  return createPrescription(user, params.id, b);
});
