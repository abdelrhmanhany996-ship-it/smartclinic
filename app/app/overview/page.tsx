'use client';
import Link from 'next/link';
import { CalendarDays, CheckCircle2, Hourglass, Stethoscope, UserRoundX, Clock } from 'lucide-react';
import { PageHeader } from '@/components/shell';
import { Button, Card, CardHeader, Empty, LiveDot, Skeleton, StatTile, StatusChip, Time } from '@/components/ui';
import { usePrefs } from '@/components/providers';
import { useLive } from '@/lib/client';
import { useClinic } from '@/components/useClinic';

export default function Overview() {
  const { t, locale } = usePrefs();
  const { docName } = useClinic();
  const { data, connected } = useLive<any>('/api/overview', '/api/events');
  const sched = useLive<any>('/api/appointments?date=' + new Date().toLocaleDateString('en-CA'), '/api/events');
  const date = new Date().toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  return (
    <>
      <PageHeader title={t('ov.title')} sub={date} right={<><LiveDot ok={connected} /><Link href="/app/new"><Button>{t('nav.new')}</Button></Link></>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {!data ? [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />) : <>
          <StatTile tone="teal" icon={<CalendarDays />} label={t('ov.appointments')} value={data.total} />
          <StatTile tone="amber" icon={<Hourglass />} label={t('ov.waiting')} value={data.waiting} />
          <StatTile tone="blue" icon={<Stethoscope />} label={t('ov.inConsult')} value={data.inConsultation} />
          <StatTile tone="green" icon={<CheckCircle2 />} label={t('ov.completed')} value={data.completed} />
        </>}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title={t('ov.doctors')} />
          <div className="divide-y divide-line">
            {!data ? <div className="p-5"><Skeleton className="h-20" /></div> : data.queues.map((q: any) => (
              <div key={q.doctor.id} className="flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4">
                <div className="flex min-w-44 items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-primary-soft text-lg font-bold text-primary">{q.doctor.code}</span>
                  <div><p className="font-semibold">{docName(q.doctor)}</p><p className="text-xs text-muted">{q.waiting} {t('ov.waitingCount')}</p></div></div>
                <div className="min-w-40 flex-1 text-sm"><p className="text-xs text-muted">{t('ov.current')}</p>{q.current ? <p className="font-semibold">{q.current.ticket} · {q.current.patient}</p> : <p className="text-muted">{t('ov.idle')}</p>}</div>
                <div className="min-w-40 flex-1 text-sm"><p className="text-xs text-muted">{t('ov.next')}</p>{q.next ? <p className="font-semibold">{q.next.ticket} · {q.next.patient} <span className="font-normal text-muted">(<Time v={q.next.estTime} />)</span></p> : <p className="text-muted">{t('ov.noNext')}</p>}</div>
                <span className={`chip ${q.delayMin >= 10 ? 'chip-cancelled' : 'chip-completed'}`}><Clock className="size-3" />{q.delayMin >= 10 ? `${t('ov.delay')} +${q.delayMin} ${t('common.min')}` : t('ov.onTime')}</span>
                <Link href={`/app/queue?doctor=${q.doctor.id}`}><Button variant="secondary" size="sm">{t('ov.openQueue')}</Button></Link>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader title={t('ov.schedule')} right={data && data.noShow > 0 ? <span className="chip chip-no_show"><UserRoundX className="size-3" />{data.noShow} {t('ov.noShow')}</span> : null} />
          <div className="max-h-[520px] divide-y divide-line overflow-auto scroll-thin">
            {!sched.data ? <div className="p-5"><Skeleton className="h-32" /></div> : sched.data.length === 0 ? <Empty title={t('cal.noAppts')} /> : sched.data.map((a: any) => (
              <div key={a.id} className="flex items-center gap-3 px-5 py-3"><span className="w-16 text-sm font-semibold tabular-nums"><Time v={a.time} /></span>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{a.patient}</p><p className="text-xs text-muted">{a.ticket} · {a.doctor}</p></div><StatusChip status={a.status} /></div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
