'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AlarmClock, BellRing, CalendarCheck2, CheckCircle2, Clock4, Download, MapPin, Phone, Share, Smartphone, Stethoscope, UserX, XCircle, Bell, Hourglass, Footprints, ShieldCheck } from 'lucide-react';
import { Logo, PrefsToggles, Skeleton, cx, LiveDot } from './ui';
import { usePrefs } from './providers';
import { api, useLive } from '@/lib/client';
import { fmtTime } from '@/lib/i18n';
import { notifText } from '@/lib/notiftext';
import { toMin } from '@/lib/time';
import { ago } from '@/lib/format';

const b64 = (s: string) => { const p = '='.repeat((4 - (s.length % 4)) % 4); const r = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from([...r].map((c) => c.charCodeAt(0))); };

export default function Tracker({ token }: { token: string }) {
  const { t, locale } = usePrefs();
  const { data, error, connected, setData } = useLive<any>(`/api/track/${token}`, `/api/track/${token}/events`, { poll: 20000 });
  const [tab, setTab] = useState<'queue' | 'notes'>('queue');
  const [banner, setBanner] = useState<{ id: number; kind: string; data: any } | null>(null);
  const seen = useRef<Set<number> | null>(null);

  // PWA: per-appointment manifest + service worker
  useEffect(() => {
    const l = document.createElement('link'); l.rel = 'manifest'; l.href = `/t/${token}/manifest.webmanifest`; document.head.appendChild(l);
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
    return () => { l.remove(); };
  }, [token]);

  // In-app notification fallback: banner + vibration + (when allowed) system notification
  useEffect(() => {
    if (!data) return;
    const ids = new Set<number>(data.notifications.map((n: any) => n.id));
    if (seen.current) {
      const fresh = data.notifications.filter((n: any) => !seen.current!.has(n.id));
      if (fresh.length) {
        const n = fresh[0]; setBanner(n); setTimeout(() => setBanner((b) => (b?.id === n.id ? null : b)), 9000);
        try { navigator.vibrate?.([200, 100, 200]); } catch {}
        if (document.hidden && 'Notification' in window && Notification.permission === 'granted') { const x = notifText(n.kind, n.data, locale); try { new Notification(x.title, { body: x.body, tag: n.kind, icon: '/icons/icon-192.png' }); } catch {} }
      }
    } else if (data.clinic.language && !document.cookie.includes('sc_locale')) { /* first visit: nothing */ }
    seen.current = ids;
  }, [data, locale]);

  const unread = data?.notifications.filter((n: any) => !n.read_at).length ?? 0;
  const openNotes = async () => { setTab('notes'); if (unread) { await api(`/api/track/${token}/read`, { method: 'POST', body: {} }).catch(() => {}); setData((d: any) => d && { ...d, notifications: d.notifications.map((n: any) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })) }); } };

  if (error && !data) return (
    <div className="grid min-h-dvh place-items-center p-6 text-center"><div className="space-y-3"><Logo /><XCircle className="mx-auto size-14 text-danger" /><h1 className="text-xl font-bold">{t('tr.notFound')}</h1><p className="text-muted">{t('tr.notFoundSub')}</p></div></div>);
  if (!data) return <div className="mx-auto max-w-md space-y-4 p-4"><Skeleton className="h-16" /><Skeleton className="h-72" /><Skeleton className="h-40" /></div>;

  const { clinic, appointment: a, queue: q } = data;
  const brand = clinic.brandColor || '#087E83';
  const clinicName = locale === 'ar' && clinic.nameAr ? clinic.nameAr : clinic.name;
  const docName = locale === 'ar' && a.doctor.nameAr ? a.doctor.nameAr : a.doctor.name;
  const spec = locale === 'ar' && a.doctor.specialtyAr ? a.doctor.specialtyAr : a.doctor.specialty;
  const live = ['booked', 'checked_in'].includes(a.status);
  const upcoming = live && q.isToday && q.ahead != null && q.ahead <= (clinic.threshold ?? 1);
  const delayed = live && q.delayMin >= 10;
  const minsLeft = q.estimatedTime && q.now ? Math.max(0, Math.round(toMin(q.estimatedTime) - toMin(q.now))) : null;

  type Hero = { tone: string; icon: React.ReactNode; title: string; sub?: string };
  const hero: Hero | null =
    a.status === 'in_consultation' ? { tone: 'turn', icon: <Stethoscope className="size-7" />, title: t('tr.yourTurn'), sub: t('tr.yourTurnSub') }
    : a.status === 'completed' ? { tone: 'done', icon: <CheckCircle2 className="size-7" />, title: t('tr.completed'), sub: t('tr.completedSub') }
    : a.status === 'cancelled' ? { tone: 'bad', icon: <XCircle className="size-7" />, title: t('tr.cancelled'), sub: t('tr.cancelledSub') }
    : a.status === 'no_show' ? { tone: 'bad', icon: <UserX className="size-7" />, title: t('tr.noShow') }
    : a.status === 'skipped' ? { tone: 'warn', icon: <Footprints className="size-7" />, title: t('tr.skipped'), sub: t('tr.skippedSub') }
    : upcoming ? { tone: 'soon', icon: <BellRing className="size-7" />, title: t('tr.upcoming'), sub: t('tr.upcomingSub') }
    : delayed ? { tone: 'warn', icon: <AlarmClock className="size-7" />, title: t('tr.delayed'), sub: t('tr.delayedBy', { n: q.delayMin }) } : null;
  const toneCls: Record<string, string> = { turn: 'bg-[#12724A] text-white', done: 'bg-[var(--done-bg)] text-[var(--done-fg)]', bad: 'bg-[var(--bad-bg)] text-[var(--bad-fg)]', warn: 'bg-[var(--wait-bg)] text-[var(--wait-fg)]', soon: 'bg-[#0B6AA8] text-white' };

  const date = new Date(a.date + 'T12:00:00Z').toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
  return (
    <div className="min-h-dvh bg-surface">
      <header className="sticky top-0 z-30 text-white shadow-md" style={{ background: brand }}>
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3"><div className="min-w-0"><p className="truncate text-[15px] font-bold leading-tight">{clinicName}</p><p className="truncate text-xs opacity-85">{clinic.tagline}</p></div>
          <div className="flex items-center gap-1 [&_button]:!text-white [&_button:hover]:!bg-white/15"><PrefsToggles /></div></div>
        <div className="mx-auto flex max-w-md border-t border-white/20 text-sm font-semibold">
          {([['queue', t('nav.queue')], ['notes', t('tr.notifications')]] as const).map(([k, l]) => <button key={k} onClick={() => (k === 'notes' ? openNotes() : setTab('queue'))} aria-pressed={tab === k} className={cx('relative flex-1 py-2.5 transition', tab === k ? 'text-white' : 'text-white/70')}>{l}{k === 'notes' && unread > 0 && <span className="ms-1.5 rounded-full bg-[#F5C451] px-1.5 text-[11px] font-bold text-[#102A43]">{unread}</span>}{tab === k && <span className="absolute inset-x-6 bottom-0 h-0.5 rounded bg-white" />}</button>)}</div>
      </header>

      {banner && <button onClick={openNotes} className="slide-up fixed inset-x-3 top-24 z-40 mx-auto flex max-w-md items-start gap-3 rounded-2xl border border-line bg-card p-4 text-start shadow-2xl" role="alert">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl text-white" style={{ background: brand }}><Bell className="size-5" /></span>
        <span><span className="block font-bold">{notifText(banner.kind, banner.data, locale).title}</span><span className="text-sm text-muted">{notifText(banner.kind, banner.data, locale).body}</span></span></button>}

      <main className="mx-auto max-w-md space-y-4 p-4 pb-24">
        {tab === 'queue' ? <>
          <div className="flex items-center justify-between"><p className="text-sm text-muted">{t('tr.hello')}, <b className="text-ink">{a.patient.split(' ')[0]}</b></p><LiveDot ok={connected} /></div>
          {hero && <div className={cx('slide-up flex items-start gap-4 rounded-2xl p-5', toneCls[hero.tone], hero.tone === 'turn' && 'pulse')} role="status"><div className="mt-0.5">{hero.icon}</div><div><p className="text-lg font-bold leading-tight">{hero.title}</p>{hero.sub && <p className="mt-1 text-sm opacity-90">{hero.sub}</p>}</div></div>}

          {/* ticket + live position */}
          <section className="overflow-hidden rounded-2xl border border-line bg-card shadow-sm">
            <div className="flex items-center justify-between px-5 pt-5"><div><p className="text-xs font-medium text-muted">{t('tr.yourQueue')}</p><p className="text-5xl font-extrabold tracking-tight" style={{ color: brand }}>{a.ticket}</p></div>
              <span className={`chip chip-${a.status}`}>{t(`status.${a.status}`)}</span></div>
            {live && q.isToday && <div className="px-5 pb-5 pt-4">
              <div className="flex items-end gap-3"><span className="text-6xl font-extrabold leading-none tabular-nums" key={q.ahead} style={{ animation: 'pop .3s ease-out' }}>{q.ahead}</span><span className="pb-1.5 text-lg font-semibold text-muted">{q.ahead === 1 ? t('tr.aheadOne') : t('tr.ahead')}</span></div>
              <div className="mt-4 flex flex-wrap items-center gap-1.5" aria-hidden>{Array.from({ length: Math.min(q.ahead, 8) }).map((_, i) => <span key={i} className="grid size-7 place-items-center rounded-full bg-surface text-muted"><Hourglass className="size-3.5" /></span>)}{q.ahead > 8 && <span className="text-xs text-muted">+{q.ahead - 8}</span>}<span className="grid size-7 place-items-center rounded-full text-white" style={{ background: brand }}><CheckCircle2 className="size-4" /></span></div>
              {q.nowServing && <p className="mt-3 text-sm text-muted">{t('tr.nowServing')}: <b className="text-ink">{q.nowServing}</b></p>}
            </div>}
            {!q.isToday && live && <p className="px-5 pb-5 pt-3 text-sm text-muted">{t('tr.futureDay', { date })}</p>}
            {a.status === 'in_consultation' && <p className="px-5 pb-5 pt-3 text-sm font-semibold text-[#12724A]">{t('tr.inRoom')}</p>}
          </section>

          {/* original vs estimated — always separate */}
          <section className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-line bg-card p-4"><p className="flex items-center gap-1.5 text-xs font-medium text-muted"><CalendarCheck2 className="size-4" />{t('tr.original')}</p><p className="mt-1 text-2xl font-bold tabular-nums">{fmtTime(a.time, locale)}</p><p className="text-xs text-muted">{date}</p></div>
            <div className={cx('rounded-2xl border p-4', delayed ? 'border-[var(--wait-fg)]/40 bg-[var(--wait-bg)]' : 'border-line bg-card')}><p className={cx('flex items-center gap-1.5 text-xs font-medium', delayed ? 'text-[var(--wait-fg)]' : 'text-muted')}><Clock4 className="size-4" />{t('tr.estimated')}</p>
              <p className={cx('mt-1 text-2xl font-bold tabular-nums', delayed && 'text-[var(--wait-fg)]')}>{live && q.estimatedTime ? fmtTime(q.estimatedTime, locale) : '—'}</p>
              <p className={cx('text-xs', delayed ? 'font-semibold text-[var(--wait-fg)]' : 'text-muted')}>{live && q.isToday ? (delayed ? t('tr.delayedBy', { n: q.delayMin }) : minsLeft != null ? `≈ ${minsLeft} ${t('common.min')}` : t('tr.onTime')) : ' '}</p></div>
          </section>

          <section className="divide-y divide-line rounded-2xl border border-line bg-card text-sm">
            <Row k={t('tr.doctor')} v={<span>{docName}<span className="block text-xs text-muted">{spec}</span></span>} />
            <Row k={t('tr.visit')} v={t(`visit.${a.visitType}`)} />
            {q.isToday && live && <Row k={t('tr.waitingTotal')} v={q.totalWaiting} />}
          </section>

          <Install brand={brand} />
          <Push token={token} pushKey={data.pushKey} />

          <section className="rounded-2xl border border-line bg-card p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">{t('tr.clinic')}</p>
            <p className="font-bold">{clinicName}</p>
            {clinic.address && <p className="mt-1 flex items-start gap-2 text-sm text-muted"><MapPin className="mt-0.5 size-4 shrink-0" />{clinic.address}</p>}
            <div className="mt-4 grid grid-cols-2 gap-2">
              {clinic.phone && <a href={`tel:${clinic.phone.replace(/[^\d+]/g, '')}`} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-line text-sm font-semibold hover:bg-surface"><Phone className="size-4" />{t('tr.call')}</a>}
              {clinic.address && <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinic.name + ' ' + clinic.address)}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg text-sm font-semibold text-white" style={{ background: brand }}><MapPin className="size-4" />{t('tr.directions')}</a>}
            </div>
          </section>
          <p className="flex items-center justify-center gap-1.5 pt-2 text-center text-xs text-muted"><ShieldCheck className="size-3.5" />{t('tr.privacy')}</p>
        </> : (
          <section className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
            {data.notifications.length === 0 && <p className="p-8 text-center text-muted">{t('tr.noNotifs')}</p>}
            {data.notifications.map((n: any) => { const x = notifText(n.kind, n.data, locale); return (
              <div key={n.id} className="flex items-start gap-3 p-4"><span className="grid size-9 shrink-0 place-items-center rounded-xl text-white" style={{ background: ['delay', 'skipped', 'cancelled', 'no_show'].includes(n.kind) ? '#B7791F' : brand }}><Bell className="size-4" /></span>
                <div className="min-w-0 flex-1"><p className="font-semibold">{x.title}</p><p className="text-sm text-muted">{x.body}</p></div><span className="shrink-0 text-xs text-muted">{ago(n.created_at, locale)}</span></div>); })}
          </section>)}
      </main>
    </div>
  );
}
const Row = ({ k, v }: { k: string; v: React.ReactNode }) => <div className="flex items-start justify-between gap-4 px-5 py-3.5"><span className="text-muted">{k}</span><span className="text-end font-semibold">{v}</span></div>;

