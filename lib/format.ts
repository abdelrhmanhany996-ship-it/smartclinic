export function ago(d: string, locale: string) {
  const s = Math.max(0, (Date.now() - new Date(d).getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale === 'ar' ? 'ar' : 'en', { numeric: 'auto' });
  return s < 60 ? rtf.format(0, 'second') : s < 3600 ? rtf.format(-Math.floor(s / 60), 'minute') : s < 86400 ? rtf.format(-Math.floor(s / 3600), 'hour') : rtf.format(-Math.floor(s / 86400), 'day');
}
