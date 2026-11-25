'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

export async function api<T = any>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const r = await fetch(path, { method: opts.method ?? (opts.body ? 'POST' : 'GET'), headers: opts.body ? { 'Content-Type': 'application/json' } : undefined, body: opts.body ? JSON.stringify(opts.body) : undefined, cache: 'no-store' });
  const j = await r.json().catch(() => ({}));
  if (r.status === 401 && typeof window !== 'undefined' && !path.startsWith('/api/auth') && !path.startsWith('/api/track')) window.location.href = '/login';
  if (!r.ok) throw new Error(j.error || `Request failed (${r.status})`);
  return j as T;
}

/** Loads data and refreshes it whenever the realtime stream pings (plus a slow safety poll). */
export function useLive<T>(path: string | null, sse: string | null, opts: { poll?: number } = {}) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(true);
  const [tick, setTick] = useState(0);
  const pathRef = useRef(path); pathRef.current = path;
  const seq = useRef(0);

  const load = useCallback(async () => {
    const p = pathRef.current; if (!p) return;
    const n = ++seq.current;
    try { const d = await api<T>(p); if (n === seq.current) { setData(d); setError(null); } } catch (e: any) { if (n === seq.current) setError(e.message); }
  }, []);
  useEffect(() => { setData(null); load(); }, [path, load]);
  useEffect(() => {
    if (!sse) return;
    let es: EventSource | null = null, closed = false;
    const open = () => {
      es = new EventSource(sse);
      es.addEventListener('ready', () => { setConnected(true); load(); });
      es.addEventListener('refresh', () => { load(); setTick((x) => x + 1); });
      es.onerror = () => { setConnected(false); };
    };
    open();
    const poll = setInterval(load, opts.poll ?? 30000);
    const vis = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', vis);
    return () => { closed = true; es?.close(); clearInterval(poll); document.removeEventListener('visibilitychange', vis); };
  }, [sse, load, opts.poll]);
  return { data, error, connected, reload: load, tick, setData };
}
