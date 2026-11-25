'use client';
import { useEffect } from 'react';

/** Friendly error screen. A stale tab after a new deployment (missing JS chunk) reloads itself once. */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    const stale = /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported|Importing a module script failed/i.test(error.message + error.name);
    if (stale) { try { if (sessionStorage.getItem('sc_reloaded') !== '1') { sessionStorage.setItem('sc_reloaded', '1'); location.reload(); } } catch { location.reload(); } }
    else { try { sessionStorage.removeItem('sc_reloaded'); } catch {} }
  }, [error]);
  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '100dvh', padding: 24, textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 380 }}>
        <div style={{ fontSize: 40 }}>⚕️</div>
        <h1 style={{ fontSize: 20, margin: '8px 0' }}>Something went wrong · حدث خطأ ما</h1>
        <p style={{ color: '#5B7083', fontSize: 14 }}>The page needs a refresh (a new version may have been released).<br />الصفحة تحتاج إعادة تحميل (ربما تم تحديث البرنامج).</p>
        <button onClick={() => { try { sessionStorage.removeItem('sc_reloaded'); } catch {} location.reload(); }} style={{ marginTop: 16, background: '#087E83', color: '#fff', border: 0, borderRadius: 10, padding: '12px 22px', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Reload · إعادة التحميل</button>
        <button onClick={reset} style={{ marginTop: 16, marginInlineStart: 8, background: 'transparent', color: '#087E83', border: '1px solid #087E83', borderRadius: 10, padding: '11px 18px', fontSize: 15, cursor: 'pointer' }}>Retry · محاولة</button>
      </div>
    </div>
  );
}
