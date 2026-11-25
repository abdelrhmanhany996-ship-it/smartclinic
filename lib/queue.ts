/**
 * Pure queue engine. One queue per doctor per day.
 * - "ahead" = waiting patients (booked / checked-in) before you; the patient in consultation is not counted.
 * - estimated start = max(when the doctor is free, scheduled time); delays propagate down the queue.
 */
export type Status = 'booked' | 'checked_in' | 'in_consultation' | 'completed' | 'skipped' | 'cancelled' | 'no_show';
export const WAITING: Status[] = ['booked', 'checked_in'];
export const LIVE: Status[] = ['booked', 'checked_in', 'in_consultation'];

export interface QItem { id: string; status: Status; sortKey: number; scheduledMin: number; durationMin: number; startedAtMs?: number | null }
export interface Estimate { id: string; ahead: number; estStartMin: number; delayMin: number; inConsultation: boolean }

const OVERRUN_GRACE_MIN = 5;
const roundUp5 = (m: number) => Math.ceil(m / 5 - 1e-9) * 5;

export function computeQueue(items: QItem[], nowMin: number, nowMs: number): Map<string, Estimate> {
  const out = new Map<string, Estimate>();
  const current = items.find((i) => i.status === 'in_consultation');
  let cursor = nowMin;
  if (current) {
    const elapsed = current.startedAtMs ? (nowMs - current.startedAtMs) / 60000 : 0;
    cursor = nowMin + Math.max(current.durationMin - elapsed, OVERRUN_GRACE_MIN);
    out.set(current.id, { id: current.id, ahead: 0, estStartMin: current.scheduledMin, delayMin: 0, inConsultation: true });
  }
  const waiting = items.filter((i) => WAITING.includes(i.status)).sort((a, b) => a.sortKey - b.sortKey);
  waiting.forEach((it, idx) => {
    const est = roundUp5(Math.max(cursor, it.scheduledMin));
    // never show an estimate earlier than the booked time rounded to the minute
    const estStartMin = Math.max(est, it.scheduledMin);
    out.set(it.id, { id: it.id, ahead: idx, estStartMin, delayMin: Math.max(0, Math.round(estStartMin - it.scheduledMin)), inConsultation: false });
    cursor = Math.max(cursor, it.scheduledMin) + it.durationMin;
  });
  return out;
}

export const VISIT_TYPES = [
  { key: 'consultation', en: 'Consultation', ar: 'كشف', factor: 1 },
  { key: 'follow_up', en: 'Follow-up', ar: 'متابعة', factor: 0.7 },
  { key: 'checkup', en: 'Check-up', ar: 'فحص شامل', factor: 1.4 },
  { key: 'procedure', en: 'Procedure', ar: 'إجراء', factor: 2 },
] as const;

export const DEFAULT_SETTINGS = {
  notify_ahead_threshold: 1,   // send "turn approaching" when this many patients are ahead
  delay_notify_minutes: 10,    // notify when estimate shifts by at least this much
  country_code: '20',
  slot_capacity: 1,
  language: 'en',
  visit_types: VISIT_TYPES,
};
export type ClinicSettings = typeof DEFAULT_SETTINGS;

export const durationFor = (avg: number, visitType: string, vt: readonly { key: string; factor: number }[]) =>
  Math.max(3, Math.round(avg * (vt.find((v) => v.key === visitType)?.factor ?? 1)));
