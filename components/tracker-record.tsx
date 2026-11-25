'use client';
import { useState } from 'react';
import { CalendarClock, ChevronDown, FileText, Printer, ShieldAlert } from 'lucide-react';
import { cx } from './ui';
import { usePrefs } from './providers';
import { fmtTime } from '@/lib/i18n';
import { RxPrint, ageOf, rxLabels, RxPrintData } from './rx-print';

export function RecordTab({ data, brand, onNavigate }: { data: any; brand: string; onNavigate: (token: string) => void }) {
  const { t, locale, dir } = usePrefs();
  const { record: r, clinic } = data;
  const [open, setOpen] = useState<string | null>(r.prescriptions[0]?.id ?? null);
  const [printing, setPrinting] = useState<RxPrintData | null>(null);
  const dn = (x: any) => (locale === 'ar' && x.doctorNameAr ? x.doctorNameAr : x.doctorName);
  const print = (rx: any) => {
    setPrinting({ clinicName: locale === 'ar' && clinic.nameAr ? clinic.nameAr : clinic.name, clinicAddress: clinic.address, clinicPhone: clinic.phone, brandColor: brand, doctorName: dn(rx), specialty: locale === 'ar' && rx.specialtyAr ? rx.specialtyAr : rx.specialty,
      patientName: r.profile.fullName, age: ageOf(r.profile.birthDate), date: String(rx.createdAt).slice(0, 10), diagnosis: rx.diagnosis, items: rx.items, advice: rx.advice, followUpDate: rx.followUpDate });
    setTimeout(() => window.print(), 250);
  };
  const fmtD = (d: string) => new Date(d + 'T12:00:00Z').toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  const P = r.profile; const age = ageOf(P.birthDate);
  const has = P.allergies || P.chronic || P.bloodType || age != null;

  return (
    <div className="space-y-5">
      {has && <section className="rounded-2xl border border-line bg-card p-5"><p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">{t('tr.profile')}</p>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          {age != null && <div><dt className="text-xs text-muted">{t('rx.age')}</dt><dd className="font-semibold">{age} {t('pt.years')}</dd></div>}
          {P.bloodType && <div><dt className="text-xs text-muted">{t('pt.blood')}</dt><dd className="font-semibold">{P.bloodType}</dd></div>}
          {P.allergies && <div className="col-span-2"><dt className="flex items-center gap-1 text-xs text-[var(--bad-fg)]"><ShieldAlert className="size-3.5" />{t('pt.allergies')}</dt><dd dir="auto" className="font-semibold">{P.allergies}</dd></div>}
          {P.chronic && <div className="col-span-2"><dt className="text-xs text-muted">{t('pt.chronic')}</dt><dd dir="auto" className="font-semibold">{P.chronic}</dd></div>}
        </dl></section>}

      <section>
        <h2 className="mb-2 flex items-center gap-2 text-sm font-bold"><CalendarClock className="size-4" style={{ color: brand }} />{t('tr.upcomingAll')}</h2>
        <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
          {r.upcoming.length === 0 && r.followUps.length === 0 && <p className="p-5 text-center text-sm text-muted">{t('tr.noUpcoming')}</p>}
          {r.upcoming.map((a: any) => (
            <button key={a.id} disabled={a.current} onClick={() => onNavigate(a.token)} className="flex w-full items-center gap-3 p-4 text-start transition enabled:hover:bg-surface">
              <div className="min-w-0 flex-1"><p className="font-semibold">{fmtD(a.date)} · {fmtTime(a.time, locale)}</p><p className="text-xs text-muted">{dn(a)} · {a.ticket} · {t(`visit.${a.visitType}`)}</p></div>
              {a.current ? <span className="chip chip-checked_in">{t('tr.thisAppt')}</span> : <span className="text-xs font-semibold" style={{ color: brand }}>{t('tr.open')}</span>}</button>))}
          {r.followUps.map((f: any) => (
            <div key={f.rxId} className="flex items-center gap-3 p-4"><div className="min-w-0 flex-1"><p className="font-semibold">{fmtD(f.date)}</p><p className="text-xs text-muted">{dn(f)}</p></div><span className="chip chip-in_consultation">{t('tr.followUp')}</span></div>))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 flex items-center gap-2 text-sm font-bold"><FileText className="size-4" style={{ color: brand }} />{t('tr.rx')}</h2>
        <div className="space-y-3">
          {r.prescriptions.length === 0 && <p className="rounded-2xl border border-line bg-card p-5 text-center text-sm text-muted">{t('tr.noRx')}</p>}
          {r.prescriptions.map((rx: any) => { const o = open === rx.id; return (
            <div key={rx.id} className="overflow-hidden rounded-2xl border border-line bg-card">
              <button onClick={() => setOpen(o ? null : rx.id)} aria-expanded={o} className="flex w-full items-center gap-3 p-4 text-start">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl text-lg font-extrabold text-white" style={{ background: brand }}>℞</span>
                <div className="min-w-0 flex-1"><p className="font-semibold">{String(rx.createdAt).slice(0, 10)}</p><p className="truncate text-xs text-muted">{dn(rx)}{rx.diagnosis ? ` · ${rx.diagnosis}` : ''}</p></div>
                <ChevronDown className={cx('size-5 text-muted transition', o && 'rotate-180')} /></button>
              {o && <div className="space-y-3 border-t border-line p-4">
                {rx.diagnosis && <p dir="auto" className="text-sm"><b>{t('rx.diagnosis')}:</b> {rx.diagnosis}</p>}
                <ul className="space-y-2">{rx.items.map((i: any, k: number) => (
                  <li key={k} dir="auto" className="rounded-xl bg-surface p-3 text-sm"><p className="font-bold">{i.name} {i.dose && <span className="font-normal text-muted">— {i.dose}</span>}</p>
                    {(i.frequency || i.duration) && <p className="text-muted">{[i.frequency, i.duration].filter(Boolean).join(' · ')}</p>}{i.notes && <p className="mt-0.5">{i.notes}</p>}</li>))}</ul>
                {rx.advice && <p dir="auto" className="whitespace-pre-wrap rounded-xl bg-primary-soft p-3 text-sm">{rx.advice}</p>}
                {rx.followUpDate && <p className="text-sm"><b>{t('rx.followUp')}:</b> {fmtD(rx.followUpDate)}</p>}
                <button onClick={() => print(rx)} className="inline-flex h-10 items-center gap-2 rounded-lg border border-line px-4 text-sm font-semibold hover:bg-surface"><Printer className="size-4" />{t('rx.print')}</button>
              </div>}
            </div>); })}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-bold">{t('tr.past')}</h2>
        <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
          {r.past.length === 0 && <p className="p-5 text-center text-sm text-muted">{t('tr.noPast')}</p>}
          {r.past.map((a: any) => <div key={a.id} className="flex items-center gap-3 px-4 py-3 text-sm"><div className="min-w-0 flex-1"><p className="font-medium">{fmtD(a.date)}</p><p className="truncate text-xs text-muted">{dn(a)} · {t(`visit.${a.visitType}`)}</p></div><span className={`chip chip-${a.status}`}>{t(`status.${a.status}`)}</span></div>)}
        </div>
      </section>
      <RxPrint data={printing} labels={rxLabels(t)} dir={dir} />
    </div>
  );
}
