'use client';
import { useState } from 'react';
import { Button, Field, Input, cx } from './ui';
import { usePrefs } from './providers';
import { api } from '@/lib/client';

export function DoctorScheduleForm({ doctor, onSaved, isAdmin }: { doctor: any; onSaved?: () => void; isAdmin?: boolean }) {
  const { t, toast } = usePrefs();
  const hm = (v?: string | null) => (v ? v.slice(0, 5) : '');
  const [f, setF] = useState({ avg: doctor.avg_duration_min, start: hm(doctor.work_start), end: hm(doctor.work_end), bs: hm(doctor.break_start), be: hm(doctor.break_end), days: doctor.work_days as number[], active: doctor.active as boolean });
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try {
      await api(`/api/doctors/${doctor.id}`, { method: 'PATCH', body: { avg: Number(f.avg), start: f.start, end: f.end, breakStart: f.bs || null, breakEnd: f.be || null, workDays: f.days, ...(isAdmin ? { active: f.active } : {}) } });
      toast(t('common.saved')); onSaved?.();
    } catch (e: any) { toast(e.message, 'err'); } finally { setBusy(false); }
  };
  const tog = (d: number) => setF((x) => ({ ...x, days: x.days.includes(d) ? x.days.filter((y) => y !== d) : [...x.days, d].sort() }));
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label={t('st.avg')}>{(id) => <Input id={id} type="number" min={3} max={180} value={f.avg} onChange={(e) => setF({ ...f, avg: e.target.value as any })} />}</Field>
        <Field label={`${t('st.hours')} — ${t('st.from')}`}>{(id) => <Input id={id} type="time" value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} />}</Field>
        <Field label={`${t('st.hours')} — ${t('st.to')}`}>{(id) => <Input id={id} type="time" value={f.end} onChange={(e) => setF({ ...f, end: e.target.value })} />}</Field>
        <Field label={`${t('st.break')} — ${t('st.from')}`}>{(id) => <Input id={id} type="time" value={f.bs} onChange={(e) => setF({ ...f, bs: e.target.value })} />}</Field>
        <Field label={`${t('st.break')} — ${t('st.to')}`}>{(id) => <Input id={id} type="time" value={f.be} onChange={(e) => setF({ ...f, be: e.target.value })} />}</Field>
      </div>
      <div><p className="mb-2 text-sm font-medium">{t('st.days')}</p><div className="flex flex-wrap gap-2">{[0, 1, 2, 3, 4, 5, 6].map((d) => <button key={d} type="button" aria-pressed={f.days.includes(d)} onClick={() => tog(d)} className={cx('h-9 min-w-14 rounded-lg border px-3 text-sm font-medium transition', f.days.includes(d) ? 'border-primary bg-primary text-primary-fg' : 'border-line hover:bg-surface')}>{t(`day.${d}`)}</button>)}</div></div>
      {isAdmin && <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" className="size-4 accent-[var(--primary)]" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} />{t('st.active')}</label>}
      <Button onClick={save} loading={busy}>{t('common.save')}</Button>
    </div>
  );
}
