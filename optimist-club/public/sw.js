// The Optimist Club — minimal, safe service worker.
//
// Strategy:
//   - static assets under /icons/ and the manifest: cache-first
//   - other same-origin GET navigations: network-first with cache fallback
//   - everything else (POST, /api/*, cross-origin): untouched
//
// Bump CACHE_VERSION when the caching logic changes so old caches are purged.

const CACHE_VERSION = "oc-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) =>
        cache.addAll([
          "/manifest.webmanifest",
          "/icons/icon.svg",
          "/icons/icon-192.png",
          "/icons/icon-512.png",
        ])
      )
      .catch(() => {
        // Pre-caching is best-effort; runtime caching covers misses.
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Only ever handle GET.
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never touch cross-origin requests or the API.
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  // Cache-first for immutable-ish static assets.
  if (url.pathname.startsWith("/icons/") || url.pathname === "/manifest.webmanifest") {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
            }
            return response;
          })
      )
    );
    return;
  }

  // Network-first with cache fallback for page navigations, so the app
  // still opens (with the last-seen page) when briefly offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match("/"))
            .then(
              (cached) =>
                cached ||
                new Response("You appear to be offline.", {
                  status: 503,
                  headers: { "Content-Type": "text/plain" },
                })
            )
        )
    );
  }
  // All other requests (scripts, styles, data) fall through to the network.
});
