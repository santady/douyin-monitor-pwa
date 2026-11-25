const CACHE = "pulse-atlas-shell-a7b4525bcf53a8350918";
const INDEX_URL = new URL('./index.html', self.registration.scope).href;
const SCOPE_PATH = new URL(self.registration.scope).pathname;
const PRECACHE = [
  "./apple-touch-icon.png",
  "./assets/AssetsPage-D0WmrBff.js",
  "./assets/AssetsPage-DteiKDJc.css",
  "./assets/CrossPage-ByNaz3Hl.js",
  "./assets/CrossPage-CuUu8eZe.css",
  "./assets/EmptyState.vue_vue_type_script_setup_true_lang-B_l8dY4W.js",
  "./assets/OperationsPage-BubwDniX.js",
  "./assets/OperationsPage-C7jIzgVV.css",
  "./assets/OverviewPage-DqRpcAoP.css",
  "./assets/OverviewPage-Lf7xXyMX.js",
  "./assets/SettingsPage-6R0j8DXU.js",
  "./assets/SettingsPage-CUBkINR_.css",
  "./assets/StudioPage-BrxBwU9g.css",
  "./assets/StudioPage-xk1lXFNh.js",
  "./assets/TrendChart-BDX49Wiu.js",
  "./assets/TrendChart-U8aFXkiU.css",
  "./assets/WorkbenchPage-BwBGDPXq.css",
  "./assets/WorkbenchPage-D0AhOWVG.js",
  "./assets/index-BxXjCuaH.css",
  "./assets/index-YokmlPl6.js",
  "./assets/insights-BHXr6rje.js",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-192.png",
  "./icon-maskable-512.png",
  "./icon.svg",
  "./index.html",
  "./manifest.webmanifest"
];
const ASSET_PATHS = new Set([
  "./assets/AssetsPage-D0WmrBff.js",
  "./assets/AssetsPage-DteiKDJc.css",
  "./assets/CrossPage-ByNaz3Hl.js",
  "./assets/CrossPage-CuUu8eZe.css",
  "./assets/EmptyState.vue_vue_type_script_setup_true_lang-B_l8dY4W.js",
  "./assets/OperationsPage-BubwDniX.js",
  "./assets/OperationsPage-C7jIzgVV.css",
  "./assets/OverviewPage-DqRpcAoP.css",
  "./assets/OverviewPage-Lf7xXyMX.js",
  "./assets/SettingsPage-6R0j8DXU.js",
  "./assets/SettingsPage-CUBkINR_.css",
  "./assets/StudioPage-BrxBwU9g.css",
  "./assets/StudioPage-xk1lXFNh.js",
  "./assets/TrendChart-BDX49Wiu.js",
  "./assets/TrendChart-U8aFXkiU.css",
  "./assets/WorkbenchPage-BwBGDPXq.css",
  "./assets/WorkbenchPage-D0AhOWVG.js",
  "./assets/index-BxXjCuaH.css",
  "./assets/index-YokmlPl6.js",
  "./assets/insights-BHXr6rje.js"
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
