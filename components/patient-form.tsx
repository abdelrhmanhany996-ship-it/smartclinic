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
export interface EditTarget { patientId: string; values: PatientValues; appt: null | { id: string; date: string; time: string; visitType: string; reason: string | null; doctorId: string; status: string } }

/** Add patient AND edit patient share this exact dialog (patient data + current visit). Saving opens WhatsApp/Telegram with the patient-app link. */
export function AddPatientModal({ open, onClose, onCreated, doctors, myDoctorId, today, medical, edit }: { open: boolean; onClose: () => void; onCreated: (patientId: string) => void; doctors: any[]; myDoctorId?: string | null; today: string; medical?: boolean; edit?: EditTarget | null }) {
  const { t, toast, locale } = usePrefs();
  const blank = { ...blankPatient, date: today, time: '', visitType: 'consultation', reason: '', doctorId: myDoctorId ?? '' };
  const [f, setF] = useState(blank); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const [done, setDone] = useState<any>(null); const [lang, setLang] = useState<string>(locale); const [bookNew, setBookNew] = useState(false);
  useEffect(() => {
    if (!open) return;
    const a = edit?.appt;
    setF(edit ? { ...edit.values, date: a?.date ?? today, time: a?.time ?? '', visitType: a?.visitType ?? 'consultation', reason: a?.reason ?? '', doctorId: a?.doctorId ?? myDoctorId ?? doctors.find((d) => d.active)?.id ?? '' }
      : { ...blank, date: today, doctorId: myDoctorId ?? doctors.find((d) => d.active)?.id ?? '' });
    setDone(null); setErr(''); setBookNew(false);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [open]); // initialise once per opening — a background refresh after saving must not wipe the "send" panel
  useEffect(() => { if (open && !f.doctorId) { const d = myDoctorId ?? doctors.find((x) => x.active)?.id; if (d) setF((x) => ({ ...x, doctorId: d })); } }, [open, doctors, myDoctorId, f.doctorId]);
  const hasVisit = !edit || !!edit.appt || bookNew;
  const locked = edit?.appt?.status === 'in_consultation'; // date/time of a visit in progress cannot move
  const set = (k: string, v: string) => setF((x) => ({ ...x, [k]: v }));
  const pv: PatientValues = f;
  const chName = f.channel === 'telegram' ? 'Telegram' : f.channel === 'whatsapp' ? 'WhatsApp' : t('act.copy');

  const visitBody = () => ({ fullName: f.fullName, phone: f.phone, date: f.date, time: f.time || null, doctorId: f.doctorId, visitType: f.visitType, channel: f.channel, birthDate: f.birthDate || null, gender: f.gender || null, reason: f.reason || null, ...(medical ? { allergies: f.allergies || null, chronic: f.chronic || null, bloodType: f.bloodType || null } : {}), notes: f.notes || null });
  const save = async () => {
    setBusy(true); setErr('');
    // open the window synchronously (inside the click) so the browser does not block it; navigate once we have the link
    const win = hasVisit && f.channel !== 'link' ? window.open('about:blank', '_blank') : null;
    try {
      let share: any = null; let patientId = edit?.patientId ?? '';
      if (!edit) { share = await api<any>('/api/appointments', { body: visitBody() }); patientId = share.patientId; }
      else {
        await api(`/api/patients/${edit.patientId}`, { method: 'PATCH', body: { fullName: f.fullName, phone: f.phone, channel: f.channel, birthDate: f.birthDate || null, gender: f.gender || null, notes: f.notes || null, ...(medical ? { allergies: f.allergies || null, chronic: f.chronic || null, bloodType: f.bloodType || null } : {}) } });
        const a = edit.appt; let apptId: string | null = null;
        if (a) {
          if (!locked && (f.date !== a.date || (f.time && f.time !== a.time))) await api(`/api/appointments/${a.id}/action`, { body: { action: 'reschedule', date: f.date, time: f.time || a.time } });
          if (f.visitType !== a.visitType || (f.reason || '') !== (a.reason || '')) await api(`/api/appointments/${a.id}`, { method: 'PATCH', body: { visitType: f.visitType, reason: f.reason || null } });
          apptId = a.id;
        } else if (bookNew) { share = await api<any>('/api/appointments', { body: visitBody() }); apptId = share.id; }
        if (apptId && !share) share = await api<any>(`/api/appointments/${apptId}/share`);
      }
      onCreated(patientId);
      if (!share) { toast(t('common.saved')); win?.close(); onClose(); return; }
      setDone(share);
      const url = f.channel === 'whatsapp' ? share.whatsappUrl : f.channel === 'telegram' ? share.telegramUrl : null;
      if (url && win) { win.location.href = url; toast(t('new.savedOpen')); }
      else { win?.close(); if (f.channel === 'link') { try { await navigator.clipboard.writeText(share.link); toast(t('common.copied')); } catch {} } }
    } catch (e: any) { win?.close(); setErr(e.message); } finally { setBusy(false); }
  };
  const changeLang = async (l: string) => { setLang(l); setDone(await api(`/api/appointments/${done.id}/share?lang=${l}`)); };
  const copy = async () => { try { await navigator.clipboard.writeText(done.link); toast(t('common.copied')); } catch {} };
  const [win, setWin] = useState<{ dayOff: boolean; reason?: string; from?: string; to?: string } | null>(null);
  useEffect(() => {
    if (!open || !hasVisit || !f.doctorId || !f.date) return;
    let live = true; setWin(null);
    api(`/api/slots?doctorId=${f.doctorId}&date=${f.date}`).then((r) => live && setWin({ dayOff: r.dayOff, reason: r.reason, from: r.window?.from, to: r.window?.to })).catch(() => {});
    return () => { live = false; };
  }, [open, hasVisit, f.doctorId, f.date]);
  const toM = (v: string) => Number(v.slice(0, 2)) * 60 + Number(v.slice(3, 5));
  const outside = !!win && !win.dayOff && !!f.time && !!win.from && !!win.to && (toM(f.time) < toM(win.from) || toM(f.time) >= toM(win.to));
  const timeErr = win?.dayOff ? t(dayOffKey(win.reason)) : outside ? t('new.outsideHours', { from: win!.from!, to: win!.to! }) : '';
  const valid = f.fullName.trim().length >= 2 && f.phone.replace(/\D/g, '').length >= 8 && (!hasVisit || (!!f.date && !!f.doctorId && !timeErr));

  return (
    <Modal open={open} onClose={onClose} title={done ? t('conf.title') : edit ? t('pt.editProfile') : t('pt.addPatient')} wide>
      {done ? <div className="space-y-3"><p className="text-sm text-muted">{t('new.sendManual')}</p><ShareBody d={done} lang={lang} change={changeLang} copy={copy} />
        <div className="flex justify-end"><Button onClick={onClose}>{t('common.close')}</Button></div></div> : (
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); if (valid) save(); }}>
        <PatientFields v={pv} set={(k, val) => set(k, val)} medical={!!medical} />
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-1 sm:col-span-2"><p className="text-sm font-semibold text-primary">{t('dr.currentVisit')}</p>
          {edit && !edit.appt && <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" className="size-4 accent-[var(--primary)]" checked={bookNew} onChange={(e) => setBookNew(e.target.checked)} />{t('new.bookVisit')}</label>}</div>
        {!hasVisit && <p className="text-sm text-muted sm:col-span-2">{t('new.noActiveVisit')}</p>}
        {hasVisit && <>
        <Field label={t('new.examDate')} error={win?.dayOff ? t(dayOffKey(win.reason)) : undefined}>{(id) => <Input id={id} type="date" required min={today} disabled={locked} value={f.date} onChange={(e) => set('date', e.target.value)} />}</Field>
        {!myDoctorId && <Field label={t('common.doctor')}>{(id) => <Select id={id} value={f.doctorId} onChange={(e) => set('doctorId', e.target.value)}>{doctors.filter((d) => d.active).map((d) => <option key={d.id} value={d.id}>{locale === 'ar' && d.name_ar ? d.name_ar : d.name}</option>)}</Select>}</Field>}
        <Field label={t('new.timeOptional')} error={!win?.dayOff && timeErr ? timeErr : undefined} hint={win?.from ? `${t('new.hours', { from: win.from, to: win.to! })} · ${t('new.timeHint')}` : t('new.timeHint')}>{(id) => <Input id={id} type="time" disabled={locked} value={f.time} onChange={(e) => set('time', e.target.value)} />}</Field>
        <div className="sm:col-span-2"><Field label={t('new.reason')}>{(id) => <div className="space-y-2">
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('new.visitType')}>{CHIPS.map((c) => <button key={c} type="button" role="radio" aria-checked={f.visitType === c} onClick={() => set('visitType', c)}
            className={cx('h-9 rounded-full border px-4 text-sm font-medium transition', f.visitType === c ? 'border-primary bg-primary text-primary-fg' : 'border-line hover:bg-surface')}>{t(`visit.${c}`)}</button>)}</div>
          <Textarea id={id} dir="auto" rows={3} value={f.reason} onChange={(e) => set('reason', e.target.value)} placeholder={t('new.reasonHint')} maxLength={1000} /></div>}</Field></div>
        </>}
        {err && <p role="alert" className="rounded-lg bg-[var(--bad-bg)] px-3 py-2 text-sm text-[var(--bad-fg)] sm:col-span-2">{err}</p>}
        <div className="flex flex-wrap justify-end gap-2 sm:col-span-2"><Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit" loading={busy} disabled={!valid} title={t('new.openChannel', { channel: chName })}>{t('common.save')}</Button></div>
        {hasVisit && <p className="text-xs text-muted sm:col-span-2">{t('new.openChannel', { channel: chName })}</p>}
      </form>)}
    </Modal>
  );
}
