// public/sw.js
self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
  // Optional: Precache assets here if needed later
  // event.waitUntil(caches.open('my-cache-v1').then((cache) => {
  //   return cache.addAll(['/', '/index.html', '/src/main.ts', '/src/App.vue']);
  // }));
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
});

self.addEventListener('fetch', (event) => {
  // console.log('Fetching:', event.request.url);
  // Optional: Basic cache-first strategy or network-first
  // event.respondWith(
  //   caches.match(event.request).then((response) => {
  //     return response || fetch(event.request);
  //   })
  // );
});
