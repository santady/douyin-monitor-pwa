const CACHE = "pulse-atlas-shell-3288a7001b77619505fc";
const INDEX_URL = new URL('./index.html', self.registration.scope).href;
const SCOPE_PATH = new URL(self.registration.scope).pathname;
const PRECACHE = [
  "./apple-touch-icon.png",
  "./assets/AssetsPage-BVqNcN9i.js",
  "./assets/AssetsPage-DbF3K7gi.css",
  "./assets/CrossPage-CwzBHH8Q.css",
  "./assets/CrossPage-DI8uvOJU.js",
  "./assets/EmptyState.vue_vue_type_script_setup_true_lang-sRRuCrTO.js",
  "./assets/MetricDelta.vue_vue_type_script_setup_true_lang-DI4U4NjK.js",
  "./assets/OperationsPage-C7yiVV_C.css",
  "./assets/OperationsPage-D0NaeWPh.js",
  "./assets/OverviewPage-B66ErQwj.js",
  "./assets/OverviewPage-Couwza-4.css",
  "./assets/RadarPage-Bj-ky5Mm.css",
  "./assets/RadarPage-BpUjkKk_.js",
  "./assets/SettingsPage-8ak7gD7a.js",
  "./assets/SettingsPage-CQtAs2Y0.css",
  "./assets/StudioPage-BJp7i0YG.css",
  "./assets/StudioPage-CZg3P5Pa.js",
  "./assets/WorkbenchPage-CccW9p6P.css",
  "./assets/WorkbenchPage-DWTEKUX9.js",
  "./assets/index-CS0NHmC4.js",
  "./assets/index-UGuFnHaw.css",
  "./assets/ranking-CNVbv3cf.js",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-192.png",
  "./icon-maskable-512.png",
  "./icon.svg",
  "./index.html",
  "./manifest.webmanifest"
];
const ASSET_PATHS = new Set([
  "./assets/AssetsPage-BVqNcN9i.js",
  "./assets/AssetsPage-DbF3K7gi.css",
  "./assets/CrossPage-CwzBHH8Q.css",
  "./assets/CrossPage-DI8uvOJU.js",
  "./assets/EmptyState.vue_vue_type_script_setup_true_lang-sRRuCrTO.js",
  "./assets/MetricDelta.vue_vue_type_script_setup_true_lang-DI4U4NjK.js",
  "./assets/OperationsPage-C7yiVV_C.css",
  "./assets/OperationsPage-D0NaeWPh.js",
  "./assets/OverviewPage-B66ErQwj.js",
  "./assets/OverviewPage-Couwza-4.css",
  "./assets/RadarPage-Bj-ky5Mm.css",
  "./assets/RadarPage-BpUjkKk_.js",
  "./assets/SettingsPage-8ak7gD7a.js",
  "./assets/SettingsPage-CQtAs2Y0.css",
  "./assets/StudioPage-BJp7i0YG.css",
  "./assets/StudioPage-CZg3P5Pa.js",
  "./assets/WorkbenchPage-CccW9p6P.css",
  "./assets/WorkbenchPage-DWTEKUX9.js",
  "./assets/index-CS0NHmC4.js",
  "./assets/index-UGuFnHaw.css",
  "./assets/ranking-CNVbv3cf.js"
].map(path => new URL(path, self.registration.scope).pathname));
const BYPASS_PATHS = /^\/(?:api|xhsapi|file)(?:\/|$)/;

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(PRECACHE);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(key => key.startsWith('pulse-atlas-shell-') && key !== CACHE)
      .map(key => caches.delete(key)));
    // pulse-atlas-data-v2 belongs to the application's public mirror data,
    // not to this shell, and must survive every shell upgrade.
    await self.clients.claim();
  })());
});

async function cacheFirstAsset(request) {
  try {
    const cached = await caches.match(request, { ignoreSearch: true });
    if (cached) return cached;
  } catch (_) {
    // A disabled/full Cache API must not prevent a network asset read.
  }
  const response = await fetch(request);
  if (response.ok) {
    try {
      const cache = await caches.open(CACHE);
      await cache.put(request, response.clone());
    } catch (_) {
      // The response remains usable even when it cannot be persisted.
    }
  }
  return response;
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  const localPath = url.pathname.startsWith(SCOPE_PATH)
    ? url.pathname.slice(SCOPE_PATH.length)
    : url.pathname;
  if (BYPASS_PATHS.test('/' + localPath.replace(/^\/+/, ''))) return;

  /* Navigation is network-first so a newly published shell is visible online;
     only a failed network request falls back to the precached index. */
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(req, { cache: 'no-store' });
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE)
            .then(cache => cache.put(INDEX_URL, copy))
            .catch(() => {});
        }
        return response;
      } catch (_) {
        try {
          return (await caches.match(INDEX_URL)) || Response.error();
        } catch (_) {
          return Response.error();
        }
      }
    })());
    return;
  }

  /* Vite fingerprints these files.  They can be served cache-first without
     serving a stale entry point; the index above remains network-first. */
  if (ASSET_PATHS.has(url.pathname)) {
    event.respondWith(cacheFirstAsset(req));
  }
});
