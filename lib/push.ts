import webpush from 'web-push';
import { q } from './db';

let ready: boolean | null = null;
function init() {
  if (ready !== null) return ready;
  const { VAPID_PUBLIC_KEY: pub, VAPID_PRIVATE_KEY: priv, VAPID_SUBJECT: sub } = process.env;
  if (pub && priv) { webpush.setVapidDetails(sub || 'mailto:admin@smartclinic.app', pub, priv); ready = true; } else ready = false;
  return ready;
}
export async function pushToAppointment(appointmentId: string, payload: { title: string; body: string; url: string; tag?: string }) {
  if (!init()) return;
  const subs = await q('select * from push_subscriptions where appointment_id=$1', [appointmentId]);
  await Promise.all(subs.map(async (s) => {
    try { await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload)); }
    catch (e: any) { if (e?.statusCode === 404 || e?.statusCode === 410) await q('delete from push_subscriptions where id=$1', [s.id]); }
  }));
}
