import { toMin } from './time';

export interface DaySchedule { open: boolean; from: string; to: string }
export interface Holiday { date: string; note?: string }
export type Closed = 'holiday' | 'clinic_closed' | 'doctor_off' | 'hours';

/** The bookable window for a doctor on a date = doctor hours ∩ clinic hours for that weekday; holidays and closed days block everything. */
export function effectiveWindow(clinic: { settings: any }, doc: { work_days: number[]; work_start: string; work_end: string }, date: string):
  { open: true; start: number; end: number } | { open: false; reason: Closed } {
  const dow = new Date(date + 'T12:00:00Z').getUTCDay();
  const holidays: Holiday[] = clinic.settings.holidays ?? [];
  if (holidays.some((h) => h.date === date)) return { open: false, reason: 'holiday' };
  const sch: DaySchedule | undefined = clinic.settings.schedule?.[dow];
  if (sch && !sch.open) return { open: false, reason: 'clinic_closed' };
  if (!doc.work_days.includes(dow)) return { open: false, reason: 'doctor_off' };
  let start = toMin(doc.work_start), end = toMin(doc.work_end);
  if (sch) { start = Math.max(start, toMin(sch.from)); end = Math.min(end, toMin(sch.to)); }
  if (start >= end) return { open: false, reason: 'hours' };
  return { open: true, start, end };
}
export const dayOffKey = (reason?: string) => (reason === 'holiday' ? 'new.holiday' : reason === 'clinic_closed' ? 'new.closedDay' : 'new.dayOffPick');
