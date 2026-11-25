'use client';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/shell';
import { Button, Card, Field, Input, Modal, Select, Skeleton } from '@/components/ui';
import { usePrefs } from '@/components/providers';
import { api, useLive } from '@/lib/client';

export default function Clinics() {
  const { t, toast } = usePrefs();
  const c = useLive<any[]>('/api/admin/clinics', null);
  const [open, setOpen] = useState(false); const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ name: '', slug: '', plan: 'trial', ownerName: '', ownerEmail: '', ownerPassword: '', language: 'en' });
  const create = async () => { setBusy(true); try { await api('/api/admin/clinics', { body: f }); setOpen(false); c.reload(); toast(t('common.saved')); } catch (e: any) { toast(e.message, 'err'); } finally { setBusy(false); } };
  const toggle = async (x: any) => { try { await api(`/api/admin/clinics/${x.id}`, { method: 'PATCH', body: { status: x.status === 'active' ? 'suspended' : 'active' } }); c.reload(); } catch (e: any) { toast(e.message, 'err'); } };
  return (
    <>
      <PageHeader title={t('ad.clinics')} right={<Button icon={<Plus className="size-4" />} onClick={() => setOpen(true)}>{t('ad.newClinic')}</Button>} />
      <Card className="overflow-x-auto scroll-thin"><table className="w-full min-w-[760px] text-sm">
        <thead className="bg-surface text-xs uppercase text-muted"><tr>{['common.clinic', 'ad.plan', 'ad.doctors', 'ad.users', 'ad.appts', 'common.status'].map((k) => <th key={k} className="px-4 py-3 text-start font-semibold">{t(k)}</th>)}<th /></tr></thead>
        <tbody className="divide-y divide-line">{!c.data ? <tr><td colSpan={7} className="p-4"><Skeleton className="h-24" /></td></tr> : c.data.map((x) => <tr key={x.id}>
          <td className="px-4 py-3"><span className="me-2 inline-block size-3 rounded-full align-middle" style={{ background: x.brandColor }} /><span className="font-semibold">{x.name}</span><p className="ms-5 text-xs text-muted">{x.slug}</p></td>
          <td className="px-4 py-3 capitalize">{x.plan}</td><td className="px-4 py-3">{x.doctors}</td><td className="px-4 py-3">{x.users}</td><td className="px-4 py-3">{x.appointments}</td>
          <td className="px-4 py-3"><span className={`chip ${x.status === 'active' ? 'chip-completed' : 'chip-cancelled'}`}>{x.status === 'active' ? t('common.enabled') : t('ad.suspended')}</span></td>
          <td className="px-4 py-3 text-end"><Button size="sm" variant={x.status === 'active' ? 'secondary' : 'soft'} onClick={() => toggle(x)}>{x.status === 'active' ? t('ad.suspend') : t('ad.activate')}</Button></td></tr>)}</tbody></table></Card>
      <Modal open={open} onClose={() => setOpen(false)} title={t('ad.newClinic')}>
        <div className="space-y-4">
          <Field label={t('st.name')}>{(id) => <Input id={id} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value, slug: f.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') })} />}</Field>
          <Field label={t('ad.slug')}>{(id) => <Input id={id} dir="ltr" value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} />}</Field>
          <Field label={t('ad.plan')}>{(id) => <Select id={id} value={f.plan} onChange={(e) => setF({ ...f, plan: e.target.value })}>{['trial', 'starter', 'pro', 'enterprise'].map((p) => <option key={p}>{p}</option>)}</Select>}</Field>
          <Field label={t('ad.owner')}>{(id) => <Input id={id} value={f.ownerName} onChange={(e) => setF({ ...f, ownerName: e.target.value })} />}</Field>
          <Field label={t('ad.ownerEmail')}>{(id) => <Input id={id} type="email" dir="ltr" value={f.ownerEmail} onChange={(e) => setF({ ...f, ownerEmail: e.target.value })} />}</Field>
          <Field label={t('st.loginPw')}>{(id) => <Input id={id} type="password" autoComplete="new-password" value={f.ownerPassword} onChange={(e) => setF({ ...f, ownerPassword: e.target.value })} />}</Field>
          <Field label={t('st.msgLang')}>{(id) => <Select id={id} value={f.language} onChange={(e) => setF({ ...f, language: e.target.value })}><option value="en">English</option><option value="ar">العربية</option></Select>}</Field>
          <Button className="w-full" loading={busy} disabled={!f.name || !f.slug || !f.ownerEmail || f.ownerPassword.length < 8 || !f.ownerName} onClick={create}>{t('common.create')}</Button>
        </div>
      </Modal>
    </>
  );
}
