const CACHE = 'dtp-pwa-v23';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;

  /* 页面优先取线上最新版，断网时才回退缓存；避免新版发布后仍被旧壳挡住。 */
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const resp = await fetch(req, {cache: 'no-store'});
        if (resp.ok) {
          const copy = resp.clone();
          caches.open(CACHE).then(cache => cache.put('./index.html', copy));
        }
        return resp;
      } catch (e) {
        return (await caches.match('./index.html')) || Response.error();
      }
    })());
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req))
  );
});
