'use client';
import { useEffect, useState } from 'react';
import { Building2, ClipboardList, CreditCard, Palette, Stethoscope, Timer } from 'lucide-react';
import { PageHeader } from '@/components/shell';
import { Button, Card, CardHeader, Field, Input, Modal, Select, Skeleton, cx } from '@/components/ui';
import { usePrefs } from '@/components/providers';
import { api, useLive } from '@/lib/client';
import { useClinic } from '@/components/useClinic';
import { DoctorScheduleForm } from '@/components/doctor-form';
import { ago } from '@/lib/format';

const TABS = [['clinic', 'st.clinic', Building2], ['branding', 'st.branding', Palette], ['queue', 'st.queue', Timer], ['doctors', 'st.doctors', Stethoscope], ['audit', 'st.audit', ClipboardList], ['sub', 'st.subscription', CreditCard]] as const;

export default function Settings() {
  const { t, toast, locale } = usePrefs();
  const c = useClinic();
  const [tab, setTab] = useState<string>('clinic');
  const [f, setF] = useState<any>(null);
  useEffect(() => { if (c.data && !f) { const x = c.data.clinic; setF({ name: x.name, nameAr: x.name_ar ?? '', tagline: x.tagline ?? '', address: x.address ?? '', phone: x.phone ?? '', email: x.email ?? '', brandColor: x.brand_color, timezone: x.timezone, s: { ...x.settings } }); } }, [c.data, f]);
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try {
      const s = f.s;
      await api('/api/clinic', { method: 'PATCH', body: { name: f.name, nameAr: f.nameAr, tagline: f.tagline, address: f.address, phone: f.phone, email: f.email, brandColor: f.brandColor, timezone: f.timezone,
        settings: { notify_ahead_threshold: Number(s.notify_ahead_threshold), delay_notify_minutes: Number(s.delay_notify_minutes), country_code: String(s.country_code), slot_capacity: Number(s.slot_capacity), language: s.language } } });
      toast(t('common.saved')); c.reload();
    } catch (e: any) { toast(e.message, 'err'); } finally { setBusy(false); }
  };
  const audit = useLive<any[]>(tab === 'audit' ? '/api/audit' : null, null);
  const [edit, setEdit] = useState<any>(null); const [add, setAdd] = useState(false);
  const [nd, setNd] = useState({ name: '', specialty: '', avg: 15, email: '', password: '' });
  const addDoctor = async () => { try { await api('/api/doctors', { body: { ...nd, avg: Number(nd.avg), email: nd.email || undefined, password: nd.password || undefined, specialty: nd.specialty || undefined } }); setAdd(false); setNd({ name: '', specialty: '', avg: 15, email: '', password: '' }); c.reload(); toast(t('common.saved')); } catch (e: any) { toast(e.message, 'err'); } };
  const set = (k: string, v: any) => setF((x: any) => ({ ...x, [k]: v })); const setS = (k: string, v: any) => setF((x: any) => ({ ...x, s: { ...x.s, [k]: v } }));
  const saveBar = <div className="pt-2"><Button onClick={save} loading={busy}>{t('common.save')}</Button></div>;
  return (
    <>
      <PageHeader title={t('st.title')} />
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="flex gap-1 overflow-x-auto scroll-thin lg:flex-col" aria-label="Settings">
          {TABS.map(([k, label, I]) => <button key={k} onClick={() => setTab(k)} aria-current={tab === k} className={cx('flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition [&>svg]:size-[18px]', tab === k ? 'bg-primary-soft text-primary' : 'text-muted hover:bg-surface hover:text-ink')}><I />{t(label)}</button>)}
        </nav>
        <div>
          {!f ? <Skeleton className="h-64" /> : <>
            {tab === 'clinic' && <Card><CardHeader title={t('st.clinic')} /><div className="grid gap-4 p-5 sm:grid-cols-2">
              <Field label={t('st.name')}>{(id) => <Input id={id} value={f.name} onChange={(e) => set('name', e.target.value)} />}</Field>
              <Field label={t('st.nameAr')}>{(id) => <Input id={id} dir="rtl" value={f.nameAr} onChange={(e) => set('nameAr', e.target.value)} />}</Field>
              <Field label={t('st.phone')}>{(id) => <Input id={id} dir="ltr" value={f.phone} onChange={(e) => set('phone', e.target.value)} />}</Field>
              <Field label={t('st.email')}>{(id) => <Input id={id} type="email" dir="ltr" value={f.email} onChange={(e) => set('email', e.target.value)} />}</Field>
              <div className="sm:col-span-2"><Field label={t('st.address')}>{(id) => <Input id={id} value={f.address} onChange={(e) => set('address', e.target.value)} />}</Field></div>
              <Field label={t('st.tz')}>{(id) => <Input id={id} dir="ltr" value={f.timezone} onChange={(e) => set('timezone', e.target.value)} />}</Field>
              <Field label={t('st.cc')}>{(id) => <Input id={id} dir="ltr" value={f.s.country_code} onChange={(e) => setS('country_code', e.target.value)} />}</Field>
              <div className="sm:col-span-2">{saveBar}</div></div></Card>}
            {tab === 'branding' && <Card><CardHeader title={t('st.branding')} /><div className="grid gap-4 p-5 sm:grid-cols-2">
              <Field label={t('st.tagline')}>{(id) => <Input id={id} value={f.tagline} onChange={(e) => set('tagline', e.target.value)} />}</Field>
              <Field label={t('st.color')}>{(id) => <div className="flex gap-2"><input id={id} type="color" value={f.brandColor} onChange={(e) => set('brandColor', e.target.value)} className="h-10 w-14 cursor-pointer rounded-lg border border-line bg-transparent" /><Input dir="ltr" value={f.brandColor} onChange={(e) => set('brandColor', e.target.value)} /></div>}</Field>
              <div className="rounded-2xl p-6 text-white sm:col-span-2" style={{ background: f.brandColor }}><p className="text-2xl font-bold">{locale === 'ar' && f.nameAr ? f.nameAr : f.name}</p><p className="opacity-90">{f.tagline}</p></div>
              <div className="sm:col-span-2">{saveBar}</div></div></Card>}
            {tab === 'queue' && <Card><CardHeader title={t('st.queue')} /><div className="grid gap-4 p-5 sm:grid-cols-2">
              <Field label={t('st.threshold')} hint={t('st.thresholdHint')}>{(id) => <Input id={id} type="number" min={1} max={10} value={f.s.notify_ahead_threshold} onChange={(e) => setS('notify_ahead_threshold', e.target.value)} />}</Field>
              <Field label={t('st.delayMin')}>{(id) => <Input id={id} type="number" min={5} max={120} value={f.s.delay_notify_minutes} onChange={(e) => setS('delay_notify_minutes', e.target.value)} />}</Field>
              <Field label={t('st.capacity')}>{(id) => <Input id={id} type="number" min={1} max={5} value={f.s.slot_capacity} onChange={(e) => setS('slot_capacity', e.target.value)} />}</Field>
              <Field label={t('st.msgLang')}>{(id) => <Select id={id} value={f.s.language} onChange={(e) => setS('language', e.target.value)}><option value="en">English</option><option value="ar">العربية</option></Select>}</Field>
              <div className="sm:col-span-2">{saveBar}</div></div></Card>}
            {tab === 'doctors' && <Card><CardHeader title={t('st.doctors')} right={<Button size="sm" onClick={() => setAdd(true)}>{t('st.addDoctor')}</Button>} />
              <div className="divide-y divide-line">{c.data?.doctors.map((d) => <div key={d.id} className="flex items-center gap-4 px-5 py-4"><span className="grid size-11 place-items-center rounded-xl bg-primary-soft font-bold text-primary">{d.code}</span>
                <div className="flex-1"><p className="font-semibold">{c.docName(d)} {!d.active && <span className="chip chip-skipped ms-2">{t('common.disabled')}</span>}</p><p className="text-xs text-muted">{c.docSpec(d)} · {d.avg_duration_min} {t('common.min')} · {d.work_start.slice(0, 5)}–{d.work_end.slice(0, 5)}</p></div>
                <Button size="sm" variant="secondary" onClick={() => setEdit(d)}>{t('ad.edit')}</Button></div>)}</div></Card>}
            {tab === 'audit' && <Card><CardHeader title={t('st.audit')} /><div className="max-h-[560px] divide-y divide-line overflow-auto scroll-thin">{!audit.data ? <Skeleton className="m-5 h-32" /> : audit.data.map((l) => <div key={l.id} className="flex flex-wrap items-center gap-3 px-5 py-2.5 text-sm"><code className="rounded bg-surface px-2 py-0.5 text-xs">{l.action}</code><span className="flex-1 text-muted">{l.user ?? '—'}</span><span className="text-xs text-muted">{ago(l.createdAt, locale)}</span></div>)}</div></Card>}
            {tab === 'sub' && <Card><CardHeader title={t('st.subscription')} /><div className="grid gap-4 p-5 sm:grid-cols-3">{c.data?.subscription ? <>
              <div><p className="text-xs text-muted">{t('st.plan')}</p><p className="text-xl font-bold capitalize">{c.data.subscription.plan}</p></div>
              <div><p className="text-xs text-muted">{t('st.maxDoctors')}</p><p className="text-xl font-bold">{c.data.subscription.max_doctors}</p></div>
              <div><p className="text-xs text-muted">{t('st.renews')}</p><p className="text-xl font-bold">{String(c.data.subscription.current_period_end).slice(0, 10)}</p></div></> : null}</div></Card>}
          </>}
        </div>
      </div>
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit ? c.docName(edit) : ''} wide>{edit && <DoctorScheduleForm doctor={edit} isAdmin onSaved={() => { setEdit(null); c.reload(); }} />}</Modal>
      <Modal open={add} onClose={() => setAdd(false)} title={t('st.addDoctor')}>
        <div className="space-y-4"><Field label={t('st.docName')}>{(id) => <Input id={id} value={nd.name} onChange={(e) => setNd({ ...nd, name: e.target.value })} />}</Field>
          <Field label={t('st.docSpec')}>{(id) => <Input id={id} value={nd.specialty} onChange={(e) => setNd({ ...nd, specialty: e.target.value })} />}</Field>
          <Field label={t('st.avg')}>{(id) => <Input id={id} type="number" min={3} value={nd.avg} onChange={(e) => setNd({ ...nd, avg: e.target.value as any })} />}</Field>
          <Field label={t('st.loginEmail')}>{(id) => <Input id={id} type="email" dir="ltr" value={nd.email} onChange={(e) => setNd({ ...nd, email: e.target.value })} />}</Field>
          <Field label={t('st.loginPw')}>{(id) => <Input id={id} type="password" autoComplete="new-password" value={nd.password} onChange={(e) => setNd({ ...nd, password: e.target.value })} />}</Field>
          <Button className="w-full" disabled={nd.name.length < 2} onClick={addDoctor}>{t('common.create')}</Button></div>
      </Modal>
    </>
  );
}
