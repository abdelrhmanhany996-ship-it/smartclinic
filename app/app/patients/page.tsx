'use client';
import { useState } from 'react';
import Link from 'next/link';
import { MessageCircle, Plus, Search, UserPlus } from 'lucide-react';
import { AddPatientModal } from '@/components/patient-form';
import { PageHeader } from '@/components/shell';
import { Button, Card, Empty, Input, Modal, Skeleton, StatusChip, Textarea, Time } from '@/components/ui';
import { usePrefs } from '@/components/providers';
import { api, useLive } from '@/lib/client';
import { useClinic } from '@/components/useClinic';

export default function Patients() {
  const { t, toast } = usePrefs();
  const clinicCtx = useClinic();
  const [addOpen, setAddOpen] = useState(false);
  const [q, setQ] = useState(''); const [open, setOpen] = useState<string | null>(null);
  const { data, reload } = useLive<any[]>(`/api/patients?q=${encodeURIComponent(q)}`, null);
  const det = useLive<any>(open ? `/api/patients/${open}` : null, null);
  const [notes, setNotes] = useState<string | null>(null);
  const save = async () => { try { await api(`/api/patients/${open}`, { method: 'PATCH', body: { notes } }); toast(t('common.saved')); } catch (e: any) { toast(e.message, 'err'); } };
  return (
    <>
      <PageHeader title={t('pt.title')} right={<><Button icon={<Plus className="size-4" />} onClick={() => setAddOpen(true)}>{t('pt.addPatient')}</Button><div className="relative"><Search className="pointer-events-none absolute start-3 top-3 size-4 text-muted" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('common.search')} className="!w-64 ps-9" /></div></>} />
      <AddPatientModal open={addOpen} onClose={() => setAddOpen(false)} doctors={clinicCtx.data?.doctors ?? []} today={clinicCtx.data?.today ?? new Date().toISOString().slice(0, 10)} onCreated={() => reload()} />
      <Card className="overflow-x-auto scroll-thin">
        <table className="w-full min-w-[700px] text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wide text-muted"><tr>{['common.name', 'common.phone', 'pt.visits', 'pt.noShows', 'pt.last'].map((k) => <th key={k} className="px-4 py-3 text-start font-semibold">{t(k)}</th>)}<th /></tr></thead>
          <tbody className="divide-y divide-line">
            {!data ? <tr><td colSpan={6} className="p-4"><Skeleton className="h-24" /></td></tr> : data.length === 0 ? <tr><td colSpan={6}><Empty title={t('pt.empty')} /></td></tr> : data.map((p) => (
              <tr key={p.id} className="cursor-pointer hover:bg-surface" onClick={() => { setOpen(p.id); setNotes(null); }}>
                <td className="px-4 py-3 font-medium"><span className="me-3 inline-grid size-8 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary">{p.fullName[0]}</span>{p.fullName}</td>
                <td className="px-4 py-3" dir="ltr"><span className="block text-start">{p.phone}</span></td><td className="px-4 py-3 tabular-nums">{p.visits}</td>
                <td className="px-4 py-3 tabular-nums">{p.noShows}</td><td className="px-4 py-3 tabular-nums">{p.lastVisit ?? '—'}</td>
                <td className="px-4 py-3 text-end"><Link href={`/app/new?name=${encodeURIComponent(p.fullName)}&phone=${p.phone}`} onClick={(e) => e.stopPropagation()}><Button size="sm" variant="soft" icon={<UserPlus className="size-4" />}>{t('pt.add')}</Button></Link></td></tr>))}
          </tbody>
        </table>
      </Card>
      <Modal open={!!open} onClose={() => setOpen(null)} title={det.data?.patient.fullName ?? '…'} wide>
        {det.data && <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3"><p dir="ltr" className="text-start text-sm text-muted">{det.data.patient.phone}</p><a href={`https://wa.me/${String(det.data.patient.phone).replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#25D366] px-3 text-sm font-semibold text-[#06361b] hover:brightness-105"><MessageCircle className="size-4" />{t('act.whatsapp')}</a></div>
          <div><p className="mb-2 text-sm font-semibold">{t('pt.notes')}</p><Textarea value={notes ?? det.data.patient.notes ?? ''} onChange={(e) => setNotes(e.target.value)} maxLength={1000} /><Button size="sm" className="mt-2" onClick={save}>{t('common.save')}</Button></div>
          <div><p className="mb-2 text-sm font-semibold">{t('pt.history')}</p><div className="max-h-64 divide-y divide-line overflow-auto rounded-xl border border-line">
            {det.data.visits.map((v: any) => <div key={v.id} className="flex flex-wrap items-center gap-3 px-3 py-2 text-sm"><span className="w-24 tabular-nums">{v.date}</span><span className="w-20 tabular-nums"><Time v={v.time} /></span><span className="flex-1 text-muted">{v.doctor} · {t(`visit.${v.visitType}`)}</span><StatusChip status={v.status} /></div>)}</div></div>
        </div>}
      </Modal>
    </>
  );
}
