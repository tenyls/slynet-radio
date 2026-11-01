// Cache only public shell assets and public catalog data. Never account/API requests or audio.
const CACHE = 'slynet-lite-__BUILD__';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith('slynet-lite-') && key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api/')) return;
  const asset = url.pathname.startsWith('/assets/');
  const data = ['/core.json', '/data/content.json', '/data/catalog.json', '/data/geo.json'].includes(url.pathname);
  if (!asset && !data && request.mode !== 'navigate') return;
  const key = request.mode === 'navigate' ? '/' : url.pathname;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (asset) { const cached = await cache.match(key); if (cached) return cached; }
    try {
      const response = await fetch(request);
      if (response.ok) await cache.put(key, response.clone());
      return response;
    } catch {
      return await cache.match(key) || new Response('Нет сети. Откройте сайт после восстановления соединения.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }
  })());
});
