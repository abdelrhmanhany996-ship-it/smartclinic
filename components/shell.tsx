'use client';
import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, BarChart3, Building2, CalendarDays, CalendarPlus, CreditCard, LayoutGrid, LogOut, Menu, Settings, Stethoscope, Timer, Users, UsersRound, X, UserCog } from 'lucide-react';
import { Logo, PrefsToggles, cx } from './ui';
import { InstallButton } from './install-button';
import { usePrefs } from './providers';
import { api, useLive } from '@/lib/client';

type Item = { href: string; key: string; icon: ReactNode };
const NAV: Record<string, Item[]> = {
  receptionist: [
    { href: '/app/overview', key: 'nav.overview', icon: <LayoutGrid /> },
    { href: '/app/calendar', key: 'nav.calendar', icon: <CalendarDays /> },
    { href: '/app/new', key: 'nav.new', icon: <CalendarPlus /> },
    { href: '/app/queue', key: 'nav.queue', icon: <Timer /> },
    { href: '/app/patients', key: 'nav.patients', icon: <Users /> },
    { href: '/app/notifications', key: 'nav.notifications', icon: <Bell /> },
    { href: '/app/reports', key: 'nav.reports', icon: <BarChart3 /> },
    { href: '/app/settings', key: 'nav.settings', icon: <Settings /> },
  ],
  doctor: [
    { href: '/doctor', key: 'nav.today', icon: <Stethoscope /> },
    { href: '/doctor/stats', key: 'nav.stats', icon: <BarChart3 /> },
    { href: '/doctor/schedule', key: 'nav.schedule', icon: <Settings /> },
  ],
  super_admin: [
    { href: '/admin', key: 'nav.platform', icon: <LayoutGrid /> },
    { href: '/admin/clinics', key: 'nav.clinics', icon: <Building2 /> },
    { href: '/admin/accounts', key: 'nav.accounts', icon: <UserCog /> },
    { href: '/admin/subscriptions', key: 'nav.subscriptions', icon: <CreditCard /> },
  ],
};

export function Shell({ role, children }: { role: 'receptionist' | 'doctor' | 'super_admin'; children: ReactNode }) {
  const { t, locale } = usePrefs();
  const path = usePathname(); const router = useRouter();
  const [open, setOpen] = useState(false);
  const me = useLive<{ user: { name: string }; clinic: { name: string; nameAr?: string; brandColor: string } | null }>('/api/auth/me', null);
  const notes = useLive<{ unread: number }>(role === 'super_admin' ? null : '/api/notifications', role === 'super_admin' ? null : '/api/events');
  useEffect(() => setOpen(false), [path]);
  const items = NAV[role];
  const active = (h: string) => (h === '/doctor' || h === '/admin' ? path === h : path.startsWith(h));
  const out = async () => { await api('/api/auth/logout', { method: 'POST', body: {} }); router.push('/login'); };

  const nav = (
    <>
      <div className="flex h-16 items-center justify-between px-5"><Logo light /><button className="text-sidebar-fg lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu"><X /></button></div>
      {me.data?.clinic && <div className="mx-4 mb-3 rounded-xl bg-white/5 px-3 py-2 text-xs text-sidebar-fg"><span className="opacity-70">{t('common.clinic')}</span><p className="truncate text-sm font-semibold text-white">{locale === 'ar' && me.data.clinic.nameAr ? me.data.clinic.nameAr : me.data.clinic.name}</p></div>}
      <nav className="flex-1 space-y-1 px-3" aria-label="Main">
        {items.map((i) => (
          <Link key={i.href} href={i.href} aria-current={active(i.href) ? 'page' : undefined}
            className={cx('flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition [&>svg]:size-5', active(i.href) ? 'bg-sidebar-active text-white shadow' : 'text-sidebar-fg hover:bg-white/8 hover:text-white')}>
            {i.icon}<span className="flex-1">{t(i.key)}</span>
            {i.key === 'nav.notifications' && !!notes.data?.unread && <span className="grid min-w-5 place-items-center rounded-full bg-[#F5C451] px-1.5 text-[11px] font-bold text-[#102A43]">{notes.data.unread}</span>}
          </Link>
        ))}
      </nav>
      <div className="border-t border-white/10 p-4">
        <div className="mb-2 flex items-center gap-3"><div className="grid size-9 place-items-center rounded-full bg-primary text-sm font-bold text-primary-fg">{me.data?.user.name?.[0] ?? '·'}</div>
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-white">{me.data?.user.name ?? '…'}</p></div></div>
        <InstallButton className="mb-1" />
        <button onClick={out} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-sidebar-fg hover:bg-white/10 hover:text-white"><LogOut className="size-4 rtl:-scale-x-100" />{t('common.signout')}</button>
      </div>
    </>
  );
  return (
    <div className="min-h-dvh bg-bg">
      <aside className="fixed inset-y-0 start-0 z-30 hidden w-64 flex-col bg-sidebar lg:flex">{nav}</aside>
      {open && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={cx('fixed inset-y-0 start-0 z-50 flex w-72 flex-col bg-sidebar transition-transform lg:hidden', open ? 'translate-x-0' : 'ltr:-translate-x-full rtl:translate-x-full')}>{nav}</aside>
      <div className="lg:ps-64">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-line bg-bg/90 px-4 backdrop-blur lg:hidden">
          <button onClick={() => setOpen(true)} aria-label="Menu" className="grid size-9 place-items-center rounded-lg hover:bg-surface"><Menu /></button><Logo size={28} /><PrefsToggles />
        </header>
        <div className="hidden items-center justify-end px-8 pt-4 lg:flex"><PrefsToggles /></div>
        <main className="mx-auto max-w-[1400px] px-4 pb-16 pt-4 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">{title}</h1>{sub && <p className="mt-1 text-sm text-muted">{sub}</p>}</div><div className="flex flex-wrap items-center gap-2">{right}</div></div>;
}
