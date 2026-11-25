'use client';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/shell';
import { Button, Card, Field, Input, Modal, Select, Skeleton } from '@/components/ui';
import { usePrefs } from '@/components/providers';
import { api, useLive } from '@/lib/client';

export default function Accounts() {
  const { t, toast } = usePrefs();
  const u = useLive<any[]>('/api/admin/users', null); const cl = useLive<any[]>('/api/admin/clinics', null);
  const [pw, setPw] = useState<{ id: string; value: string } | null>(null); const [add, setAdd] = useState(false);
  const [f, setF] = useState({ clinicId: '', name: '', email: '', password: '', role: 'receptionist' });
  const patch = async (id: string, body: object) => { try { await api(`/api/admin/users/${id}`, { method: 'PATCH', body }); u.reload(); toast(t('common.saved')); } catch (e: any) { toast(e.message, 'err'); } };
  const create = async () => { try { await api('/api/admin/users', { body: f }); setAdd(false); u.reload(); toast(t('common.saved')); } catch (e: any) { toast(e.message, 'err'); } };
  return (
    <>
      <PageHeader title={t('nav.accounts')} right={<Button icon={<Plus className="size-4" />} onClick={() => setAdd(true)}>{t('ad.addUser')}</Button>} />
      <Card className="overflow-x-auto scroll-thin"><table className="w-full min-w-[760px] text-sm">
        <thead className="bg-surface text-xs uppercase text-muted"><tr>{['common.name', 'common.email', 'common.role', 'common.clinic', 'common.status'].map((k) => <th key={k} className="px-4 py-3 text-start font-semibold">{t(k)}</th>)}<th /></tr></thead>
        <tbody className="divide-y divide-line">{!u.data ? <tr><td colSpan={6} className="p-4"><Skeleton className="h-24" /></td></tr> : u.data.map((x) => <tr key={x.id}>
          <td className="px-4 py-3 font-medium">{x.name}</td><td className="px-4 py-3" dir="ltr"><span className="block text-start">{x.email}</span></td><td className="px-4 py-3 capitalize">{x.role.replace('_', ' ')}</td><td className="px-4 py-3">{x.clinic ?? '—'}</td>
          <td className="px-4 py-3"><span className={`chip ${x.active ? 'chip-completed' : 'chip-cancelled'}`}>{x.active ? t('common.enabled') : t('common.disabled')}</span></td>
          <td className="px-4 py-3"><div className="flex justify-end gap-2"><Button size="sm" variant="secondary" onClick={() => setPw({ id: x.id, value: '' })}>{t('ad.resetPw')}</Button><Button size="sm" variant="ghost" onClick={() => patch(x.id, { active: !x.active })}>{x.active ? t('common.disabled') : t('common.enabled')}</Button></div></td></tr>)}</tbody></table></Card>
      <Modal open={!!pw} onClose={() => setPw(null)} title={t('ad.resetPw')}>{pw && <div className="space-y-4"><Field label={t('ad.newPw')}>{(id) => <Input id={id} type="password" autoComplete="new-password" value={pw.value} onChange={(e) => setPw({ ...pw, value: e.target.value })} />}</Field><Button disabled={pw.value.length < 8} className="w-full" onClick={async () => { await patch(pw.id, { password: pw.value }); setPw(null); }}>{t('common.save')}</Button></div>}</Modal>
      <Modal open={add} onClose={() => setAdd(false)} title={t('ad.addUser')}><div className="space-y-4">
        <Field label={t('common.clinic')}>{(id) => <Select id={id} value={f.clinicId} onChange={(e) => setF({ ...f, clinicId: e.target.value })}><option value="">—</option>{cl.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>}</Field>
        <Field label={t('common.name')}>{(id) => <Input id={id} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />}</Field>
        <Field label={t('common.email')}>{(id) => <Input id={id} type="email" dir="ltr" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />}</Field>
        <Field label={t('st.loginPw')}>{(id) => <Input id={id} type="password" autoComplete="new-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />}</Field>
        <Button className="w-full" disabled={!f.clinicId || !f.name || !f.email || f.password.length < 8} onClick={create}>{t('common.create')}</Button></div></Modal>
    </>
  );
}
