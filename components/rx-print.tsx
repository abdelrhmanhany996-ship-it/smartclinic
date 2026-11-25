'use client';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { fmtTime } from '@/lib/i18n';

export interface RxPrintData { clinicName: string; clinicAddress?: string | null; clinicPhone?: string | null; brandColor?: string; doctorName: string; specialty?: string | null; patientName: string; age?: number | null; gender?: string | null;
  date: string; diagnosis?: string | null; items: { name: string; dose?: string; frequency?: string; duration?: string; notes?: string }[]; advice?: string | null; followUpDate?: string | null }

/** Printable prescription (A5). Rendered into <body> and shown only by @media print (see globals.css). */
export function RxPrint({ data, labels, dir }: { data: RxPrintData | null; labels: Record<string, string>; dir: 'rtl' | 'ltr' }) {
  useEffect(() => { /* mount flag so SSR never renders the portal */ }, []);
  if (!data || typeof document === 'undefined') return null;
  const c = data.brandColor || '#087E83';
  return createPortal(
    <div id="rx-print" dir={dir}>
      <div style={{ borderBottom: `3px solid ${c}`, paddingBottom: 8, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div><div style={{ fontSize: 20, fontWeight: 800, color: c }}>{data.clinicName}</div><div style={{ fontSize: 11 }}>{[data.clinicAddress, data.clinicPhone].filter(Boolean).join(' · ')}</div></div>
        <div style={{ textAlign: dir === 'rtl' ? 'left' : 'right', fontSize: 12 }}><b>{data.doctorName}</b><div>{data.specialty}</div></div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 10 }}>
        <span><b>{labels.patient}:</b> {data.patientName}{data.age != null && ` — ${labels.age}: ${data.age}`}</span><span>{data.date}</span>
      </div>
      {data.diagnosis && <p style={{ margin: '6px 0', fontSize: 13 }}><b>{labels.diagnosis}:</b> {data.diagnosis}</p>}
      <div style={{ fontSize: 26, fontWeight: 800, color: c, margin: '8px 0' }}>℞</div>
      <ol style={{ paddingInlineStart: 20, margin: 0 }}>
        {data.items.map((i, k) => (
          <li key={k} style={{ marginBottom: 8 }}><b style={{ fontSize: 14 }}>{i.name}</b> {i.dose && <span>— {i.dose}</span>}
            <div style={{ fontSize: 12 }}>{[i.frequency, i.duration].filter(Boolean).join(' · ')}{i.notes ? ` — ${i.notes}` : ''}</div></li>))}
      </ol>
      {data.advice && <p style={{ marginTop: 12, whiteSpace: 'pre-wrap', fontSize: 12 }}><b>{labels.advice}:</b> {data.advice}</p>}
      {data.followUpDate && <p style={{ fontSize: 12 }}><b>{labels.followUp}:</b> {data.followUpDate}</p>}
      <div style={{ position: 'absolute', bottom: '16mm', insetInlineEnd: '16mm', width: 160, borderTop: '1px solid #000', paddingTop: 4, fontSize: 11, textAlign: 'center' }}>{labels.signature}</div>
    </div>, document.body);
}
export const rxLabels = (t: (k: string) => string) => ({ patient: t('rx.patient'), age: t('rx.age'), diagnosis: t('rx.diagnosis'), advice: t('rx.advice'), followUp: t('rx.followUp'), signature: t('rx.signature') });
export const ageOf = (birth?: string | null) => { if (!birth) return null; const d = new Date(birth), n = new Date(); let a = n.getFullYear() - d.getFullYear(); if (n < new Date(n.getFullYear(), d.getMonth(), d.getDate())) a--; return a; };
void fmtTime;
