'use client';
import { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes, useEffect, useId } from 'react';
import clsx from 'clsx';
import { Languages, Loader2, Moon, Sun, X } from 'lucide-react';
import { usePrefs } from './providers';
import { fmtTime } from '@/lib/i18n';

export const cx = clsx;

export function Logo({ size = 36, text = true, light = false }: { size?: number; text?: boolean; light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden><rect width="48" height="48" rx="12" fill="#087E83" /><path d="M20 11h8v9h9v8h-9v9h-8v-9h-9v-8h9z" fill="#fff" /></svg>
      {text && <span className={cx('text-xl font-bold tracking-tight', light ? 'text-white' : 'text-ink')}>SmartClinic</span>}
    </span>
  );
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft'; size?: 'sm' | 'md' | 'lg'; loading?: boolean; icon?: ReactNode };
export function Button({ variant = 'primary', size = 'md', loading, icon, className, children, disabled, ...p }: BtnProps) {
  const v = {
    primary: 'bg-primary text-primary-fg hover:brightness-110 shadow-sm',
    secondary: 'border border-line bg-card text-ink hover:bg-surface',
    ghost: 'text-ink hover:bg-surface',
    soft: 'bg-primary-soft text-primary hover:brightness-95',
    danger: 'bg-[#B42318] text-white hover:brightness-110',
  }[variant];
  const s = { sm: 'h-8 px-2.5 text-xs gap-1.5', md: 'h-10 px-4 text-sm gap-2', lg: 'h-12 px-6 text-base gap-2' }[size];
  return (
    <button {...p} disabled={disabled || loading} className={cx('inline-flex shrink-0 items-center justify-center rounded-lg font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 active:scale-[.98]', v, s, className)}>
      {loading ? <Loader2 className="size-4 animate-spin" /> : icon}{children}
    </button>
  );
}

export function Card({ className, children, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...p} className={cx('rounded-2xl border border-line bg-card', className)}>{children}</div>;
}
export function CardHeader({ title, sub, right }: { title: ReactNode; sub?: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
      <div><h2 className="text-base font-semibold">{title}</h2>{sub && <p className="text-xs text-muted">{sub}</p>}</div>{right}
    </div>
  );
}

export function StatusChip({ status, label }: { status: string; label?: string }) {
  const { t } = usePrefs();
  const k = status === 'checked_in' ? 'waiting' : status;
  return <span className={`chip chip-${status === 'checked_in' ? 'waiting' : k}`}>{status === 'in_consultation' && <span className="size-1.5 rounded-full bg-current pulse" />}{label ?? t(`status.${status}`)}</span>;
}

export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: (id: string) => ReactNode }) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      {children(id)}
      {error ? <p className="text-xs text-danger" role="alert">{error}</p> : hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}
const inputCls = 'h-10 w-full rounded-lg border border-line bg-raised px-3 text-sm text-ink placeholder:text-muted/70 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 disabled:opacity-60';
export const Input = (p: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={cx(inputCls, p.className)} />;
export const Select = (p: SelectHTMLAttributes<HTMLSelectElement>) => <select {...p} className={cx(inputCls, 'pe-8', p.className)} />;
export const Textarea = (p: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...p} className={cx(inputCls, 'h-auto min-h-20 py-2', p.className)} />;

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const { t } = usePrefs();
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', h); document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#071D2D]/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className={cx('pop max-h-[92dvh] w-full overflow-auto rounded-t-2xl border border-line bg-card shadow-2xl sm:rounded-2xl', wide ? 'sm:max-w-2xl' : 'sm:max-w-md')}>
        <div className="flex items-center justify-between border-b border-line px-5 py-4"><h2 className="text-base font-semibold">{title}</h2>
          <button onClick={onClose} aria-label={t('common.close')} className="rounded-lg p-1.5 text-muted hover:bg-surface"><X className="size-5" /></button></div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export const Skeleton = ({ className }: { className?: string }) => <div className={cx('skeleton', className)} />;
export function Empty({ icon, title, sub, action }: { icon?: ReactNode; title: string; sub?: string; action?: ReactNode }) {
  return <div className="flex flex-col items-center gap-2 px-6 py-12 text-center"><div className="text-muted/60">{icon}</div><p className="font-semibold">{title}</p>{sub && <p className="max-w-sm text-sm text-muted">{sub}</p>}{action}</div>;
}

export function StatTile({ icon, label, value, tone = 'teal' }: { icon: ReactNode; label: string; value: ReactNode; tone?: 'teal' | 'amber' | 'blue' | 'green' | 'red' }) {
  const tones = { teal: 'bg-[var(--teal-bg)] text-[var(--teal-fg)]', amber: 'bg-[var(--wait-bg)] text-[var(--wait-fg)]', blue: 'bg-[var(--consult-bg)] text-[var(--consult-fg)]', green: 'bg-[var(--done-bg)] text-[var(--done-fg)]', red: 'bg-[var(--bad-bg)] text-[var(--bad-fg)]' }[tone];
  return (
    <div className={cx('flex items-center gap-4 rounded-2xl p-4', tones)}>
      <div className="grid size-11 place-items-center rounded-xl bg-white/60 dark:bg-white/10 [&>svg]:size-6">{icon}</div>
      <div><p className="text-xs font-medium opacity-80">{label}</p><p className="text-2xl font-bold leading-tight tabular-nums">{value}</p></div>
    </div>
  );
}

export function PrefsToggles({ className, inverted }: { className?: string; inverted?: boolean }) {
  const { locale, setLocale, theme, setTheme, t } = usePrefs();
  const b = cx('grid size-9 place-items-center rounded-lg transition', inverted ? 'text-sidebar-fg hover:bg-white/10' : 'text-muted hover:bg-surface hover:text-ink');
  return (
    <div className={cx('flex items-center gap-1', className)}>
      <button className={cx(b, 'w-auto gap-1.5 px-2 text-xs font-semibold')} onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')} aria-label={t('common.language')}><Languages className="size-4" />{locale === 'ar' ? 'EN' : 'عربي'}</button>
      <button className={b} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={t('common.theme')}>{theme === 'dark' ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}</button>
    </div>
  );
}

export const Time = ({ v }: { v?: string | null }) => { const { locale } = usePrefs(); return <>{fmtTime(v, locale)}</>; };
export function LiveDot({ ok }: { ok: boolean }) {
  const { t } = usePrefs();
  return <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold', ok ? 'chip-completed' : 'chip-waiting')}><span className={cx('size-2 rounded-full bg-current', ok && 'pulse')} />{ok ? t('common.live') : t('common.offline')}</span>;
}
