import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import './globals.css';
import { Providers } from '@/components/providers';
import { Pwa } from '@/components/pwa';

export const metadata: Metadata = {
  title: { default: 'SmartClinic — Less Waiting. Better Care.', template: '%s · SmartClinic' },
  description: 'Real-time clinic appointments and patient queue management.',
  manifest: '/manifest.webmanifest',
  applicationName: 'SmartClinic',
  appleWebApp: { capable: true, title: 'SmartClinic', statusBarStyle: 'default' },
  icons: { icon: '/icons/icon.svg', apple: '/icons/apple-touch-icon.png' },
};
export const viewport: Viewport = { themeColor: '#087E83', width: 'device-width', initialScale: 1, viewportFit: 'cover' };

// Applies the saved/system theme before paint (no flash)
const themeScript = `(function(){try{var m=document.cookie.match(/sc_theme=(\\w+)/);var d=m?m[1]==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const c = await cookies();
  const locale = c.get('sc_locale')?.value === 'ar' ? 'ar' : 'en';
  const theme = (c.get('sc_theme')?.value as 'light' | 'dark' | undefined) ?? null;
  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'} className={theme === 'dark' ? 'dark' : ''} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body><Providers locale={locale} theme={theme}>{children}<Pwa /></Providers></body>
    </html>
  );
}
