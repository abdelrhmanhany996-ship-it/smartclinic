'use client';
import { useState } from 'react';
import { Button, Field, Input, Modal, Select, Textarea } from './ui';
import { usePrefs } from './providers';
import { api } from '@/lib/client';

/** Create a new patient (reception & doctor) — id returned via onCreated. */
export function AddPatientModal({ open, onClose, onCreated, medical }: { open: boolean; onClose: () => void; onCreated: (id: string) => void; medical?: boolean }) {
  const { t, toast } = usePrefs();
  const blank = { fullName: '', phone: '', birthDate: '', gender: '', channel: 'whatsapp', allergies: '', chronic: '', bloodType: '', notes: '' };
  const [f, setF] = useState(blank); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const set = (k: string, v: string) => setF((x) => ({ ...x, [k]: v }));
  const save = async () => {
    setBusy(true); setErr('');
    try {
      const r = await api<{ id: string }>('/api/patients', { body: { fullName: f.fullName, phone: f.phone, channel: f.channel, birthDate: f.birthDate || null, gender: f.gender || null, allergies: f.allergies || null, chronic: f.chronic || null, bloodType: f.bloodType || null, notes: f.notes || null } });
      toast(t('pt.added')); setF(blank); onCreated(r.id);
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title={t('pt.addPatient')} wide>
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); save(); }}>
        <Field label={t('new.fullName')}>{(id) => <Input id={id} required value={f.fullName} onChange={(e) => set('fullName', e.target.value)} maxLength={80} />}</Field>
        <Field label={t('new.phone')} hint={t('new.phoneHint')}>{(id) => <Input id={id} required dir="ltr" inputMode="tel" value={f.phone} onChange={(e) => set('phone', e.target.value)} className="text-start" />}</Field>
        <Field label={t('pt.dob')}>{(id) => <Input id={id} type="date" max={new Date().toISOString().slice(0, 10)} value={f.birthDate} onChange={(e) => set('birthDate', e.target.value)} />}</Field>
        <Field label={t('pt.gender')}>{(id) => <Select id={id} value={f.gender} onChange={(e) => set('gender', e.target.value)}><option value="">—</option><option value="male">{t('pt.male')}</option><option value="female">{t('pt.female')}</option></Select>}</Field>
        <Field label={t('new.channel')}>{(id) => <Select id={id} value={f.channel} onChange={(e) => set('channel', e.target.value)}><option value="whatsapp">WhatsApp</option><option value="telegram">Telegram</option><option value="link">{t('new.channelLink')}</option></Select>}</Field>
        {medical && <Field label={t('pt.blood')}>{(id) => <Select id={id} value={f.bloodType} onChange={(e) => set('bloodType', e.target.value)}><option value="">—</option>{['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((b) => <option key={b}>{b}</option>)}</Select>}</Field>}
        {medical && <><Field label={t('pt.allergies')}>{(id) => <Input id={id} value={f.allergies} onChange={(e) => set('allergies', e.target.value)} />}</Field>
          <Field label={t('pt.chronic')}>{(id) => <Input id={id} value={f.chronic} onChange={(e) => set('chronic', e.target.value)} />}</Field></>}
        <div className="sm:col-span-2"><Field label={t('pt.notes')}>{(id) => <Textarea id={id} value={f.notes} onChange={(e) => set('notes', e.target.value)} maxLength={2000} />}</Field></div>
        {err && <p role="alert" className="rounded-lg bg-[var(--bad-bg)] px-3 py-2 text-sm text-[var(--bad-fg)] sm:col-span-2">{err}</p>}
        <div className="flex justify-end gap-2 sm:col-span-2"><Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button><Button type="submit" loading={busy} disabled={f.fullName.trim().length < 2 || f.phone.replace(/\D/g, '').length < 8}>{t('common.save')}</Button></div>
      </form>
    </Modal>
  );
}
