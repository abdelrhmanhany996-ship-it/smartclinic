export type Lang = 'en' | 'ar';
export function normalizePhone(raw: string, cc = '20') {
  let d = raw.replace(/[^\d+]/g, '');
  if (d.startsWith('+')) return d.slice(1).replace(/\D/g, '');
  d = d.replace(/\D/g, '');
  if (d.startsWith('00')) return d.slice(2);
  if (d.startsWith('0')) return cc + d.slice(1);
  return d.startsWith(cc) && d.length > 10 ? d : cc + d;
}
export function fmtTime12(hhmm: string, lang: Lang = 'en') {
  const [h, m] = hhmm.split(':').map(Number);
  const suf = h >= 12 ? (lang === 'ar' ? 'م' : 'PM') : lang === 'ar' ? 'ص' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${suf}`;
}
export interface MsgInput { clinic: string; doctor: string; date: string; time: string; ticket: string; link: string; patient?: string; lang: Lang }
export function confirmationMessage(m: MsgInput) {
  const d = new Date(m.date + 'T12:00:00Z').toLocaleDateString(m.lang === 'ar' ? 'ar-EG' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  const t = fmtTime12(m.time.slice(0, 5), m.lang);
  return m.lang === 'ar'
    ? `مرحباً ${m.patient ?? ''}،\nتم تأكيد حجزك في *${m.clinic}*\n\nالطبيب: ${m.doctor}\nالموعد: ${d} - ${t}\nرقم الدور: ${m.ticket}\n\nتابع دورك لحظة بلحظة من بيتك بدون انتظار:\n${m.link}\n\nSmartClinic — انتظار أقل. رعاية أفضل.`
    : `Hello ${m.patient ?? ''},\nYour appointment at *${m.clinic}* is confirmed.\n\nDoctor: ${m.doctor}\nWhen: ${d} at ${t}\nQueue number: ${m.ticket}\n\nTrack your turn live from home — no waiting room needed:\n${m.link}\n\nSmartClinic — Less Waiting. Better Care.`;
}
export const whatsappUrl = (phone: string, text: string) => `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
export const telegramUrl = (link: string, text: string) => `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`;
