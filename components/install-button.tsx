'use client';
import { useEffect, useState } from 'react';
import { Download, Share } from 'lucide-react';
import { usePrefs } from './providers';

/** "Install app" for staff dashboards: native prompt on Chrome/Edge/Android, instructions on iOS. Hidden when already installed. */
export function InstallButton({ className = '' }: { className?: string }) {
  const { t, locale } = usePrefs();
  const [ev, setEv] = useState<any>(null); const [ios, setIos] = useState(false); const [installed, setInstalled] = useState(true); const [hint, setHint] = useState(false);
  useEffect(() => {
    setInstalled(window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    const h = (e: Event) => { e.preventDefault(); setEv(e); };
    const done = () => { setInstalled(true); setEv(null); };
    window.addEventListener('beforeinstallprompt', h); window.addEventListener('appinstalled', done);
    return () => { window.removeEventListener('beforeinstallprompt', h); window.removeEventListener('appinstalled', done); };
  }, []);
  if (installed || (!ev && !ios)) return null;
  return (
    <div className={className}>
      <button onClick={async () => { if (ev) { ev.prompt(); await ev.userChoice; setEv(null); } else setHint((x) => !x); }}
        className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-sidebar-fg hover:bg-white/10 hover:text-white"><Download className="size-4" />{t('tr.install')}</button>
      {hint && <p className="mt-1 flex items-start gap-1.5 rounded-lg bg-white/10 p-2 text-xs text-white" dir={locale === 'ar' ? 'rtl' : 'ltr'}><Share className="mt-0.5 size-3.5 shrink-0" />{t('tr.installIos')}</p>}
    </div>
  );
}
