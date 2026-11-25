'use client';
import { FormEvent, Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CalendarCheck2, Smartphone, MessageCircle } from 'lucide-react';
import { Button, Field, Input, Logo, PrefsToggles } from '@/components/ui';
import { usePrefs } from '@/components/providers';
import { api } from '@/lib/client';

const DEMOS = [
  { label: 'Receptionist', email: 'reception@nilecare.demo', pw: 'Demo@123' },
  { label: 'Doctor', email: 'sara@nilecare.demo', pw: 'Demo@123' },
];

function Form() {
  const { t } = usePrefs();
  const next = useSearchParams().get('next');
  const [email, setEmail] = useState(''); const [pw, setPw] = useState('');
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr('');
    try { const r = await api<{ home: string }>('/api/auth/login', { body: { email, password: pw } }); window.location.href = next && next.startsWith('/') ? next : r.home; }
    catch (x: any) { setErr(x.message); setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label={t('common.email')}>{(id) => <Input id={id} type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@clinic.com" dir="ltr" />}</Field>
      <Field label={t('common.password')}>{(id) => <Input id={id} type="password" autoComplete="current-password" required value={pw} onChange={(e) => setPw(e.target.value)} dir="ltr" />}</Field>
      {err && <p role="alert" className="rounded-lg bg-[var(--bad-bg)] px-3 py-2 text-sm text-[var(--bad-fg)]">{err}</p>}
      <Button type="submit" size="lg" loading={busy} className="w-full">{t('login.cta')}</Button>
      <div className="pt-4"><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{t('login.demo')}</p>
        <div className="flex flex-wrap gap-2">{DEMOS.map((d) => <button type="button" key={d.email} onClick={() => { setEmail(d.email); setPw(d.pw); }} className="rounded-full border border-line px-3 py-1.5 text-xs font-medium hover:bg-surface">{d.label}</button>)}</div></div>
    </form>
  );
}

export default function Login() {
  const { t } = usePrefs();
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-12 text-white lg:flex">
        <div className="absolute -end-24 -top-24 size-96 rounded-full bg-primary/30 blur-3xl" /><div className="absolute -bottom-32 -start-24 size-96 rounded-full bg-[#65DACA]/10 blur-3xl" />
        <Logo size={44} light />
        <div className="relative space-y-8">
          <h1 className="max-w-md text-4xl font-bold leading-tight">{t('login.hero')}</h1>
          <ul className="space-y-4 text-lg text-sidebar-fg">
            {[[Smartphone, 'login.f1'], [CalendarCheck2, 'login.f2'], [MessageCircle, 'login.f3']].map(([I, k]: any) => <li key={k} className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-white/10"><I className="size-5 text-[#65DACA]" /></span>{t(k)}</li>)}
          </ul>
        </div>
        <p className="relative text-sm text-sidebar-fg">{t('brand.tagline')}</p>
      </div>
      <div className="flex flex-col px-6 py-6 sm:px-12">
        <div className="flex items-center justify-between"><span className="lg:hidden"><Logo /></span><span className="ms-auto"><PrefsToggles /></span></div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <h2 className="text-3xl font-bold tracking-tight">{t('login.title')}</h2><p className="mb-8 mt-2 text-muted">{t('login.sub')}</p>
          <Suspense><Form /></Suspense>
        </div>
      </div>
    </div>
  );
}
