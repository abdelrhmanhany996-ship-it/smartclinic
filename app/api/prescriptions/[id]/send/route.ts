import { route } from '@/lib/api';
import { sendPrescription } from '@/lib/records';
export const POST = route<{ id: string }>(['doctor'], async ({ user, params }) => { await sendPrescription(user, params.id); return { ok: true }; });
