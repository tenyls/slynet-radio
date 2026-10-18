// SlyNet Radio — service worker: быстрый запуск и работа оболочки без сети.
// Радиопотоки, каталог станций и внешние сервисы НЕ кэшируются.
const CACHE = 'slynet-shell-v3';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./', 'index.html', 'logo.png', 'manifest.webmanifest'])));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  // content.json и страница — сначала сеть (чтобы правки из админки сразу были видны)
  // Данные (content.json, catalog.json) и страницы — всегда сначала сеть, чтобы обновления сразу были видны
  if (url.pathname.endsWith('.json') && !url.pathname.endsWith('manifest.webmanifest')) {
    e.respondWith(fetch(req, { cache: 'no-store' }).catch(() => caches.match(req)));
    return;
  }
  const networkFirst = req.mode === 'navigate' || !url.pathname.includes('/assets/');
  if (networkFirst) {
    e.respondWith(
      fetch(req, { cache: 'no-cache' })
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('index.html')))
    );
    return;
  }

  // Файлы сборки (с хэшем в имени) — из кэша, иначе из сети
  e.respondWith(
    caches.match(req).then(
      (cached) =>
        cached ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
    )
  );
});
