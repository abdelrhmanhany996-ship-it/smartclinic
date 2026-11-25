/* SmartClinic service worker: offline shell, push notifications, notification click. Live data is never cached. */
const CACHE = 'smartclinic-v1';
const SHELL = ['/icons/icon-192.png', '/icons/icon.svg', '/offline.html'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x !== CACHE).map((x) => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin || u.pathname.startsWith('/api/')) return; // never cache API / SSE
  if (r.mode === 'navigate') { e.respondWith(fetch(r).catch(() => caches.match('/offline.html'))); return; }
  if (u.pathname.startsWith('/_next/static/') || u.pathname.startsWith('/icons/')) {
    e.respondWith(caches.match(r).then((hit) => hit || fetch(r).then((res) => { const c = res.clone(); caches.open(CACHE).then((x) => x.put(r, c)); return res; })));
  }
});
self.addEventListener('push', (e) => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (_) {}
  e.waitUntil(self.registration.showNotification(d.title || 'SmartClinic', { body: d.body || '', icon: '/icons/icon-192.png', badge: '/icons/icon-192.png', tag: d.tag || 'smartclinic', renotify: true, vibrate: [200, 100, 200], data: { url: d.url || '/' } }));
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close(); const url = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => { for (const c of list) { if (c.url.includes(url) && 'focus' in c) return c.focus(); } return self.clients.openWindow(url); }));
});
