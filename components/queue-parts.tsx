'use client';
import { ReactNode, useEffect, useState } from 'react';
import { Check, CheckCircle2, Clock, MessageCircle, Play, Send, SkipForward, UserX, CalendarClock, XCircle, Undo2 } from 'lucide-react';
import { Button, Modal, Select, Field, Input, StatusChip, Time } from './ui';
import { usePrefs } from './providers';
import { api } from '@/lib/client';

export interface QItem { id: string; ticket: string; patient: string; phone: string; time: string; status: string; visitType: string; token: string; ahead: number | null; estTime: string | null; delayMin: number; durationMin: number; startedAt: string | null; checkedInAt: string | null }

/** Runs an appointment action, surfaces errors as toasts. */
export function useActions(onDone?: () => void) {
  const { toast, t } = usePrefs();
  const [busy, setBusy] = useState<string | null>(null);
  const run = async (id: string, action: string, extra: object = {}) => {
    setBusy(id + action);
    try { await api(`/api/appointments/${id}/action`, { body: { action, ...extra } }); onDone?.(); return true; }
    catch (e: any) { toast(e.message || t('common.error'), 'err'); return false; }
    finally { setBusy(null); }
  };
  return { run, busy };
}

/** Which actions make sense for a given status (receptionist). */
export function actionsFor(status: string) {
  switch (status) {
    case 'booked': return ['check_in', 'start', 'skip', 'reschedule', 'no_show', 'cancel'];
    case 'checked_in': return ['start', 'skip', 'reschedule', 'no_show', 'cancel'];
    case 'in_consultation': return ['end'];
    case 'skipped': return ['recall', 'start', 'reschedule', 'no_show', 'cancel'];
    case 'cancelled': case 'no_show': return ['reschedule'];
    default: return [];
  }
}
export const ACTION_ICON: Record<string, ReactNode> = {
  check_in: <Check className="size-4" />, start: <Play className="size-4" />, end: <CheckCircle2 className="size-4" />, skip: <SkipForward className="size-4" />, recall: <Undo2 className="size-4" />,
  reschedule: <CalendarClock className="size-4" />, no_show: <UserX className="size-4" />, cancel: <XCircle className="size-4" />,
};

export function RowActions({ it, doctorId, run, busy, onShare, role = 'receptionist', labeled }: { it: QItem; doctorId: string; run: (id: string, a: string, x?: object) => Promise<boolean>; busy: string | null; onShare?: (id: string) => void; role?: string; labeled?: boolean }) {
  const { t } = usePrefs();
  const [resched, setResched] = useState(false);
  const [confirm, setConfirm] = useState<null | { action: string; msg: string }>(null);
  const acts = role === 'doctor' ? actionsFor(it.status).filter((a) => ['start', 'end', 'reschedule', 'cancel', 'no_show'].includes(a)) : actionsFor(it.status);
  const primary = acts.filter((a) => ['check_in', 'start', 'end', 'recall'].includes(a));
  const more = acts.filter((a) => !primary.includes(a));
  const ask = (a: string) => {
    if (a === 'reschedule') return setResched(true);
    const msg = { cancel: 'q.cancelConfirm', no_show: 'q.noShowConfirm', skip: 'q.skipConfirm' }[a];
    msg ? setConfirm({ action: a, msg }) : run(it.id, a);
  };
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {primary.map((a) => <Button key={a} size="sm" variant={a === 'start' || a === 'end' ? 'primary' : 'soft'} icon={ACTION_ICON[a]} loading={busy === it.id + a} onClick={() => ask(a)}>{t(`act.${a}`)}</Button>)}
      {more.map((a) => labeled && (a === 'reschedule' || a === 'cancel')
        ? <Button key={a} size="sm" variant={a === 'cancel' ? 'secondary' : 'secondary'} icon={ACTION_ICON[a]} onClick={() => ask(a)} className={a === 'cancel' ? '!text-danger' : ''}>{t(a === 'cancel' ? 'act.cancelBooking' : 'act.postpone')}</Button>
        : <button key={a} onClick={() => ask(a)} title={t(`act.${a}`)} aria-label={t(`act.${a}`)} className="grid size-8 place-items-center rounded-lg border border-line text-muted transition hover:bg-surface hover:text-ink">{ACTION_ICON[a]}</button>)}
      {onShare && role !== 'doctor' && !['cancelled', 'completed', 'no_show'].includes(it.status) && <button onClick={() => onShare(it.id)} title={t('q.sendLink')} aria-label={t('q.sendLink')} className="grid size-8 place-items-center rounded-lg border border-line text-[#12724A] hover:bg-surface"><MessageCircle className="size-4" /></button>}
      <Modal open={!!confirm} onClose={() => setConfirm(null)} title={confirm ? t(confirm.action === 'cancel' ? 'act.cancelBooking' : `act.${confirm.action}`) : ''}>
        <p className="mb-5 text-sm">{confirm && t(confirm.msg)}</p>
        <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setConfirm(null)}>{t('common.no')}</Button>
          <Button variant="danger" onClick={async () => { const a = confirm!.action; setConfirm(null); await run(it.id, a); }}>{t('common.yes')}</Button></div>
      </Modal>
      {resched && <Reschedule it={it} doctorId={doctorId} lockDoctor={role === 'doctor'} onClose={() => setResched(false)} onSave={async (b) => { if (await run(it.id, 'reschedule', b)) setResched(false); }} />}
    </div>
  );
}

