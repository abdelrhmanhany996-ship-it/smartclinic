'use client';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, CalendarDays, Hourglass, Search, Stethoscope, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/shell';
import { Card, CardHeader, Empty, Input, LiveDot, Select, Skeleton, StatTile, StatusChip, Time, cx } from '@/components/ui';
import { usePrefs } from '@/components/providers';
import { useLive } from '@/lib/client';
import { useClinic } from '@/components/useClinic';
import { RowActions, ShareModal, useActions } from '@/components/queue-parts';

function Queue() {
  const { t } = usePrefs();
  const clinic = useClinic();
  const sp = useSearchParams();
  const [doctorId, setDoctorId] = useState(sp.get('doctor') ?? '');
  const [date, setDate] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'done'>('all');
  const [search, setSearch] = useState('');
  const [share, setShare] = useState<string | null>(null);
  useEffect(() => { if (!doctorId && clinic.data?.doctors.length) setDoctorId(clinic.data.doctors.find((d) => d.active)?.id ?? ''); if (!date && clinic.data) setDate(clinic.data.today); }, [clinic.data, doctorId, date]);
  const { data, connected, reload, error } = useLive<any>(doctorId && date ? `/api/queue?doctorId=${doctorId}&date=${date}` : null, '/api/events', { poll: 15000 });
  const { run, busy } = useActions(reload);
  const items = useMemo(() => (data?.items ?? []).filter((i: any) => (filter === 'all' || (filter === 'active' ? ['booked', 'checked_in', 'in_consultation', 'skipped'].includes(i.status) : ['completed', 'cancelled', 'no_show'].includes(i.status))) && (!search || (i.patient + i.ticket + i.phone).toLowerCase().includes(search.toLowerCase()))), [data, filter, search]);
  const count = (s: string[]) => data?.items.filter((i: any) => s.includes(i.status)).length ?? 0;
  const isToday = date === clinic.data?.today;
  const [nowTick, setNow] = useState(Date.now()); useEffect(() => { const x = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(x); }, []);

  return (
    <>
      <PageHeader title={t('q.title')} sub={t('q.sub')} right={<>
        <LiveDot ok={connected} />
        <Select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} className="!w-auto" aria-label={t('common.doctor')}>{clinic.data?.doctors.filter((d) => d.active).map((d) => <option key={d.id} value={d.id}>{d.code} · {clinic.docName(d)}</option>)}</Select>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="!w-auto" aria-label={t('common.date')} /></>} />
      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile tone="teal" icon={<CalendarDays />} label={t('ov.appointments')} value={data ? data.items.filter((i: any) => !['cancelled'].includes(i.status)).length : '–'} />
        <StatTile tone="amber" icon={<Hourglass />} label={t('ov.waiting')} value={data ? count(['booked', 'checked_in', 'skipped']) : '–'} />
        <StatTile tone="blue" icon={<Stethoscope />} label={t('ov.inConsult')} value={data ? count(['in_consultation']) : '–'} />
        <StatTile tone="green" icon={<CheckCircle2 />} label={t('ov.completed')} value={data ? count(['completed']) : '–'} />
      </div>
      {data && isToday && data.delayMin >= 10 && <div role="status" className="mb-5 flex items-center gap-3 rounded-xl bg-[var(--wait-bg)] px-4 py-3 text-sm font-medium text-[var(--wait-fg)]"><AlertTriangle className="size-5 shrink-0" />{t('q.delayBanner', { n: data.delayMin })}</div>}
      <Card>
        <CardHeader title={t('q.title')} sub={data ? `${t('q.avgConsult')}: ${data.doctor.effectiveAvg} ${t('common.min')}` : undefined} right={
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-line p-0.5 text-xs font-semibold">{(['all', 'active', 'done'] as const).map((f) => <button key={f} onClick={() => setFilter(f)} className={cx('rounded-md px-3 py-1.5', filter === f ? 'bg-primary text-primary-fg' : 'text-muted')}>{t(`q.filter${f[0].toUpperCase() + f.slice(1)}`)}</button>)}</div>
            <div className="relative"><Search className="pointer-events-none absolute start-3 top-3 size-4 text-muted" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('q.search')} className="!w-56 ps-9" /></div></div>} />
        <div className="overflow-x-auto scroll-thin">
          <table className="w-full min-w-[860px] text-start text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wide text-muted"><tr>{['q.ticket', 'q.patient', 'q.appt', 'q.est', 'q.ahead', 'common.status', 'common.actions'].map((k) => <th key={k} className="px-4 py-3 text-start font-semibold">{t(k)}</th>)}</tr></thead>
            <tbody className="divide-y divide-line">
              {!data && !error && [0, 1, 2, 3].map((i) => <tr key={i}><td colSpan={7} className="p-3"><Skeleton className="h-9" /></td></tr>)}
              {error && <tr><td colSpan={7}><Empty title={error} /></td></tr>}
              {data && items.length === 0 && <tr><td colSpan={7}><Empty title={t('q.empty')} /></td></tr>}
              {items.map((it: any) => {
                const live = ['booked', 'checked_in', 'in_consultation'].includes(it.status);
                const late = it.status === 'booked' && isToday && it.estTime && it.time < data.now;
                const elapsed = it.status === 'in_consultation' && it.startedAt ? Math.max(0, Math.floor((nowTick - new Date(it.startedAt).getTime()) / 60000)) : null;
                return (
                  <tr key={it.id} className={cx('transition-colors', it.status === 'in_consultation' && 'bg-[var(--consult-bg)]/40', ['completed', 'cancelled', 'no_show'].includes(it.status) && 'opacity-60')}>
                    <td className="px-4 py-3 font-bold tabular-nums">{it.ticket}</td>
                    <td className="px-4 py-3"><p className="font-medium">{it.patient}</p><p dir="ltr" className="text-start text-xs text-muted">{it.phone}</p></td>
                    <td className="px-4 py-3 tabular-nums"><Time v={it.time} /></td>
                    <td className="px-4 py-3 tabular-nums">{live && it.status !== 'in_consultation' && isToday ? <span className={cx(it.delayMin >= 10 && 'font-semibold text-[var(--wait-fg)]')}><Time v={it.estTime} />{it.delayMin >= 5 && <span className="ms-1 text-xs">(+{it.delayMin})</span>}</span> : it.status === 'in_consultation' ? <span className="text-xs text-muted">{elapsed}′ / {it.durationMin}′</span> : '—'}</td>
                    <td className="px-4 py-3 tabular-nums">{live && it.ahead != null && it.status !== 'in_consultation' ? it.ahead : '—'}</td>
                    <td className="px-4 py-3"><div className="flex flex-col items-start gap-1"><StatusChip status={it.status} />{late && <span className="text-[11px] font-medium text-[var(--wait-fg)]">{t('q.late')}</span>}</div></td>
                    <td className="px-4 py-3"><RowActions it={it} doctorId={doctorId} run={run} busy={busy} onShare={setShare} /></td>
                  </tr>);
              })}
            </tbody>
          </table>
        </div>
      </Card>
      <ShareModal id={share} onClose={() => setShare(null)} />
    </>
  );
}
export default function Page() { return <Suspense><Queue /></Suspense>; }
