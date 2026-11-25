'use client';
import Link from 'next/link';
import { Building2, CalendarDays, CircleDollarSign, Stethoscope, Users } from 'lucide-react';
import { PageHeader } from '@/components/shell';
import { Card, CardHeader, Skeleton, StatTile } from '@/components/ui';
import { usePrefs } from '@/components/providers';
import { useLive } from '@/lib/client';

export default function Admin() {
  const { t } = usePrefs();
  const s = useLive<any>('/api/admin/stats', null, { poll: 20000 });
  const c = useLive<any[]>('/api/admin/clinics', null);
  return (
    <>
      <PageHeader title={t('ad.title')} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {!s.data ? [0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />) : <>
          <StatTile tone="teal" icon={<Building2 />} label={t('ad.activeClinics')} value={`${s.data.active_clinics}/${s.data.clinics}`} />
          <StatTile tone="blue" icon={<Users />} label={t('ad.users')} value={s.data.users} />
          <StatTile tone="green" icon={<Stethoscope />} label={t('ad.doctors')} value={s.data.doctors} />
          <StatTile tone="amber" icon={<CalendarDays />} label={t('ad.appts')} value={s.data.appointments_total} />
          <StatTile tone="teal" icon={<CircleDollarSign />} label={t('ad.mrr')} value={`${s.data.mrr.toLocaleString()} EGP`} /></>}
      </div>
      <Card className="mt-6"><CardHeader title={t('ad.clinics')} right={<Link href="/admin/clinics" className="text-sm font-semibold text-primary">{t('common.view')}</Link>} />
        <div className="divide-y divide-line">{c.data?.map((x) => <div key={x.id} className="flex flex-wrap items-center gap-4 px-5 py-3.5"><span className="size-3 rounded-full" style={{ background: x.brandColor }} /><div className="min-w-40 flex-1"><p className="font-semibold">{x.name}</p><p className="text-xs text-muted">{x.slug}</p></div>
          <span className="text-sm text-muted">{x.doctors} {t('ad.doctors')} · {x.appointments} {t('ad.appts')}</span><span className={`chip ${x.status === 'active' ? 'chip-completed' : 'chip-cancelled'}`}>{x.status === 'active' ? t('common.enabled') : t('ad.suspended')}</span></div>)}</div></Card>
    </>
  );
}
