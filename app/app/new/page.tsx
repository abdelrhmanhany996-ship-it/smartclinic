'use client';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CalendarCheck2, CheckCircle2, MessageCircle, Send, Copy, ExternalLink } from 'lucide-react';
import { PageHeader } from '@/components/shell';
import { Button, Card, CardHeader, Field, Input, Select, Time, Skeleton, cx } from '@/components/ui';
import { usePrefs } from '@/components/providers';
import { api } from '@/lib/client';
import { useClinic } from '@/components/useClinic';

function NewAppointment() {
  const { t, toast, locale } = usePrefs();
  const clinic = useClinic();
  const sp = useSearchParams();
  const [doctorId, setDoctorId] = useState(''); const [date, setDate] = useState(''); const [time, setTime] = useState('');
  const [slots, setSlots] = useState<{ time: string; available: boolean; reason?: string }[] | null>(null); const [dayOff, setDayOff] = useState(false);
  const [name, setName] = useState(sp.get('name') ?? ''); const [phone, setPhone] = useState(sp.get('phone') ?? '');
  const [visit, setVisit] = useState('consultation'); const [channel, setChannel] = useState<'whatsapp' | 'telegram' | 'link'>('whatsapp');
  const [known, setKnown] = useState(false); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const [done, setDone] = useState<any>(null); const [lang, setLang] = useState<string>('');

  useEffect(() => { if (clinic.data) { if (!doctorId) setDoctorId(clinic.data.doctors.find((d) => d.active)?.id ?? ''); if (!date) setDate(clinic.data.today); if (!lang) setLang(clinic.data.clinic.settings.language); } }, [clinic.data, doctorId, date, lang]);
  const loadSlots = async () => { if (!doctorId || !date) return; setSlots(null); try { const r = await api(`/api/slots?doctorId=${doctorId}&date=${date}`); setSlots(r.slots); setDayOff(r.dayOff); } catch (e: any) { setSlots([]); toast(e.message, 'err'); } };
  useEffect(() => { setTime(''); loadSlots(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [doctorId, date]);
  useEffect(() => { // autofill existing patient by phone
    const d = phone.replace(/\D/g, ''); if (d.length < 8) { setKnown(false); return; }
    const h = setTimeout(async () => { const r = await api<any[]>(`/api/patients?q=${encodeURIComponent(d.replace(/^0/, ''))}`).catch(() => []); const m = r.find((p) => p.phone.endsWith(d.replace(/^0/, ''))); if (m) { setKnown(true); if (!name) setName(m.fullName); setChannel(m.channel); } else setKnown(false); }, 350);
    return () => clearTimeout(h);
  }, [phone]); // eslint-disable-line

  const submit = async () => {
    setBusy(true); setErr('');
    try { const r = await api('/api/appointments', { body: { fullName: name, phone, date, time, doctorId, visitType: visit, channel } }); setDone(r); if (lang !== r.lang) changeLang(lang, r.id); }
    catch (e: any) { setErr(e.message); loadSlots(); } finally { setBusy(false); }
  };
  const changeLang = async (l: string, id = done?.id) => { setLang(l); setDone(await api(`/api/appointments/${id}/share?lang=${l}`)); };
  const copy = async () => { try { await navigator.clipboard.writeText(done.link); } catch { const i = document.createElement('input'); i.value = done.link; document.body.appendChild(i); i.select(); document.execCommand('copy'); i.remove(); } toast(t('common.copied')); };
  const reset = () => { setDone(null); setName(''); setPhone(''); setTime(''); setKnown(false); loadSlots(); };
  const doc = clinic.data?.doctors.find((d) => d.id === doctorId);
  const vt: any[] = clinic.data?.clinic.settings.visit_types ?? [];

  if (done) return (
    <div className="mx-auto max-w-2xl slide-up">
      <Card className="overflow-hidden">
        <div className="bg-primary px-6 py-8 text-center text-primary-fg"><CheckCircle2 className="mx-auto size-12" /><h1 className="mt-3 text-2xl font-bold">{t('conf.title')}</h1><p className="mt-1 text-sm opacity-90">{t('conf.sub')}</p></div>
        <div className="grid grid-cols-3 divide-x divide-line border-b border-line text-center rtl:divide-x-reverse">
          <div className="p-4"><p className="text-xs text-muted">{t('conf.queue')}</p><p className="text-3xl font-bold text-primary">{done.ticket}</p></div>
          <div className="p-4"><p className="text-xs text-muted">{t('common.time')}</p><p className="text-lg font-bold"><Time v={done.time} /></p><p className="text-xs text-muted">{done.date}</p></div>
          <div className="p-4"><p className="text-xs text-muted">{t('common.doctor')}</p><p className="text-lg font-bold">{done.doctor}</p></div>
        </div>
        <div className="space-y-4 p-6">
          <div className="flex items-center justify-between gap-3"><h2 className="font-semibold">{t('conf.preview')}</h2>
            <Select value={lang} onChange={(e) => changeLang(e.target.value)} className="!w-auto" aria-label={t('conf.lang')}><option value="en">English</option><option value="ar">العربية</option></Select></div>
          <pre dir="auto" className="max-h-56 overflow-auto whitespace-pre-wrap rounded-xl bg-surface p-4 font-sans text-sm leading-relaxed">{done.message}</pre>
          <div className="grid gap-3 sm:grid-cols-3">
            <a href={done.whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#25D366] text-sm font-bold text-[#06361b] hover:brightness-105"><MessageCircle className="size-5" />{locale === 'ar' ? 'إرسال واتساب' : 'Send WhatsApp'}</a>
            <a href={done.telegramUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#229ED9] text-sm font-bold text-white hover:brightness-105"><Send className="size-5" />{locale === 'ar' ? 'إرسال تيليجرام' : 'Send Telegram'}</a>
            <Button variant="secondary" size="lg" icon={<Copy className="size-5" />} onClick={copy}>{locale === 'ar' ? 'نسخ رابط الموعد' : 'Copy Appointment Link'}</Button>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2 text-xs"><span className="text-muted">{t('conf.link')}</span><code dir="ltr" className="min-w-0 flex-1 truncate">{done.link}</code><a href={done.link} target="_blank" rel="noopener" aria-label="Open"><ExternalLink className="size-4 text-primary" /></a></div>
          <p className="text-xs text-muted">{t('conf.hint')}</p>
          <div className="flex flex-wrap justify-end gap-2 pt-2"><Button variant="secondary" onClick={reset}>{t('conf.another')}</Button><Link href={`/app/queue?doctor=${doctorId}`}><Button>{t('conf.openQueue')}</Button></Link></div>
        </div>
      </Card>
    </div>
  );

  const canSubmit = name.trim().length >= 2 && phone.replace(/\D/g, '').length >= 8 && time && doctorId;
  return (
    <>
      <PageHeader title={t('new.title')} sub={t('new.sub')} />
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader title={`1. ${t('new.step1')}`} />
          <div className="space-y-5 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('common.doctor')}>{(id) => <Select id={id} value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>{clinic.data?.doctors.filter((d) => d.active).map((d) => <option key={d.id} value={d.id}>{clinic.docName(d)} — {clinic.docSpec(d)}</option>)}</Select>}</Field>
              <Field label={t('common.date')}>{(id) => <Input id={id} type="date" min={clinic.data?.today} value={date} onChange={(e) => setDate(e.target.value)} />}</Field>
            </div>
            <div><p className="mb-2 text-sm font-medium">{t('new.slots')}</p>
              {slots === null ? <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">{Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
                : dayOff ? <p className="rounded-lg bg-surface p-4 text-sm text-muted">{t('new.dayOff')}</p>
                : !slots.some((s) => s.available) ? <p className="rounded-lg bg-surface p-4 text-sm text-muted">{t('new.noSlots')}</p>
                : <div role="radiogroup" aria-label={t('new.slots')} className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-5">
                  {slots.map((s) => <button key={s.time} role="radio" aria-checked={time === s.time} disabled={!s.available} onClick={() => setTime(s.time)} title={s.reason ? t(`new.slot${s.reason[0].toUpperCase() + s.reason.slice(1)}`) : ''}
                    className={cx('h-11 rounded-lg border text-sm font-semibold tabular-nums transition', time === s.time ? 'border-primary bg-primary text-primary-fg shadow' : 'border-line hover:border-primary hover:bg-primary-soft', !s.available && 'cursor-not-allowed opacity-35 line-through hover:border-line hover:bg-transparent')}><Time v={s.time} /></button>)}</div>}
            </div>
          </div>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader title={`2. ${t('new.step2')}`} />
          <form className="space-y-4 p-5" onSubmit={(e) => { e.preventDefault(); if (canSubmit) submit(); }}>
            <Field label={t('new.phone')} hint={known ? `✓ ${t('new.existing')}` : t('new.phoneHint')}>{(id) => <Input id={id} dir="ltr" inputMode="tel" autoComplete="off" placeholder="010 1234 5678" value={phone} onChange={(e) => setPhone(e.target.value)} className="text-start" />}</Field>
            <Field label={t('new.fullName')}>{(id) => <Input id={id} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ahmed Hassan" maxLength={80} />}</Field>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <Field label={t('new.visitType')}>{(id) => <Select id={id} value={visit} onChange={(e) => setVisit(e.target.value)}>{vt.map((v) => <option key={v.key} value={v.key}>{t(`visit.${v.key}`)}</option>)}</Select>}</Field>
              <Field label={t('new.channel')}>{(id) => <Select id={id} value={channel} onChange={(e) => setChannel(e.target.value as any)}><option value="whatsapp">WhatsApp</option><option value="telegram">Telegram</option><option value="link">{t('new.channelLink')}</option></Select>}</Field>
            </div>
            {time && <div className="flex items-center gap-3 rounded-xl bg-primary-soft p-3 text-sm"><CalendarCheck2 className="size-5 shrink-0 text-primary" /><div><p className="font-semibold">{clinic.docName(doc)}</p><p className="text-muted">{date} · <Time v={time} /></p></div></div>}
            {err && <p role="alert" className="rounded-lg bg-[var(--bad-bg)] px-3 py-2 text-sm text-[var(--bad-fg)]">{err}</p>}
            <Button type="submit" size="lg" className="w-full" disabled={!canSubmit} loading={busy}>{canSubmit ? t('new.confirm') : t('new.pickSlot')}</Button>
          </form>
        </Card>
      </div>
    </>
  );
}
export default function Page() { return <Suspense><NewAppointment /></Suspense>; }