function Install({ brand }: { brand: string }) {
  const { t } = usePrefs();
  const [ev, setEv] = useState<any>(null); const [ios, setIos] = useState(false); const [standalone, setStandalone] = useState(true); const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    setStandalone(window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream);
    try { setDismissed(localStorage.getItem('sc_install_dismissed') === '1'); } catch {}
    const h = (e: Event) => { e.preventDefault(); setEv(e); }; window.addEventListener('beforeinstallprompt', h); return () => window.removeEventListener('beforeinstallprompt', h);
  }, []);
  if (standalone || dismissed || (!ev && !ios)) return null;
  return (
    <section className="flex items-center gap-4 rounded-2xl border border-line bg-card p-4"><span className="grid size-12 shrink-0 place-items-center rounded-xl text-white" style={{ background: brand }}><Smartphone className="size-6" /></span>
      <div className="min-w-0 flex-1"><p className="font-bold">{t('tr.install')}</p><p className="text-xs text-muted">{ev ? t('tr.installSub') : <span className="inline-flex items-center gap-1">{t('tr.installIos')}<Share className="inline size-3.5" /></span>}</p></div>
      {ev ? <button onClick={async () => { ev.prompt(); await ev.userChoice; setEv(null); }} className="inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-white" style={{ background: brand }}><Download className="size-4" />{t('tr.installBtn')}</button>
        : <button aria-label="Dismiss" onClick={() => { setDismissed(true); try { localStorage.setItem('sc_install_dismissed', '1'); } catch {} }} className="p-2 text-muted"><XCircle className="size-5" /></button>}</section>
  );
}

