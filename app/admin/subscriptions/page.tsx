'use client';
import { useState } from 'react';
import { PageHeader } from '@/components/shell';
import { Button, Card, Field, Input, Modal, Select, Skeleton } from '@/components/ui';
import { usePrefs } from '@/components/providers';
import { api, useLive } from '@/lib/client';

export default function Subs() {
  const { t, toast } = usePrefs();
  const c = useLive<any[]>('/api/admin/clinics', null); const [e, setE] = useState<any>(null);
  const save = async () => { try { await api(`/api/admin/clinics/${e.id}`, { method: 'PATCH', body: { plan: e.plan, subStatus: e.subStatus, maxDoctors: Number(e.maxDoctors), price: Number(e.price), periodEnd: e.periodEnd } }); setE(null); c.reload(); toast(t('common.saved')); } catch (x: any) { toast(x.message, 'err'); } };
  return (
    <>
      <PageHeader title={t('nav.subscriptions')} />
      <Card className="overflow-x-auto scroll-thin"><table className="w-full min-w-[760px] text-sm">
        <thead className="bg-surface text-xs uppercase text-muted"><tr>{['common.clinic', 'ad.plan', 'ad.subStatus', 'st.maxDoctors', 'ad.price', 'ad.period'].map((k) => <th key={k} className="px-4 py-3 text-start font-semibold">{t(k)}</th>)}<th /></tr></thead>
        <tbody className="divide-y divide-line">{!c.data ? <tr><td colSpan={7} className="p-4"><Skeleton className="h-24" /></td></tr> : c.data.map((x) => <tr key={x.id}>
          <td className="px-4 py-3 font-semibold">{x.name}</td><td className="px-4 py-3 capitalize">{x.plan}</td><td className="px-4 py-3"><span className={`chip ${x.subStatus === 'active' ? 'chip-completed' : x.subStatus === 'trialing' ? 'chip-in_consultation' : 'chip-cancelled'}`}>{x.subStatus}</span></td>
          <td className="px-4 py-3">{x.maxDoctors}</td><td className="px-4 py-3 tabular-nums">{x.price} EGP</td><td className="px-4 py-3 tabular-nums">{x.periodEnd}</td>
          <td className="px-4 py-3 text-end"><Button size="sm" variant="secondary" onClick={() => setE({ ...x })}>{t('ad.edit')}</Button></td></tr>)}</tbody></table></Card>
      <Modal open={!!e} onClose={() => setE(null)} title={e?.name ?? ''}>{e && <div className="space-y-4">
        <Field label={t('ad.plan')}>{(id) => <Select id={id} value={e.plan} onChange={(x) => setE({ ...e, plan: x.target.value })}>{['trial', 'starter', 'pro', 'enterprise'].map((p) => <option key={p}>{p}</option>)}</Select>}</Field>
        <Field label={t('ad.subStatus')}>{(id) => <Select id={id} value={e.subStatus} onChange={(x) => setE({ ...e, subStatus: x.target.value })}>{['active', 'trialing', 'past_due', 'cancelled'].map((p) => <option key={p}>{p}</option>)}</Select>}</Field>
        <Field label={t('st.maxDoctors')}>{(id) => <Input id={id} type="number" min={1} value={e.maxDoctors} onChange={(x) => setE({ ...e, maxDoctors: x.target.value })} />}</Field>
        <Field label={t('ad.price')}>{(id) => <Input id={id} type="number" min={0} value={e.price} onChange={(x) => setE({ ...e, price: x.target.value })} />}</Field>
        <Field label={t('ad.period')}>{(id) => <Input id={id} type="date" value={e.periodEnd} onChange={(x) => setE({ ...e, periodEnd: x.target.value })} />}</Field>
        <Button className="w-full" onClick={save}>{t('common.save')}</Button></div>}</Modal>
    </>
  );
}
