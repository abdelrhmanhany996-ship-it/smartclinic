import { Client } from 'pg';
import { pool } from './db';

/** Realtime hub: Postgres LISTEN/NOTIFY → in-process subscribers → Server-Sent Events. Multi-instance safe. */
export interface LiveEvent { clinicId: string; doctorId?: string | null; date?: string; appointmentIds?: string[]; type: string }
type Listener = (e: LiveEvent) => void;
const g = globalThis as unknown as { __hub?: { listeners: Set<Listener>; started: boolean } };
const hub = (g.__hub ??= { listeners: new Set(), started: false });

/** Serverless hosts cannot keep a LISTEN connection per instance (it exhausts the DB pool): realtime falls back to fast polling. */
export const realtimeEnabled = !process.env.VERCEL && process.env.REALTIME !== 'off';

async function start() {
  if (hub.started || !realtimeEnabled) return;
  hub.started = true;
  const connect = async () => {
    const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: process.env.PGSSL === 'require' ? { rejectUnauthorized: false } : undefined });
    c.on('error', () => retry());
    c.on('end', () => retry());
    c.on('notification', (m) => {
      try { const e = JSON.parse(m.payload || '{}'); hub.listeners.forEach((l) => l(e)); } catch {}
    });
    try { await c.connect(); await c.query('listen sc_events'); } catch { retry(); }
  };
  let t: NodeJS.Timeout | undefined;
  const retry = () => { if (t) return; t = setTimeout(() => { t = undefined; connect(); }, 2000); };
  await connect();
}

export function subscribe(l: Listener) {
  start();
  hub.listeners.add(l);
  return () => { hub.listeners.delete(l); };
}
export async function emit(e: LiveEvent, client?: { query: Function }) {
  if (!realtimeEnabled) return;
  await (client ?? pool).query('select pg_notify($1, $2)', ['sc_events', JSON.stringify(e)]);
}

/** Build an SSE Response that forwards matching events as `refresh` pings. */
export function sseResponse(req: Request, match: (e: LiveEvent) => boolean) {
  if (!realtimeEnabled) return new Response(null, { status: 204 }); // tells EventSource to stop; the client switches to polling
  const enc = new TextEncoder();
  let cleanup = () => {};
  const stream = new ReadableStream({
    start(ctrl) {
      const send = (s: string) => { try { ctrl.enqueue(enc.encode(s)); } catch {} };
      send('retry: 2000\nevent: ready\ndata: {}\n\n');
      const unsub = subscribe((e) => { if (match(e)) send(`event: refresh\ndata: ${JSON.stringify({ type: e.type })}\n\n`); });
      const hb = setInterval(() => send(': hb\n\n'), 20000);
      cleanup = () => { unsub(); clearInterval(hb); };
      req.signal.addEventListener('abort', () => { cleanup(); try { ctrl.close(); } catch {} });
    },
    cancel() { cleanup(); },
  });
  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' } });
}
