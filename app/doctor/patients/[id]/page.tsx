'use client';
import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { AlertTriangle, ArrowLeft, CheckCircle2, FileText, Plus, Printer, Send, Trash2, Pencil } from 'lucide-react';
import { PageHeader } from '@/components/shell';
import { Button, Card, CardHeader, Field, Input, Modal, Select, Skeleton, StatusChip, Textarea, Time, cx } from '@/components/ui';
import { Dictate } from '@/components/dictate';
import { PatientFields } from '@/components/patient-fields';
import { RxPrint, ageOf, rxLabels, RxPrintData } from '@/components/rx-print';
import { usePrefs } from '@/components/providers';
import { api, useLive } from '@/lib/client';
import { useClinic } from '@/components/useClinic';
import { useActions } from '@/components/queue-parts';

const emptyItem = () => ({ name: '', dose: '', frequency: '', duration: '', notes: '' });

function PatientRecord() {
  const { t, toast, locale, dir } = usePrefs();
  const { id } = useParams<{ id: string }>(); const sp = useSearchParams(); const apptId = sp.get('appt');
  const clinic = useClinic();
  const { data, reload } = useLive<any>(`/api/patients/${id}`, '/api/events');
  const appt = useLive<any>(apptId ? '/api/queue' : null, '/api/events');
  const cur = appt.data?.items.find((i: any) => i.id === apptId);
  const { run, busy } = useActions(() => { appt.reload(); reload(); });

  const [dx, setDx] = useState(''); const [items, setItems] = useState([emptyItem()]); const [advice, setAdvice] = useState(''); const [follow, setFollow] = useState('');
  const [dictLang, setDictLang] = useState(locale === 'ar' ? 'ar-EG' : 'en-US'); const [saving, setSaving] = useState<null | 'print' | 'send'>(null);
  const [printing, setPrinting] = useState<RxPrintData | null>(null); const [edit, setEdit] = useState<any>(null);
  const setItem = (i: number, k: string, v: string) => setItems((x) => x.map((it, j) => (j === i ? { ...it, [k]: v } : it)));
  const append = (setter: (f: (x: string) => string) => void) => (txt: string) => setter((x) => (x ? x.replace(/\s*$/, ' ') : '') + txt);
  const p = data?.patient;

  const printData = (rx: any): RxPrintData => ({ clinicName: clinic.data?.clinic.name ?? '', clinicAddress: clinic.data?.clinic.address, clinicPhone: clinic.data?.clinic.phone, brandColor: clinic.data?.clinic.brand_color,
    doctorName: rx.doctorName, specialty: rx.specialty, patientName: p.fullName, age: ageOf(p.birthDate), date: String(rx.createdAt ?? new Date().toISOString()).slice(0, 10), diagnosis: rx.diagnosis, items: rx.items, advice: rx.advice, followUpDate: rx.followUpDate });
  const print = (rx: any) => { setPrinting(printData(rx)); setTimeout(() => { window.print(); }, 250); };

  const save = async (alsoPrint: boolean) => {
    const clean = items.filter((i) => i.name.trim());
    if (!clean.length && !dx.trim() && !advice.trim()) return toast(t('rx.emptyErr'), 'err');
    setSaving(alsoPrint ? 'print' : 'send');
    try {
      await api(`/api/patients/${id}/prescriptions`, { body: { appointmentId: cur?.id ?? null, diagnosis: dx || null, items: clean, advice: advice || null, followUpDate: follow || null, send: true } });
      toast(t('rx.sent'));
      const snapshot = { doctorName: clinic.data ? me?.name : '', specialty: '', createdAt: new Date().toISOString(), diagnosis: dx, items: clean, advice, followUpDate: follow };
      setDx(''); setItems([emptyItem()]); setAdvice(''); setFollow(''); await reload();
      if (alsoPrint) { const fresh = await api<any>(`/api/patients/${id}`); print(fresh.prescriptions[0] ?? snapshot); }
    } catch (e: any) { toast(e.message, 'err'); } finally { setSaving(null); }
  };
  const me = useLive<any>('/api/auth/me', null).data?.user;
  const resend = async (rxId: string) => { try { await api(`/api/prescriptions/${rxId}/send`, { body: {} }); toast(t('rx.sent')); reload(); } catch (e: any) { toast(e.message, 'err'); } };
  const saveProfile = async () => { try { await api(`/api/patients/${id}`, { method: 'PATCH', body: { fullName: edit.fullName, phone: edit.phone, channel: edit.channel, birthDate: edit.birthDate || null, gender: edit.gender || null, allergies: edit.allergies || null, chronic: edit.chronic || null, bloodType: edit.bloodType || null, notes: edit.notes || null } }); setEdit(null); reload(); toast(t('common.saved')); } catch (e: any) { toast(e.message, 'err'); } };
  const age = useMemo(() => ageOf(p?.birthDate), [p]);

  if (!data) return <Skeleton className="h-96" />;
  return (
    <>
      <Link href="/doctor/patients" className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"><ArrowLeft className="size-4 rtl:rotate-180" />{t('dr.back')}</Link>
      <PageHeader title={p.fullName} sub={`${p.phone}${age != null ? ` · ${age} ${t('pt.years')}` : ''}${p.gender ? ` · ${t(`pt.${p.gender}`)}` : ''}`} right={<Button variant="secondary" icon={<Pencil className="size-4" />} onClick={() => setEdit({ fullName: p.fullName, phone: p.phone, channel: p.channel ?? 'whatsapp', birthDate: p.birthDate ?? '', gender: p.gender ?? '', bloodType: p.bloodType ?? '', allergies: p.allergies ?? '', chronic: p.chronic ?? '', notes: p.notes ?? '' })}>{t('pt.editProfile')}</Button>} />

      {cur && <Card className="mb-5 border-primary/50"><div className="flex flex-wrap items-center gap-3 px-5 py-4"><span className="rounded-lg bg-primary px-3 py-1 text-lg font-bold text-primary-fg">{cur.ticket}</span><div className="flex-1"><p className="font-semibold">{t('dr.currentVisit')}</p><p className="text-sm text-muted"><Time v={cur.time} /> · {t(`visit.${cur.visitType}`)}</p></div><StatusChip status={cur.status} />
        {cur.status === 'in_consultation' ? <Button icon={<CheckCircle2 className="size-4" />} loading={busy === cur.id + 'end'} onClick={() => run(cur.id, 'end')}>{t('act.end')}</Button>
          : ['booked', 'checked_in'].includes(cur.status) ? <Button icon={<CheckCircle2 className="size-4" />} loading={busy === cur.id + 'start'} onClick={() => run(cur.id, 'start')}>{t('act.start')}</Button> : null}</div></Card>}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader title={<span className="inline-flex items-center gap-2"><FileText className="size-5 text-primary" />{t('rx.title')}</span>} sub={cur ? t('rx.linked') : undefined}
              right={<Select value={dictLang} onChange={(e) => setDictLang(e.target.value)} className="!w-auto" aria-label={t('rx.dictLang')}><option value="ar-EG">🎙 العربية</option><option value="en-US">🎙 English</option></Select>} />
            <div className="space-y-5 p-5">
              <Field label={t('rx.diagnosis')}>{(fid) => <div className="space-y-2"><Textarea id={fid} dir="auto" rows={2} value={dx} onChange={(e) => setDx(e.target.value)} /><Dictate lang={dictLang} onText={append(setDx)} /></div>}</Field>
              <div>
                <p className="mb-2 text-sm font-medium">{t('rx.meds')}</p>
                <div className="space-y-3">
                  {items.map((it, i) => (
                    <div key={i} className="grid gap-2 rounded-xl border border-line p-3 sm:grid-cols-[2fr_1fr_1.2fr_1fr_auto]">
                      <Input dir="auto" placeholder={t('rx.med')} aria-label={t('rx.med')} value={it.name} onChange={(e) => setItem(i, 'name', e.target.value)} />
                      <Input dir="auto" placeholder={t('rx.dose')} aria-label={t('rx.dose')} value={it.dose} onChange={(e) => setItem(i, 'dose', e.target.value)} />
                      <Input dir="auto" placeholder={t('rx.freq')} aria-label={t('rx.freq')} value={it.frequency} onChange={(e) => setItem(i, 'frequency', e.target.value)} />
                      <Input dir="auto" placeholder={t('rx.duration')} aria-label={t('rx.duration')} value={it.duration} onChange={(e) => setItem(i, 'duration', e.target.value)} />
                      <button type="button" onClick={() => setItems((x) => (x.length > 1 ? x.filter((_, j) => j !== i) : [emptyItem()]))} aria-label="Remove" className="grid size-10 place-items-center rounded-lg text-muted hover:bg-surface hover:text-danger"><Trash2 className="size-4" /></button>
                      <Input dir="auto" className="sm:col-span-4" placeholder={t('rx.medNotes')} aria-label={t('rx.medNotes')} value={it.notes} onChange={(e) => setItem(i, 'notes', e.target.value)} />
                      <div className="sm:col-span-5"><Dictate lang={dictLang} onText={(txt) => setItem(i, 'notes', (it.notes ? it.notes + ' ' : '') + txt)} /></div>
                    </div>))}
                </div>
                <Button type="button" variant="soft" size="sm" className="mt-3" icon={<Plus className="size-4" />} onClick={() => setItems((x) => [...x, emptyItem()])}>{t('rx.addMed')}</Button>
              </div>
              <Field label={t('rx.advice')}>{(fid) => <div className="space-y-2"><Textarea id={fid} dir="auto" rows={4} value={advice} onChange={(e) => setAdvice(e.target.value)} /><Dictate lang={dictLang} onText={append(setAdvice)} /></div>}</Field>
              <Field label={t('rx.followUp')}>{(fid) => <Input id={fid} type="date" min={new Date().toISOString().slice(0, 10)} value={follow} onChange={(e) => setFollow(e.target.value)} className="!w-auto" />}</Field>
              <div className="flex flex-wrap justify-end gap-3 border-t border-line pt-5">
                <Button size="lg" variant="secondary" icon={<Send className="size-5" />} loading={saving === 'send'} disabled={!!saving} onClick={() => save(false)}>{t('rx.saveSend')}</Button>
                <Button size="lg" icon={<Printer className="size-5" />} loading={saving === 'print'} disabled={!!saving} onClick={() => save(true)}>{t('rx.saveSendPrint')}</Button>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title={t('rx.history')} />
            <div className="divide-y divide-line">
              {data.prescriptions.length === 0 && <p className="p-6 text-center text-sm text-muted">{t('rx.empty')}</p>}
              {data.prescriptions.map((rx: any) => (
                <div key={rx.id} className="space-y-2 px-5 py-4">
                  <div className="flex flex-wrap items-center gap-2"><b className="tabular-nums">{String(rx.createdAt).slice(0, 10)}</b><span className="text-sm text-muted">{rx.doctorName}</span>
                    <span className={cx('chip', rx.sentAt ? 'chip-completed' : 'chip-waiting')}>{rx.sentAt ? t('rx.sentOn') : t('rx.notSent')}</span><span className="flex-1" />
                    {!rx.sentAt && <Button size="sm" variant="soft" icon={<Send className="size-4" />} onClick={() => resend(rx.id)}>{t('rx.resend')}</Button>}
                    <Button size="sm" variant="secondary" icon={<Printer className="size-4" />} onClick={() => print(rx)}>{t('rx.print')}</Button></div>
                  {rx.diagnosis && <p dir="auto" className="text-sm"><b>{t('rx.diagnosis')}:</b> {rx.diagnosis}</p>}
                  <ul className="space-y-1 text-sm">{rx.items.map((i: any, k: number) => <li key={k} dir="auto" className="rounded-lg bg-surface px-3 py-1.5"><b>{i.name}</b> {i.dose} <span className="text-muted">{[i.frequency, i.duration, i.notes].filter(Boolean).join(' · ')}</span></li>)}</ul>
                  {rx.advice && <p dir="auto" className="whitespace-pre-wrap text-sm text-muted">{rx.advice}</p>}
                  {rx.followUpDate && <p className="text-sm"><b>{t('rx.followUp')}:</b> {rx.followUpDate}</p>}
                </div>))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title={t('dr.medical')} />
            <dl className="space-y-3 p-5 text-sm">
              <div><dt className="text-xs text-muted">{t('pt.allergies')}</dt><dd className={cx('font-medium', p.allergies && 'text-[var(--bad-fg)]')}>{p.allergies ? <span className="inline-flex items-center gap-1.5"><AlertTriangle className="size-4" />{p.allergies}</span> : '—'}</dd></div>
              <div><dt className="text-xs text-muted">{t('pt.chronic')}</dt><dd className="font-medium">{p.chronic || '—'}</dd></div>
              <div><dt className="text-xs text-muted">{t('pt.blood')}</dt><dd className="font-medium">{p.bloodType || '—'}</dd></div>
              <div><dt className="text-xs text-muted">{t('pt.notes')}</dt><dd dir="auto" className="whitespace-pre-wrap font-medium">{p.notes || '—'}</dd></div>
            </dl>
          </Card>
          <Card>
            <CardHeader title={t('dr.visitHistory')} />
            <div className="max-h-80 divide-y divide-line overflow-auto scroll-thin">{data.visits.map((v: any) => <div key={v.id} className="flex items-center gap-2 px-5 py-2.5 text-sm"><span className="w-24 tabular-nums">{v.date}</span><span className="flex-1 truncate text-muted">{v.doctor}</span><StatusChip status={v.status} /></div>)}</div>
          </Card>
        </div>
      </div>

      <Modal open={!!edit} onClose={() => setEdit(null)} title={t('pt.editProfile')} wide>{edit && <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); saveProfile(); }}>
        <PatientFields v={edit} set={(k, val) => setEdit((x: any) => ({ ...x, [k]: val }))} medical />
        <div className="flex justify-end gap-2 sm:col-span-2"><Button type="button" variant="secondary" onClick={() => setEdit(null)}>{t('common.cancel')}</Button><Button type="submit" disabled={edit.fullName.trim().length < 2 || edit.phone.replace(/\D/g, '').length < 8}>{t('common.save')}</Button></div></form>}</Modal>
      <RxPrint data={printing} labels={rxLabels(t)} dir={dir} />
    </>
  );
}
export default function Page() { return <Suspense><PatientRecord /></Suspense>; }
