/** Clinic-local time helpers. Estimates are expressed as minutes-from-midnight in clinic local time. */
export function clinicNow(tz: string, at = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(at);
  const p: Record<string, string> = {};
  for (const x of parts) p[x.type] = x.value;
  const date = `${p.year}-${p.month}-${p.day}`;
  const min = Number(p.hour) * 60 + Number(p.minute) + Number(p.second) / 60;
  return { date, min, ms: at.getTime(), dow: new Date(date + 'T12:00:00Z').getUTCDay() };
}
export const toMin = (t: string) => { const [h, m] = t.split(':'); return Number(h) * 60 + Number(m); };
export const fromMin = (m: number) => { const x = Math.round(m); return `${String(Math.floor(x / 60) % 24).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`; };
export const addDays = (date: string, n: number) => { const d = new Date(date + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
export const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);
