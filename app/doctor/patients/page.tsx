'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Plus, Search } from 'lucide-react';
import { PageHeader } from '@/components/shell';
import { Button, Card, Empty, Input, Skeleton } from '@/components/ui';
import { AddPatientModal } from '@/components/patient-form';
import { usePrefs } from '@/components/providers';
import { useLive } from '@/lib/client';
import { ageOf } from '@/components/rx-print';

export default function DoctorPatients() {
  const { t } = usePrefs(); const router = useRouter();
  const [q, setQ] = useState(''); const [add, setAdd] = useState(false);
  const { data } = useLive<any[]>(`/api/patients?q=${encodeURIComponent(q)}`, null);
  return (
    <>
      <PageHeader title={t('dr.patients')} right={<><div className="relative"><Search className="pointer-events-none absolute start-3 top-3 size-4 text-muted" /><Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('dr.searchPatients')} className="!w-72 ps-9" /></div>
        <Button icon={<Plus className="size-4" />} onClick={() => setAdd(true)}>{t('pt.addPatient')}</Button></>} />
      <Card className="divide-y divide-line">
        {!data ? <div className="p-5"><Skeleton className="h-32" /></div> : data.length === 0 ? <Empty title={t('dr.noPatients')} /> : data.map((p) => {
          const age = ageOf(p.birthDate);
          return <Link key={p.id} href={`/doctor/patients/${p.id}`} className="flex flex-wrap items-center gap-x-5 gap-y-1 px-5 py-3.5 transition hover:bg-surface">
            <span className="grid size-10 place-items-center rounded-full bg-primary-soft font-bold text-primary">{p.fullName[0]}</span>
            <div className="min-w-44 flex-1"><p className="font-semibold">{p.fullName}</p><p dir="ltr" className="text-start text-xs text-muted">{p.phone}{age != null && ` · ${age} ${t('pt.years')}`}</p></div>
            {p.allergies && <span className="chip chip-cancelled"><AlertTriangle className="size-3" />{p.allergies}</span>}
            <span className="text-sm text-muted">{t('pt.visits')}: <b className="text-ink">{p.visits}</b></span><span className="w-28 text-end text-sm text-muted tabular-nums">{p.lastVisit ?? '—'}</span></Link>; })}
      </Card>
      <AddPatientModal medical open={add} onClose={() => setAdd(false)} onCreated={(id) => router.push(`/doctor/patients/${id}`)} />
    </>
  );
}