function Push({ token, pushKey }: { token: string; pushKey: string | null }) {
  const { t, toast } = usePrefs();
  const [perm, setPerm] = useState<string>('unsupported');
  useEffect(() => { if ('Notification' in window) setPerm(Notification.permission); }, []);
  const enable = useCallback(async () => {
    try {
      const p = await Notification.requestPermission(); setPerm(p); if (p !== 'granted') return;
      if (pushKey && 'serviceWorker' in navigator && 'PushManager' in window) {
        const reg = await navigator.serviceWorker.ready;
        const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(pushKey) }));
        await api(`/api/track/${token}/push`, { body: sub.toJSON() });
      }
    } catch (e: any) { toast(e.message || 'Error', 'err'); }
  }, [token, pushKey, toast]);
  useEffect(() => { // re-register silently on revisit
    if (perm === 'granted' && pushKey && 'serviceWorker' in navigator) navigator.serviceWorker.ready.then((r) => r.pushManager.getSubscription()).then((s) => s && api(`/api/track/${token}/push`, { body: s.toJSON() })).catch(() => {});
  }, [perm, pushKey, token]);
  if (perm === 'unsupported') return null;
  if (perm === 'granted') return <p className="flex items-center justify-center gap-2 rounded-2xl bg-[var(--done-bg)] p-3 text-sm font-semibold text-[var(--done-fg)]"><BellRing className="size-4" />{t('tr.pushOn')}</p>;
  if (perm === 'denied') return <p className="rounded-2xl bg-surface p-3 text-center text-xs text-muted">{t('tr.pushBlocked')}</p>;
  return <button onClick={enable} className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line bg-card p-4 text-sm font-bold hover:bg-surface"><BellRing className="size-5" />{t('tr.enablePush')}</button>;
}
