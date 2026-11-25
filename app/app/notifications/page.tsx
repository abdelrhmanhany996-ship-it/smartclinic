'use client';
import { Bell, CalendarPlus, CheckCircle2, Clock, UserCheck, UserX, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/shell';
import { Button, Card, Empty, Skeleton, cx } from '@/components/ui';
import { usePrefs } from '@/components/providers';
import { api, useLive } from '@/lib/client';
import { notifText } from '@/lib/notiftext';
import { ago } from '@/lib/format';

const ICON: Record<string, any> = { booked: CalendarPlus, checked_in: UserCheck, delay_alert: Clock, staff_completed: CheckCircle2, staff_cancelled: XCircle, staff_no_show: UserX };
export default function Notifications() {
  const { t, locale } = usePrefs();
  const { data, reload } = useLive<any>('/api/notifications', '/api/events');
  return (
    <>
      <PageHeader title={t('nt.title')} right={<Button variant="secondary" disabled={!data?.unread} onClick={async () => { await api('/api/notifications', { method: 'POST', body: {} }); reload(); }}>{t('nt.markRead')}</Button>} />
      <Card className="divide-y divide-line">
        {!data ? <div className="p-5"><Skeleton className="h-32" /></div> : data.items.length === 0 ? <Empty icon={<Bell className="size-10" />} title={t('nt.empty')} /> : data.items.map((n: any) => {
          const I = ICON[n.kind] ?? Bell; const tx = notifText(n.kind, n.data, locale);
          return <div key={n.id} className={cx('flex items-start gap-4 px-5 py-4', !n.readAt && 'bg-primary-soft/50')}>
            <span className={cx('grid size-10 shrink-0 place-items-center rounded-xl', n.kind === 'delay_alert' || n.kind.includes('no_show') || n.kind.includes('cancel') ? 'bg-[var(--wait-bg)] text-[var(--wait-fg)]' : 'bg-primary-soft text-primary')}><I className="size-5" /></span>
            <div className="min-w-0 flex-1"><p className="font-semibold">{tx.title}</p><p className="text-sm text-muted">{tx.body}</p></div><span className="shrink-0 text-xs text-muted">{ago(n.createdAt, locale)}</span></div>; })}
      </Card>
    </>
  );
}
