'use client';
import { useEffect, useState } from 'react';
import { Button, Field, Input, Modal, Select, Textarea, cx } from './ui';
import { ShareBody } from './queue-parts';
import { PatientFields, PatientValues, blankPatient } from './patient-fields';
import { usePrefs } from './providers';
import { api } from '@/lib/client';
import { dayOffKey } from '@/lib/schedule';

const CHIPS = ['consultation', 'follow_up', 'xray', 'lab'] as const;

/** Add patient + book the visit, then open WhatsApp/Telegram with the message containing the patient's private link. */
export function AddPatientModal({ open, onClose, onCreated, doctors, myDoctorId, today, medical }: { open: boolean; onClose: () => void; onCreated: (patientId: string) => void; doctors: any[]; myDoctorId?: string | null; today: string; medical?: boolean }) {
  const { t, toast, locale } = usePrefs();
  const blank = { ...blankPatient, date: today, time: '', visitType: 'consultation', reason: '', doctorId: myDoctorId ?? '' };
  const [f, setF] = useState(blank); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const [done, setDone] = useState<any>(null); const [lang, setLang] = useState<string>(locale);
  useEffect(() => { if (open) { setF({ ...blank, date: today, doctorId: myDoctorId ?? doctors.find((d) => d.active)?.id ?? '' }); setDone(null); setErr(''); } /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [open, today, myDoctorId, doctors.length]);
  const set = (k: string, v: string) => setF((x) => ({ ...x, [k]: v }));
  const pv: PatientValues = f;
  const chName = f.channel === 'telegram' ? 'Telegram' : f.channel === 'whatsapp' ? 'WhatsApp' : t('act.copy');

  const save = async () => {
    setBusy(true); setErr('');
    // open the window synchronously (inside the click) so the browser does not block it; navigate once we have the link
    const win = f.channel !== 'link' ? window.open('about:blank', '_blank') : null;
    try {
      const r = await api<any>('/api/appointments', { body: { fullName: f.fullName, phone: f.phone, date: f.date, time: f.time || null, doctorId: f.doctorId, visitType: f.visitType, channel: f.channel, birthDate: f.birthDate || null, gender: f.gender || null, reason: f.reason || null, ...(medical ? { allergies: f.allergies || null, chronic: f.chronic || null, bloodType: f.bloodType || null } : {}), notes: f.notes || null } });
      setDone(r); onCreated(r.patientId);
      const url = f.channel === 'whatsapp' ? r.whatsappUrl : f.channel === 'telegram' ? r.telegramUrl : null;
      if (url && win) { win.location.href = url; toast(t('new.savedOpen')); }
      else if (f.channel === 'link') { try { await navigator.clipboard.writeText(r.link); toast(t('common.copied')); } catch {} }
    } catch (e: any) { win?.close(); setErr(e.message); } finally { setBusy(false); }
  };
  const changeLang = async (l: string) => { setLang(l); setDone(await api(`/api/appointments/${done.id}/share?lang=${l}`)); };
  const copy = async () => { try { await navigator.clipboard.writeText(done.link); toast(t('common.copied')); } catch {} };
  const [win, setWin] = useState<{ dayOff: boolean; reason?: string; from?: string; to?: string } | null>(null);
  useEffect(() => {
    if (!open || !f.doctorId || !f.date) return;
    let live = true; setWin(null);
    api(`/api/slots?doctorId=${f.doctorId}&date=${f.date}`).then((r) => live && setWin({ dayOff: r.dayOff, reason: r.reason, from: r.window?.from, to: r.window?.to })).catch(() => {});
    return () => { live = false; };
  }, [open, f.doctorId, f.date]);
  const toM = (v: string) => Number(v.slice(0, 2)) * 60 + Number(v.slice(3, 5));
  const outside = !!win && !win.dayOff && !!f.time && !!win.from && !!win.to && (toM(f.time) < toM(win.from) || toM(f.time) >= toM(win.to));
  const timeErr = win?.dayOff ? t(dayOffKey(win.reason)) : outside ? t('new.outsideHours', { from: win!.from!, to: win!.to! }) : '';
  const valid = f.fullName.trim().length >= 2 && f.phone.replace(/\D/g, '').length >= 8 && !!f.date && !!f.doctorId && !timeErr;

  return (
    <Modal open={open} onClose={onClose} title={done ? t('conf.title') : t('pt.addPatient')} wide>
      {done ? <div className="space-y-3"><p className="text-sm text-muted">{t('new.sendManual')}</p><ShareBody d={done} lang={lang} change={changeLang} copy={copy} />
        <div className="flex justify-end"><Button onClick={onClose}>{t('common.close')}</Button></div></div> : (
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); if (valid) save(); }}>
        <PatientFields v={pv} set={(k, val) => set(k, val)} medical={!!medical} />
        <div className="border-t border-line pt-1 sm:col-span-2"><p className="text-sm font-semibold text-primary">{t('dr.currentVisit')}</p></div>
        <Field label={t('new.examDate')} error={win?.dayOff ? t(dayOffKey(win.reason)) : undefined}>{(id) => <Input id={id} type="date" required min={today} value={f.date} onChange={(e) => set('date', e.target.value)} />}</Field>
        {!myDoctorId && <Field label={t('common.doctor')}>{(id) => <Select id={id} value={f.doctorId} onChange={(e) => set('doctorId', e.target.value)}>{doctors.filter((d) => d.active).map((d) => <option key={d.id} value={d.id}>{locale === 'ar' && d.name_ar ? d.name_ar : d.name}</option>)}</Select>}</Field>}
        <Field label={t('new.timeOptional')} error={!win?.dayOff && timeErr ? timeErr : undefined} hint={win?.from ? `${t('new.hours', { from: win.from, to: win.to! })} · ${t('new.timeHint')}` : t('new.timeHint')}>{(id) => <Input id={id} type="time" value={f.time} onChange={(e) => set('time', e.target.value)} />}</Field>
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
