'use client';
import { useState } from 'react';
import { CalendarDays, CheckCircle2, Download, Hourglass, Timer, UserRoundX } from 'lucide-react';
import { PageHeader } from '@/components/shell';
import { Button, Card, CardHeader, Select, Skeleton, StatTile, Empty } from '@/components/ui';
import { usePrefs } from '@/components/providers';
import { useLive } from '@/lib/client';
import { fromMin } from '@/lib/time';

export function Bars({ data, label, value, color = 'var(--primary)', h = 160 }: { data: any[]; label: (d: any) => string; value: (d: any) => number; color?: string; h?: number }) {
  const max = Math.max(1, ...data.map(value));
  return (
    <div className="flex items-end gap-1.5 overflow-x-auto px-5 pb-4 pt-6 scroll-thin" style={{ height: h + 56 }} role="img" aria-label="Bar chart">
      {data.map((d, i) => <div key={i} className="flex min-w-7 flex-1 flex-col items-center justify-end gap-1.5" style={{ height: '100%' }}>
        <span className="text-[11px] font-semibold tabular-nums">{value(d)}</span>
        <div className="w-full max-w-10 rounded-t-md transition-all" style={{ height: `${Math.max(3, (value(d) / max) * h)}px`, background: color }} />
        <span className="text-[10px] text-muted">{label(d)}</span></div>)}
    </div>
  );
}
export function ReportsView({ doctorId }: { doctorId?: string }) {
  const { t } = usePrefs();
  const [days, setDays] = useState(14);
  const { data } = useLive<any>(`/api/reports?days=${days}${doctorId && doctorId !== 'me' ? `&doctorId=${doctorId}` : ''}`, '/api/events', { poll: 60000 });
  const exportCsv = () => {
    if (!data) return; const rows = [['date', 'total', 'completed', 'no_show'], ...data.daily.map((d: any) => [d.date, d.total, d.completed, d.no_show])];
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' })); a.download = `smartclinic-report-${data.to}.csv`; a.click();
  };
  const T = data?.totals;
  return (
    <>
      <div className="mb-5 flex flex-wrap justify-end gap-2"><Select value={days} onChange={(e) => setDays(Number(e.target.value))} className="!w-auto"><option value={7}>{t('rp.range7')}</option><option value={14}>{t('rp.range14')}</option><option value={30}>{t('rp.range30')}</option></Select>
        <Button variant="secondary" icon={<Download className="size-4" />} onClick={exportCsv}>{t('rp.export')}</Button></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {!T ? [0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />) : <>
          <StatTile tone="teal" icon={<CalendarDays />} label={t('rp.total')} value={T.total} /><StatTile tone="green" icon={<CheckCircle2 />} label={t('rp.completed')} value={T.completed} />
          <StatTile tone="amber" icon={<Hourglass />} label={t('rp.avgWait')} value={`${T.avg_wait}′`} /><StatTile tone="blue" icon={<Timer />} label={t('rp.avgConsult')} value={`${T.avg_consult}′`} />
          <StatTile tone="red" icon={<UserRoundX />} label={t('rp.noShowRate')} value={`${T.noShowRate}%`} /></>}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2"><CardHeader title={t('rp.daily')} />{!data ? <Skeleton className="m-5 h-48" /> : data.daily.length === 0 ? <Empty title={t('common.noData')} /> : <Bars data={data.daily} label={(d) => d.date.slice(5)} value={(d) => d.total} />}</Card>
        <Card><CardHeader title={t('rp.byHour')} />{!data ? <Skeleton className="m-5 h-48" /> : data.byHour.length === 0 ? <Empty title={t('common.noData')} /> : <Bars data={data.byHour} label={(d) => fromMin(d.hour * 60).slice(0, 2)} value={(d) => d.n} color="#65DACA" />}</Card>
        {!doctorId && <Card className="xl:col-span-2 overflow-x-auto"><CardHeader title={t('rp.byDoctor')} />
          <table className="w-full min-w-[520px] text-sm"><thead className="bg-surface text-xs text-muted"><tr>{['common.doctor', 'rp.total', 'rp.completed', 'rp.avgWait', 'rp.avgConsult'].map((k) => <th key={k} className="px-4 py-2.5 text-start font-semibold">{t(k)}</th>)}</tr></thead>
            <tbody className="divide-y divide-line">{data?.byDoctor.map((d: any) => <tr key={d.id}><td className="px-4 py-3 font-medium">{d.name}</td><td className="px-4 py-3 tabular-nums">{d.total}</td><td className="px-4 py-3 tabular-nums">{d.completed}</td><td className="px-4 py-3 tabular-nums">{d.avg_wait}′</td><td className="px-4 py-3 tabular-nums">{d.avg_consult}′</td></tr>)}</tbody></table></Card>}
        <Card><CardHeader title={t('rp.byType')} /><div className="space-y-3 p-5">{data?.byType.map((v: any) => { const max = Math.max(...data.byType.map((x: any) => x.n)); return <div key={v.visit_type}><div className="mb-1 flex justify-between text-sm"><span>{t(`visit.${v.visit_type}`)}</span><span className="font-semibold tabular-nums">{v.n}</span></div><div className="h-2 rounded-full bg-surface"><div className="h-2 rounded-full bg-primary" style={{ width: `${(v.n / max) * 100}%` }} /></div></div>; })}</div></Card>
      </div>
    </>
  );
}
