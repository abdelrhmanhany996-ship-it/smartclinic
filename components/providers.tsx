'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Locale, translate } from '@/lib/i18n';

type Theme = 'light' | 'dark';
interface Prefs { locale: Locale; theme: Theme; t: (k: string, v?: Record<string, string | number>) => string; setLocale: (l: Locale) => void; setTheme: (t: Theme) => void; dir: 'rtl' | 'ltr'; toast: (msg: string, kind?: 'ok' | 'err') => void }
const Ctx = createContext<Prefs>(null as any);
export const usePrefs = () => useContext(Ctx);

const setCookie = (k: string, v: string) => { document.cookie = `${k}=${v}; path=/; max-age=31536000; samesite=lax`; };

export function Providers({ children, locale: l0, theme: t0 }: { children: React.ReactNode; locale: Locale; theme: Theme | null }) {
  const [locale, _setLocale] = useState<Locale>(l0);
  const [theme, _setTheme] = useState<Theme>(t0 ?? 'light');
  const [toasts, setToasts] = useState<{ id: number; msg: string; kind: string }[]>([]);

  useEffect(() => { if (!t0) _setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light'); }, [t0]);
  const setLocale = useCallback((l: Locale) => { _setLocale(l); setCookie('sc_locale', l); document.documentElement.lang = l; document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr'; }, []);
  const setTheme = useCallback((t: Theme) => { _setTheme(t); setCookie('sc_theme', t); document.documentElement.classList.toggle('dark', t === 'dark'); const m = document.querySelector('meta[name=theme-color]'); m?.setAttribute('content', t === 'dark' ? '#071D2D' : '#087E83'); }, []);
  const toast = useCallback((msg: string, kind: 'ok' | 'err' = 'ok') => {
    const id = Date.now() + Math.random();
    setToasts((x) => [...x.slice(-3), { id, msg, kind }]);
    setTimeout(() => setToasts((x) => x.filter((y) => y.id !== id)), 4000);
  }, []);
  const value = useMemo<Prefs>(() => ({ locale, theme, setLocale, setTheme, dir: locale === 'ar' ? 'rtl' : 'ltr', toast, t: (k, v) => translate(locale, k, v) }), [locale, theme, setLocale, setTheme, toast]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4">
        {toasts.map((x) => (
          <div key={x.id} role="status" className={`pop pointer-events-auto max-w-md rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${x.kind === 'err' ? 'bg-[#B42318] text-white' : 'bg-[#102A43] text-white dark:bg-[#65DACA] dark:text-[#071D2D]'}`}>{x.msg}</div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
