'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, FileText, Hourglass, Play, Stethoscope, Timer, UserRound } from 'lucide-react';
import { PageHeader } from '@/components/shell';
import { Button, Card, CardHeader, Empty, LiveDot, Skeleton, StatTile, StatusChip, Time } from '@/components/ui';
import { usePrefs } from '@/components/providers';
import { useLive } from '@/lib/client';
import { RowActions, useActions } from '@/components/queue-parts';

export default function DoctorHome() {
  const { t } = usePrefs();
  const { data, connected, reload } = useLive<any>('/api/queue', '/api/events', { poll: 15000 });
  const { run, busy } = useActions(reload);
  const [now, setNow] = useState(Date.now()); useEffect(() => { const x = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(x); }, []);
  const items: any[] = data?.items ?? [];
  const current = items.find((i) => i.status === 'in_consultation');
  const next = items.filter((i) => ['booked', 'checked_in'].includes(i.status)).sort((a, b) => (a.ahead ?? 0) - (b.ahead ?? 0))[0];
  const secs = current?.startedAt ? Math.max(0, Math.floor((now - new Date(current.startedAt).getTime()) / 1000)) : 0;
  const mm = String(Math.floor(secs / 60)).padStart(2, '0'), ss = String(secs % 60).padStart(2, '0');
  const over = current && secs / 60 > current.durationMin;
  return (
    <>
      <PageHeader title={t('dr.title')} sub={data?.doctor.name} right={<LiveDot ok={connected} />} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile tone="teal" icon={<Stethoscope />} label={t('dr.today')} value={data ? items.filter((i) => i.status !== 'cancelled').length : '–'} />
        <StatTile tone="amber" icon={<Hourglass />} label={t('dr.queueLeft')} value={data ? items.filter((i) => ['booked', 'checked_in'].includes(i.status)).length : '–'} />
        <StatTile tone="green" icon={<CheckCircle2 />} label={t('dr.doneToday')} value={data ? items.filter((i) => i.status === 'completed').length : '–'} />
        <StatTile tone="blue" icon={<Timer />} label={t('q.avgConsult')} value={data ? `${data.doctor.effectiveAvg}′` : '–'} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className={current ? 'border-primary/50 ring-1 ring-primary/30' : ''}>
          <CardHeader title={t('dr.current')} right={current && <StatusChip status="in_consultation" />} />
          {!data ? <Skeleton className="m-5 h-32" /> : current ? <div className="p-6">
            <div className="flex items-center gap-4"><span className="grid size-16 place-items-center rounded-2xl bg-primary text-xl font-bold text-primary-fg">{current.ticket}</span>
              <div><Link href={`/doctor/patients/${current.patientId}?appt=${current.id}`} className="text-2xl font-bold hover:text-primary hover:underline">{current.patient}</Link><p className="text-sm text-muted">{t(`visit.${current.visitType}`)}</p></div></div>
            <div className="mt-5 flex items-end justify-between"><div><p className="text-xs text-muted">{t('dr.elapsed')}</p><p className={`text-4xl font-bold tabular-nums ${over ? 'text-[var(--wait-fg)]' : ''}`}>{mm}:{ss}</p></div>
              <div className="flex gap-2"><Link href={`/doctor/patients/${current.patientId}?appt=${current.id}`}><Button size="lg" variant="secondary" icon={<FileText className="size-5" />}>{t('dr.openRecord')}</Button></Link><Button size="lg" icon={<CheckCircle2 className="size-5" />} loading={busy === current.id + 'end'} onClick={() => run(current.id, 'end')}>{t('act.end')}</Button></div></div></div>
            : <Empty icon={<UserRound className="size-10" />} title={t('dr.noCurrent')} />}
        </Card>
        <Card>
          <CardHeader title={t('dr.next')} />
          {!data ? <Skeleton className="m-5 h-32" /> : next ? <div className="p-6">
            <div className="flex items-center gap-4"><span className="grid size-16 place-items-center rounded-2xl bg-primary-soft text-xl font-bold text-primary">{next.ticket}</span>
              <div><Link href={`/doctor/patients/${next.patientId}?appt=${next.id}`} className="text-2xl font-bold hover:text-primary hover:underline">{next.patient}</Link><p className="text-sm text-muted"><Time v={next.time} /> · {t(`status.${next.status}`)}{next.delayMin >= 5 && ` · +${next.delayMin} ${t('common.min')}`}</p></div></div>
            <div className="mt-5 flex justify-end"><Button size="lg" disabled={!!current} icon={<Play className="size-5" />} loading={busy === next.id + 'start'} onClick={() => run(next.id, 'start')}>{t('dr.startNext')}</Button></div></div>
            : <Empty icon={<UserRound className="size-10" />} title={t('dr.noNext')} />}
        </Card>
      </div>
      <Card className="mt-6">
        <CardHeader title={t('dr.today')} />
        <div className="divide-y divide-line">
          {!data ? <Skeleton className="m-5 h-32" /> : items.length === 0 ? <Empty title={t('q.empty')} /> : items.map((i) => (
            <div key={i.id} className="flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-3.5">
              <span className="w-20 font-semibold tabular-nums"><Time v={i.time} /></span><span className="w-16 font-bold">{i.ticket}</span>
              <div className="min-w-40 flex-1"><Link href={`/doctor/patients/${i.patientId}?appt=${i.id}`} className="font-medium hover:text-primary hover:underline">{i.patient}</Link><p dir="auto" className="text-xs text-muted">{t(`visit.${i.visitType}`)}{i.reason && ` — ${i.reason}`}{i.estTime && ` · ${t('q.est')} `}{i.estTime && <Time v={i.estTime} />}</p></div>
              <StatusChip status={i.status} />
              <div className="w-full sm:w-auto"><RowActions it={i} doctorId={data.doctor.id} run={run} busy={busy} role="doctor" labeled /></div>
            </div>))}
        </div>
      </Card>
    </>
  );
}
