'use client';
import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/shell';
import { Button, Card, Empty, Select, Skeleton, StatusChip, Time, cx } from '@/components/ui';
import { usePrefs } from '@/components/providers';
import { useLive } from '@/lib/client';
import { useClinic } from '@/components/useClinic';
import { RowActions, ShareModal, useActions } from '@/components/queue-parts';
import { addDays } from '@/lib/time';

export default function Calendar() {
  const { t, locale } = usePrefs();
  const clinic = useClinic();
  const [anchor, setAnchor] = useState(''); const [doctor, setDoctor] = useState(''); const [sel, setSel] = useState(''); const [share, setShare] = useState<string | null>(null);
  useEffect(() => { if (clinic.data && !anchor) { setAnchor(clinic.data.today); setSel(clinic.data.today); } }, [clinic.data, anchor]);
  const start = useMemo(() => { if (!anchor) return ''; const d = new Date(anchor + 'T12:00:00Z').getUTCDay(); return addDays(anchor, -d); }, [anchor]);
  const days = useMemo(() => (start ? Array.from({ length: 7 }, (_, i) => addDays(start, i)) : []), [start]);
  const { data, reload } = useLive<any[]>(start ? `/api/appointments?from=${start}&to=${addDays(start, 6)}${doctor ? `&doctorId=${doctor}` : ''}` : null, '/api/events');
  const { run, busy } = useActions(reload);
  const byDay = (d: string) => (data ?? []).filter((a) => a.date === d);
  const fmt = (d: string, o: Intl.DateTimeFormatOptions) => new Date(d + 'T12:00:00Z').toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-GB', { ...o, timeZone: 'UTC' });
  const sh = (n: number) => setAnchor(addDays(anchor, n));
  return (
    <>
      <PageHeader title={t('cal.title')} right={<>
        <Select value={doctor} onChange={(e) => setDoctor(e.target.value)} className="!w-auto"><option value="">{t('cal.all')}</option>{clinic.data?.doctors.map((d) => <option key={d.id} value={d.id}>{clinic.docName(d)}</option>)}</Select>
        <Button variant="secondary" size="sm" onClick={() => sh(-7)} aria-label={t('cal.prev')} icon={<ChevronLeft className="size-4 rtl:rotate-180" />} />
        <Button variant="secondary" size="sm" onClick={() => { setAnchor(clinic.data!.today); setSel(clinic.data!.today); }}>{t('common.today')}</Button>
        <Button variant="secondary" size="sm" onClick={() => sh(7)} aria-label={t('cal.nextW')} icon={<ChevronRight className="size-4 rtl:rotate-180" />} /></>} />
      <div className="mb-5 grid grid-cols-7 gap-2">
        {days.map((d) => { const n = byDay(d).filter((a) => a.status !== 'cancelled').length; const today = d === clinic.data?.today; return (
          <button key={d} onClick={() => setSel(d)} className={cx('rounded-xl border p-2 text-center transition sm:p-3', sel === d ? 'border-primary bg-primary text-primary-fg shadow' : 'border-line bg-card hover:bg-surface')}>
            <p className="text-[11px] font-semibold uppercase opacity-80">{fmt(d, { weekday: 'short' })}</p><p className="text-lg font-bold sm:text-2xl">{fmt(d, { day: 'numeric' })}</p>
            <p className={cx('mx-auto mt-1 w-fit rounded-full px-2 text-[11px] font-semibold', sel === d ? 'bg-white/20' : n ? 'bg-primary-soft text-primary' : 'text-muted')}>{n}{today && ' •'}</p></button>); })}
      </div>
      <Card>
        <div className="border-b border-line px-5 py-4 font-semibold">{sel && fmt(sel, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
        <div className="divide-y divide-line">
          {!data ? <div className="p-5"><Skeleton className="h-24" /></div> : byDay(sel).length === 0 ? <Empty title={t('cal.noAppts')} /> : byDay(sel).map((a) => (
            <div key={a.id} className="flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-3.5">
              <span className="w-20 font-semibold tabular-nums"><Time v={a.time} /></span>
              <div className="min-w-44 flex-1"><p className="font-medium">{a.patient}</p><p className="text-xs text-muted"><span dir="ltr">{a.phone}</span> · {t(`visit.${a.visitType}`)}</p></div>
              <div className="w-36 text-sm"><span className="me-2 rounded bg-primary-soft px-1.5 py-0.5 text-xs font-bold text-primary">{a.ticket}</span>{a.doctor}</div>
              <StatusChip status={a.status} />
              <RowActions it={{ ...a, estTime: null, ahead: null, delayMin: 0, durationMin: 15, startedAt: null, checkedInAt: null }} doctorId={a.doctorId} run={run} busy={busy} onShare={setShare} />
            </div>))}
        </div>
      </Card>
      <ShareModal id={share} onClose={() => setShare(null)} />
    </>
  );
}
