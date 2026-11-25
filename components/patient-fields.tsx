'use client';
import { Field, Input, Select, Textarea } from './ui';
import { Dictate } from './dictate';
import { usePrefs } from './providers';

export interface PatientValues { fullName: string; phone: string; channel: string; birthDate: string; gender: string; bloodType: string; allergies: string; chronic: string; notes: string }
export const blankPatient: PatientValues = { fullName: '', phone: '', channel: 'whatsapp', birthDate: '', gender: '', bloodType: '', allergies: '', chronic: '', notes: '' };
const BLOOD = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

/** The patient-data form: identical for "Add patient" and "Edit patient". Medical fields are doctor-only. */
export function PatientFields({ v, set, medical }: { v: PatientValues; set: (k: keyof PatientValues, val: string) => void; medical: boolean }) {
  const { t, locale } = usePrefs();
  const today = new Date().toISOString().slice(0, 10);
  return (
    <>
      <Field label={t('new.fullName')}>{(id) => <Input id={id} required value={v.fullName} onChange={(e) => set('fullName', e.target.value)} maxLength={80} />}</Field>
      <Field label={t('new.phone')} hint={t('new.phoneHint')}>{(id) => <Input id={id} required dir="ltr" inputMode="tel" value={v.phone} onChange={(e) => set('phone', e.target.value)} className="text-start" />}</Field>
      <Field label={t('pt.dob')}>{(id) => <Input id={id} type="date" max={today} value={v.birthDate} onChange={(e) => set('birthDate', e.target.value)} />}</Field>
      <Field label={t('pt.gender')}>{(id) => <Select id={id} value={v.gender} onChange={(e) => set('gender', e.target.value)}><option value="">—</option><option value="male">{t('pt.male')}</option><option value="female">{t('pt.female')}</option></Select>}</Field>
      <Field label={t('new.channel')}>{(id) => <Select id={id} value={v.channel} onChange={(e) => set('channel', e.target.value)}><option value="whatsapp">WhatsApp</option><option value="telegram">Telegram</option><option value="link">{t('new.channelLink')}</option></Select>}</Field>
      {medical && <Field label={t('pt.blood')}>{(id) => <Select id={id} value={v.bloodType} onChange={(e) => set('bloodType', e.target.value)}><option value="">—</option>{BLOOD.map((b) => <option key={b}>{b}</option>)}</Select>}</Field>}
      {medical && <Field label={t('pt.allergies')}>{(id) => <Input id={id} dir="auto" value={v.allergies} onChange={(e) => set('allergies', e.target.value)} />}</Field>}
      {medical && <Field label={t('pt.chronic')}>{(id) => <Input id={id} dir="auto" value={v.chronic} onChange={(e) => set('chronic', e.target.value)} />}</Field>}
      <div className="sm:col-span-2"><Field label={t('pt.notes')}>{(id) => <div className="space-y-2"><Textarea id={id} dir="auto" rows={3} value={v.notes} onChange={(e) => set('notes', e.target.value)} maxLength={2000} />
        {medical && <Dictate lang={locale === 'ar' ? 'ar-EG' : 'en-US'} onText={(txt) => set('notes', (v.notes ? v.notes + ' ' : '') + txt)} />}</div>}</Field></div>
    </>
  );
}
