// ResQ Service Worker - Basic Offline Support
const CACHE_NAME = 'resq-v5';

// Only cache files that actually exist
const urlsToCache = [
  '/css/style.css',
  '/css/mobile-enhancements.css',
  '/css/theme.css',
  '/js/mobile-utils.js',
  '/js/map.js',
  '/js/forms.js',
  '/js/ui.js'
];

// Install event - cache only known-good assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Add individually so one failure doesn't block all others
      return Promise.allSettled(
        urlsToCache.map(url => cache.add(url).catch(() => {
          console.warn('SW: failed to cache', url);
        }))
      );
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - cache-first for static assets, network-first for pages
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET, cross-origin, mapbox, and CDN requests entirely
  if (
    event.request.method !== 'GET' ||
    url.origin !== self.location.origin ||
    url.hostname.includes('mapbox') ||
    url.hostname.includes('jsdelivr') ||
    url.hostname.includes('unpkg') ||
    url.hostname.includes('fonts.google')
  ) {
    return;
  }

  // Static assets: cache-first
  if (url.pathname.startsWith('/css/') || url.pathname.startsWith('/js/')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        return cached || fetch(event.request).then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // HTML pages: network-first, no caching (content is dynamic/server-rendered)
  // Just let it pass through without SW interference
});

