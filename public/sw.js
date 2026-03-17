// Basic Service Worker for PWA installability
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installed');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activated');
});

self.addEventListener('fetch', (event) => {
    // Service Worker must have a fetch handler for PWA installability
    event.respondWith(fetch(event.request));
});
