'use client';
import { useEffect, useRef, useState } from 'react';
import { Mic, Square } from 'lucide-react';
import { usePrefs } from './providers';
import { cx } from './ui';

/** Voice → text using the browser's Web Speech API. Appends recognised speech via onText. */
export function Dictate({ onText, lang, className }: { onText: (t: string) => void; lang: string; className?: string }) {
  const { t, toast } = usePrefs();
  const [on, setOn] = useState(false); const [ok, setOk] = useState(true);
  const rec = useRef<any>(null); const want = useRef(false); const cb = useRef(onText); cb.current = onText;
  useEffect(() => { setOk(!!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)); return () => { want.current = false; rec.current?.stop?.(); }; }, []);
  const stop = () => { want.current = false; rec.current?.stop(); setOn(false); };
  const start = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast(t('rx.unsupported'), 'err'); return; }
    const r = new SR(); r.lang = lang; r.continuous = true; r.interimResults = false;
    r.onresult = (e: any) => { for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) cb.current(e.results[i][0].transcript.trim()); };
    r.onerror = (e: any) => { if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { toast(t('rx.unsupported'), 'err'); stop(); } };
    r.onend = () => { if (want.current) { try { r.start(); } catch { setOn(false); } } else setOn(false); }; // keep listening until the doctor stops
    rec.current = r; want.current = true; try { r.start(); setOn(true); } catch { want.current = false; }
  };
  if (!ok) return null;
  return (
    <button type="button" onClick={on ? stop : start} aria-pressed={on} title={on ? t('rx.listening') : t('rx.dictate')}
      className={cx('inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition', on ? 'bg-[#B42318] text-white pulse' : 'bg-primary-soft text-primary hover:brightness-95', className)}>
      {on ? <Square className="size-3.5 fill-current" /> : <Mic className="size-3.5" />}{on ? t('rx.listening') : t('rx.dictate')}
    </button>
  );
}
