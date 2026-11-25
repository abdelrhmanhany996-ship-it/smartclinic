'use client';
import { PageHeader } from '@/components/shell';
import { Card, CardHeader, Skeleton } from '@/components/ui';
import { DoctorScheduleForm } from '@/components/doctor-form';
import { usePrefs } from '@/components/providers';
import { useLive } from '@/lib/client';
export default function Schedule() {
  const { t } = usePrefs();
  const me = useLive<any>('/api/auth/me', null); const c = useLive<any>('/api/clinic', null);
  const doc = c.data?.doctors.find((d: any) => d.id === me.data?.user.doctorId);
  return <><PageHeader title={t('dr.schedule')} /><Card><CardHeader title={doc?.name ?? '…'} /><div className="p-5">{doc ? <DoctorScheduleForm doctor={doc} onSaved={c.reload} /> : <Skeleton className="h-40" />}</div></Card></>;
}
