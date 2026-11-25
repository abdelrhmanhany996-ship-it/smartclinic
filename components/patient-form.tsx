'use client';
import { useEffect, useState } from 'react';
import { Button, Field, Input, Modal, Select, Textarea, cx } from './ui';
import { ShareBody } from './queue-parts';
import { usePrefs } from './providers';
import { api } from '@/lib/client';

const CHIPS = ['consultation', 'follow_up', 'xray', 'lab'] as const;

/** Add patient + book the visit, then open WhatsApp/Telegram with the message containing the patient's private link. */
export function AddPatientModal({ open, onClose, onCreated, doctors, myDoctorId, today }: { open: boolean; onClose: () => void; onCreated: (patientId: string) => void; doctors: any[]; myDoctorId?: string | null; today: string }) {
  const { t, toast, locale } = usePrefs();
  const blank = { fullName: '', phone: '', birthDate: '', gender: '', channel: 'whatsapp', date: today, time: '', visitType: 'consultation', reason: '', doctorId: myDoctorId ?? '' };
  const [f, setF] = useState(blank); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const [done, setDone] = useState<any>(null); const [lang, setLang] = useState<string>(locale);
  useEffect(() => { if (open) { setF({ ...blank, date: today, doctorId: myDoctorId ?? doctors.find((d) => d.active)?.id ?? '' }); setDone(null); setErr(''); } /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [open, today, myDoctorId, doctors.length]);
  const set = (k: string, v: string) => setF((x) => ({ ...x, [k]: v }));
  const chName = f.channel === 'telegram' ? 'Telegram' : f.channel === 'whatsapp' ? 'WhatsApp' : t('act.copy');

  const save = async () => {
    setBusy(true); setErr('');
    // open the window synchronously (inside the click) so the browser does not block it; navigate once we have the link
    const win = f.channel !== 'link' ? window.open('about:blank', '_blank') : null;
    try {
      const r = await api<any>('/api/appointments', { body: { fullName: f.fullName, phone: f.phone, date: f.date, time: f.time || null, doctorId: f.doctorId, visitType: f.visitType, channel: f.channel, birthDate: f.birthDate || null, gender: f.gender || null, reason: f.reason || null } });
      setDone(r); onCreated(r.patientId);
      const url = f.channel === 'whatsapp' ? r.whatsappUrl : f.channel === 'telegram' ? r.telegramUrl : null;
      if (url && win) { win.location.href = url; toast(t('new.savedOpen')); }
      else if (f.channel === 'link') { try { await navigator.clipboard.writeText(r.link); toast(t('common.copied')); } catch {} }
    } catch (e: any) { win?.close(); setErr(e.message); } finally { setBusy(false); }
  };
  const changeLang = async (l: string) => { setLang(l); setDone(await api(`/api/appointments/${done.id}/share?lang=${l}`)); };
  const copy = async () => { try { await navigator.clipboard.writeText(done.link); toast(t('common.copied')); } catch {} };
  const valid = f.fullName.trim().length >= 2 && f.phone.replace(/\D/g, '').length >= 8 && !!f.date && !!f.doctorId;

  return (
    <Modal open={open} onClose={onClose} title={done ? t('conf.title') : t('pt.addPatient')} wide>
      {done ? <div className="space-y-3"><p className="text-sm text-muted">{t('new.sendManual')}</p><ShareBody d={done} lang={lang} change={changeLang} copy={copy} />
        <div className="flex justify-end"><Button onClick={onClose}>{t('common.close')}</Button></div></div> : (
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); if (valid) save(); }}>
        <Field label={t('new.fullName')}>{(id) => <Input id={id} required value={f.fullName} onChange={(e) => set('fullName', e.target.value)} maxLength={80} />}</Field>
        <Field label={t('new.phone')} hint={t('new.phoneHint')}>{(id) => <Input id={id} required dir="ltr" inputMode="tel" value={f.phone} onChange={(e) => set('phone', e.target.value)} className="text-start" />}</Field>
        <Field label={t('pt.dob')}>{(id) => <Input id={id} type="date" max={today} value={f.birthDate} onChange={(e) => set('birthDate', e.target.value)} />}</Field>
        <Field label={t('pt.gender')}>{(id) => <Select id={id} value={f.gender} onChange={(e) => set('gender', e.target.value)}><option value="">—</option><option value="male">{t('pt.male')}</option><option value="female">{t('pt.female')}</option></Select>}</Field>
        <Field label={t('new.channel')}>{(id) => <Select id={id} value={f.channel} onChange={(e) => set('channel', e.target.value)}><option value="whatsapp">WhatsApp</option><option value="telegram">Telegram</option><option value="link">{t('new.channelLink')}</option></Select>}</Field>
        <Field label={t('new.examDate')}>{(id) => <Input id={id} type="date" required min={today} value={f.date} onChange={(e) => set('date', e.target.value)} />}</Field>
        {!myDoctorId && <Field label={t('common.doctor')}>{(id) => <Select id={id} value={f.doctorId} onChange={(e) => set('doctorId', e.target.value)}>{doctors.filter((d) => d.active).map((d) => <option key={d.id} value={d.id}>{locale === 'ar' && d.name_ar ? d.name_ar : d.name}</option>)}</Select>}</Field>}
        <Field label={t('new.timeOptional')} hint={t('new.timeHint')}>{(id) => <Input id={id} type="time" value={f.time} onChange={(e) => set('time', e.target.value)} />}</Field>
        <div className="sm:col-span-2"><Field label={t('new.reason')}>{(id) => <div className="space-y-2">
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('new.visitType')}>{CHIPS.map((c) => <button key={c} type="button" role="radio" aria-checked={f.visitType === c} onClick={() => set('visitType', c)}
            className={cx('h-9 rounded-full border px-4 text-sm font-medium transition', f.visitType === c ? 'border-primary bg-primary text-primary-fg' : 'border-line hover:bg-surface')}>{t(`visit.${c}`)}</button>)}</div>
          <Textarea id={id} dir="auto" rows={3} value={f.reason} onChange={(e) => set('reason', e.target.value)} placeholder={t('new.reasonHint')} maxLength={1000} /></div>}</Field></div>
        {err && <p role="alert" className="rounded-lg bg-[var(--bad-bg)] px-3 py-2 text-sm text-[var(--bad-fg)] sm:col-span-2">{err}</p>}
        <div className="flex flex-wrap justify-end gap-2 sm:col-span-2"><Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit" loading={busy} disabled={!valid} title={t('new.openChannel', { channel: chName })}>{t('common.save')}</Button></div>
        <p className="text-xs text-muted sm:col-span-2">{t('new.openChannel', { channel: chName })}</p>
      </form>)}
    </Modal>
  );
}