function Reschedule({ it, doctorId, lockDoctor, onClose, onSave }: { it: QItem; doctorId: string; lockDoctor?: boolean; onClose: () => void; onSave: (b: { date: string; time: string; doctorId: string }) => void }) {
  const { t, locale } = usePrefs();
  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [docs, setDocs] = useState<any[]>([]); const [doc, setDoc] = useState(doctorId);
  const [slots, setSlots] = useState<any[]>([]); const [time, setTime] = useState(it.time);
  useEffect(() => { if (!lockDoctor) api('/api/clinic').then((r) => setDocs(r.doctors.filter((d: any) => d.active))); }, [lockDoctor]);
  const load = async (d: string, dc: string) => { try { setSlots((await api(`/api/slots?doctorId=${dc}&date=${d}`)).slots); } catch { setSlots([]); } };
  useEffect(() => { load(date, doc); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  return (
    <Modal open onClose={onClose} title={`${t('act.postpone')} · ${it.ticket} · ${it.patient}`} wide>
      <div className="grid gap-4 sm:grid-cols-2">
        {!lockDoctor && <Field label={t('common.doctor')}>{(id) => <Select id={id} value={doc} onChange={(e) => { setDoc(e.target.value); load(date, e.target.value); }}>{docs.map((d) => <option key={d.id} value={d.id}>{locale === 'ar' && d.name_ar ? d.name_ar : d.name}</option>)}</Select>}</Field>}
        <Field label={t('common.date')}>{(id) => <Input id={id} type="date" min={new Date().toLocaleDateString('en-CA')} value={date} onChange={(e) => { setDate(e.target.value); load(e.target.value, doc); }} />}</Field>
        <Field label={t('q.typeTime')}>{(id) => <Input id={id} type="time" value={time} onChange={(e) => setTime(e.target.value)} />}</Field>
      </div>
      <p className="mb-2 mt-4 text-xs text-muted">{t('q.pickOrType')}</p>
      <div className="grid max-h-44 grid-cols-3 gap-2 overflow-auto sm:grid-cols-5">
        {slots.map((s) => <button key={s.time} type="button" disabled={!s.available} onClick={() => setTime(s.time)} className={`rounded-lg border px-2 py-2 text-sm font-medium transition ${time === s.time ? 'border-primary bg-primary text-primary-fg' : 'border-line hover:bg-surface'} disabled:opacity-35 disabled:line-through`}><Time v={s.time} /></button>)}
        {!slots.length && <p className="col-span-full text-sm text-muted">{t('new.noSlots')}</p>}
      </div>
      <div className="mt-5 flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button><Button disabled={!time || !date} onClick={() => onSave({ date, time, doctorId: doc })}>{t('common.confirm')}</Button></div>
    </Modal>
  );
}

export function ShareModal({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { t, toast, locale } = usePrefs();
  const [lang, setLang] = useState<string>(locale);
  const [d, setD] = useState<any>(null);
  useEffect(() => { if (!id) return; setD(null); api(`/api/appointments/${id}/share?lang=${lang}`).then(setD).catch((e) => toast(e.message, 'err')); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id]);
  const change = (l: string) => { setLang(l); api(`/api/appointments/${id}/share?lang=${l}`).then(setD); };
  const copy = async () => { try { await navigator.clipboard.writeText(d.link); } catch { const i = document.createElement('input'); i.value = d.link; document.body.appendChild(i); i.select(); document.execCommand('copy'); i.remove(); } toast(t('common.copied')); };
  return (
    <Modal open={!!id} onClose={onClose} title={t('q.sendLink')} wide>
      {!d ? <p className="text-sm text-muted">{t('common.loading')}</p> : <ShareBody d={d} lang={lang} change={change} copy={copy} />}
    </Modal>
  );
}
export function ShareBody({ d, lang, change, copy }: { d: any; lang: string; change: (l: string) => void; copy: () => void }) {
  const { t } = usePrefs();
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2"><span className="rounded-lg bg-primary px-3 py-1 text-lg font-bold text-primary-fg">{d.ticket}</span><span className="text-sm text-muted">{d.patient} · {d.phone}</span></div>
        <Select value={lang} onChange={(e) => change(e.target.value)} className="!w-auto" aria-label={t('conf.lang')}><option value="en">English</option><option value="ar">العربية</option></Select>
      </div>
      <pre dir="auto" className="max-h-52 overflow-auto whitespace-pre-wrap rounded-xl bg-surface p-4 font-sans text-sm leading-relaxed">{d.message}</pre>
      <div className="grid gap-2 sm:grid-cols-3">
        <a href={d.whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 text-sm font-semibold text-[#06361b] hover:brightness-105"><MessageCircle className="size-4" />{t('act.whatsapp')}</a>
        <a href={d.telegramUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#229ED9] px-4 text-sm font-semibold text-white hover:brightness-105"><Send className="size-4" />{t('act.telegram')}</a>
        <Button variant="secondary" size="lg" className="!h-11" icon={<Clock className="hidden" />} onClick={copy}>{t('act.copy')}</Button>
      </div>
      <p className="text-xs text-muted">{t('conf.hint')}</p>
    </div>
  );
}
